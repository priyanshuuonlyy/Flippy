/**
 * Pings the IndexNow API (Bing, Yandex, Seznam, Naver) for instant crawl & indexation.
 */
import https from 'node:https';

const host = 'flippy-b2yr.onrender.com';
const key = 'c0356bf577884144b6f0e3f225fa55e8';
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  `https://${host}/`,
  `https://${host}/?lang=es`,
  `https://${host}/?lang=pt`,
  `https://${host}/?lang=tr`,
  `https://${host}/?lang=fr`,
  `https://${host}/?lang=de`
];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList
});

const req = https.request('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  console.log(`[IndexNow] Response status: ${res.statusCode} ${res.statusMessage}`);
  res.on('data', d => process.stdout.write(d));
  res.on('end', () => console.log('\n[IndexNow] Batch submission complete.'));
});

req.on('error', err => {
  console.error('[IndexNow] Ping failed:', err.message);
});

req.write(payload);
req.end();
