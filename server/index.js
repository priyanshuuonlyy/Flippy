import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { CameraGate } from '../shared/health.js';
import { Matchmaker, Bucket } from './matchmaker.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.cjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.task': 'application/octet-stream' };

export const DEFAULT_ICE_SERVERS = Object.freeze([
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
]);

export function createRgcServer({ origin = 'http://localhost:3000', iceServers = DEFAULT_ICE_SERVERS, now = () => performance.now(), testing = null, botToken = testing?.token } = {}) {
  if (testing && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Test Lab requires an explicit loopback origin');
  const isAuto = origin === 'auto';
  function checkSecure(request) {
    if (!isAuto) return origin.startsWith('https:');
    return request.headers['x-forwarded-proto'] === 'https' || !!request.socket?.encrypted;
  }
  function checkOrigin(reqOrigin, request) {
    if (!reqOrigin) return true;
    if (isAuto) {
      const host = request.headers['x-forwarded-host'] || request.headers.host;
      try { return new URL(reqOrigin).host === host; } catch { return false; }
    }
    return reqOrigin === origin;
  }
  const sessions = new Map();
  const addresses = new Map();
  const matchmaker = new Matchmaker(now);
  function sessionFrom(request) {
    const secure = checkSecure(request);
    const cookieName = secure ? '__Host-rgc' : 'rgc';
    const value = request.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const session = sessions.get(value);
    return session && now() - session.seen < 600000 ? session : null;
  }
  function addressBucket(request) {
    const address = request.socket.remoteAddress;
    if (!addresses.has(address)) {
      if (addresses.size >= 10000) return null;
      addresses.set(address, { bucket: new Bucket(30, 2000, now()), seen: now() });
    }
    const entry = addresses.get(address); entry.seen = now(); return entry.bucket;
  }
  const server = http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=*, microphone=*');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    response.setHeader('Cache-Control', 'no-store');
    try {
      if (testing && request.url?.startsWith('/api/lab')) {
        await testing.handle(request, response); return;
      }
      if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
      const url = new URL(request.url, isAuto ? `http://${request.headers.host || 'localhost'}` : origin);
      if (!testing && url.pathname === '/lab.html') { response.writeHead(404); response.end('Test Lab is disabled'); return; }
      if (url.pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      if (url.pathname === '/api/session') {
        if (!checkOrigin(request.headers.origin, request)) { response.writeHead(403); response.end(); return; }
        if (!addressBucket(request)?.take(now())) { response.writeHead(429); response.end(); return; }
        let session = sessionFrom(request);
        if (!session) {
          if (sessions.size >= 5000) { response.writeHead(503); response.end(); return; }
          const id = randomBytes(32).toString('hex');
          session = { id, seen: now(), gate: new CameraGate(), active: false, kind: botToken && request.headers['x-flippy-bot-token'] === botToken ? 'bot' : 'person' }; sessions.set(id, session);
        }
        session.seen = now();
        const secure = checkSecure(request);
        const cookieName = secure ? '__Host-rgc' : 'rgc';
        response.setHeader('Set-Cookie', `${cookieName}=${session.id}; HttpOnly; SameSite=Strict; Path=/${secure ? '; Secure' : ''}`);
        response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ iceServers, testing: !!testing })); return;
      }
      let base = path.join(root, 'public');
      let relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      if (relative.startsWith('/shared/')) { base = path.join(root, 'shared'); relative = relative.slice(7); }
      if (relative.startsWith('/vendor/')) { base = path.join(root, 'node_modules/@mediapipe/tasks-vision'); relative = relative.slice(7); }
      const target = path.resolve(base, `.${relative}`);
      if (!target.startsWith(base + path.sep)) { response.writeHead(403); response.end(); return; }
      const content = await readFile(target);
      response.setHeader('Content-Type', types[path.extname(target)] ?? 'application/octet-stream');
      response.end(content);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 65536, perMessageDeflate: false });
  server.on('upgrade', (request, socket, head) => {
    const session = sessionFrom(request);
    if (request.url !== '/signal' || !request.headers.origin || !checkOrigin(request.headers.origin, request) || !session || session.active || !addressBucket(request)?.take(now())) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return;
    }
    session.active = true;
    sockets.handleUpgrade(request, socket, head, connection => {
      let failures = 0;
      let alive = true;
      const client = matchmaker.attach(session.id, message => {
        if (connection.readyState !== WebSocket.OPEN) return;
        if (connection.bufferedAmount > 262144) { connection.close(1008, 'Backpressure'); return; }
        connection.send(JSON.stringify(message));
      }, session.gate, session.kind);
      connection.on('message', (bytes, binary) => {
        session.seen = now();
        try {
          if (binary) throw new Error('Binary message');
          matchmaker.receive(client, JSON.parse(bytes.toString()));
        } catch {
          if (++failures >= 3) connection.close(1008, 'Invalid messages');
        }
      });
      connection.on('pong', () => { alive = true; });
      connection.on('error', () => {});
      const ping = setInterval(() => { if (!alive) connection.terminate(); else { alive = false; connection.ping(); } }, 10000);
      connection.on('close', () => { clearInterval(ping); session.active = false; session.seen = now(); matchmaker.detach(client); });
    });
  });
  const timer = setInterval(() => {
    matchmaker.tick();
    for (const [id, session] of sessions) if (!session.active && now() - session.seen > 600000) sessions.delete(id);
    for (const [address, entry] of addresses) if (now() - entry.seen > 600000) addresses.delete(address);
  }, 500);
  return { server, matchmaker, close: async () => {
    clearInterval(timer); for (const socket of sockets.clients) socket.terminate();
    await new Promise(resolve => sockets.close(resolve));
    await new Promise(resolve => server.close(resolve));
  } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const origin = process.env.PUBLIC_ORIGIN || (process.env.PORT ? 'auto' : `http://localhost:${port}`);
  if (process.env.NODE_ENV === 'production' && origin !== 'auto' && !origin.startsWith('https://')) throw new Error('Production requires HTTPS PUBLIC_ORIGIN');
  const iceServers = process.env.ICE_SERVERS_JSON ? JSON.parse(process.env.ICE_SERVERS_JSON) : DEFAULT_ICE_SERVERS;
  const application = createRgcServer({ origin, iceServers });
  const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
  application.server.listen(port, host, () => console.log(`RGC running on ${host}:${port} (origin: ${origin})`));
}
