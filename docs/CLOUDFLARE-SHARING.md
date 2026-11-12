# Share Flippy through Cloudflare

`scripts/share-cloudflare.js` runs the updated call page on loopback port 3400 and connects it to a temporary Cloudflare HTTPS URL. It starts two labeled test partners in that share server's queue. Automatic hearts remain disabled. This queue is separate from the local Test Lab on port 3300.

On this computer, open http://localhost:3400/ or the Open Flippy.url shortcut while the share server is running. Opening public/index.html directly now redirects to that local server, because file URLs cannot run the signaling application or resolve its server routes correctly. A custom SHARE_PORT requires opening that port explicitly. The file-entry redirect and styled UI were verified with node scripts/check-launch.js.

Install the official Cloudflare tunnel binary, then run:

```powershell
node scripts/share-cloudflare.js --cloudflared "C:/path/to/cloudflared.exe"
```

The script prints `FLIPPY_PUBLIC_URL=https://...trycloudflare.com`. Keep the process and this computer running. Anyone with that URL can open the call page; no private videos/files are published by this command. The page starts a camera only after the visitor allows it. The regular WebSocket/camera gates remain active.

The share server does not expose the Test Lab HTML or its bot-control API. Its two bot roles are authenticated using a random process-memory token; ordinary clients cannot select their own role. The existing local Lab remains separate and controls only its own bots.

Options: `SHARE_PORT` (default 3400), `SHARE_BOTS` (0–4, default 2), `CLOUDFLARED_PATH`, `BROWSER_CHANNEL`, and `ICE_SERVERS_JSON`. Chrome must be installed for test partners. Stop the sharing process with Ctrl+C to close its browser, server and tunnel. No domain, account or permanent hosting is configured.

Cloudflare forwards HTTPS and WebSocket signaling; it does not automatically supply a WebRTC TURN relay. The existing default STUN configuration is used, but restrictive networks may still need TURN. A successful local/simulated-camera call is not evidence of universal mobile/cross-network compatibility.

Quick Tunnels are temporary development links and have no uptime guarantee; their hostname changes on restart. For permanent deployment, provision durable hosting, a named Cloudflare Tunnel/domain, TURN and production operations separately. [Cloudflare Quick Tunnel documentation](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
