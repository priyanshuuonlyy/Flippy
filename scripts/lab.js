import { createRgcServer } from '../server/index.js';
import { LabController } from '../server/lab-controller.js';

const port = Number(process.env.LAB_PORT || 3300);
const origin = `http://localhost:${port}`;
const testing = new LabController(origin);
const application = createRgcServer({ origin, iceServers: [], testing });
application.server.listen(port, '127.0.0.1', () => console.log(`Flippy Test Lab: ${origin}/lab.html\nCamera practice: ${origin}\nLocal test sessions only. No real-user queue is used.`));
let closing = false;
async function close() {
  if (closing) return;
  closing = true; await testing.shutdown(); await application.close();
}
process.on('SIGINT', close); process.on('SIGTERM', close);
