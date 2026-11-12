const elements = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
let latest = null;
let disposed = false;
async function refresh() {
  try {
    const response = await fetch('/api/lab');
    if (!response.ok) throw new Error('Test Lab is unavailable. Start it with npm run lab.');
    latest = await response.json();
    elements.startBots.disabled = latest.busy || latest.bots.length > 0;
    elements.stopBots.disabled = latest.busy || !latest.bots.length;
    elements.labStatus.textContent = latest.error || (latest.busy ? 'Preparing test partners…' : latest.bots.length ? `${latest.bots.length} test partners running` : 'No test partners running');
    elements.bots.replaceChildren(...latest.bots.map(bot => {
      const row = document.createElement('div'); row.className = 'bot-row';
      const avatar = document.createElement('span'); avatar.className = 'bot-avatar'; avatar.textContent = '◈';
      const name = document.createElement('strong'); name.textContent = bot.id;
      const detail = document.createElement('small'); detail.textContent = `SIMULATED · ${bot.reactions} hearts sent`; name.append(detail);
      const state = document.createElement('span'); state.className = 'bot-state'; state.textContent = bot.state;
      row.append(avatar, name, state); return row;
    }));
    elements.labLog.textContent = latest.events.map(event => `${event.at.slice(11, 19)}  ${event.type}  ${event.detail}`).join('\n') || 'Your run events will appear here.';
  } catch (error) { elements.labStatus.textContent = error.message; }
  if (!disposed) setTimeout(refresh, 1500);
}
async function action(path) {
  elements.startBots.disabled = true; elements.stopBots.disabled = true;
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'x-flippy-lab': '1' } });
    if (!response.ok) throw new Error(`Could not perform that action (${response.status}). Refresh and try again.`);
    elements.labStatus.textContent = 'Request accepted…';
  } catch (error) { elements.labStatus.textContent = error.message; }
}
elements.startBots.onclick = () => action(`/api/lab/start?count=${elements.botCount.value}`);
elements.stopBots.onclick = () => action('/api/lab/stop');
elements.exportLab.onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion: 1, source: 'simulated-bot-run', ...latest }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'flippy-bot-run.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
window.addEventListener('pagehide', () => { disposed = true; });
refresh();
