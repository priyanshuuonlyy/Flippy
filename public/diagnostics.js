const events = [];
const durations = [];
let snapshot = { inferenceP95: null, hands: 0, gestureState: 'idle', session: 'idle', backend: 'loading', frames: 0, gestures: 0, reactionsReceived: 0 };
export function record(type, detail = {}) {
  events.push({ at: Math.round(performance.now()), type, ...detail });
  if (events.length > 300) events.shift();
  if (type === 'session') snapshot.session = detail.state;
  if (type === 'worker') snapshot.backend = detail.backend;
  if (type === 'gesture') snapshot.gestures++;
  if (type === 'reaction-received') snapshot.reactionsReceived++;
  window.dispatchEvent(new CustomEvent('flippy:diagnostic', { detail: { type, ...detail } }));
}
export function inference(detail) {
  if (Number.isFinite(detail.duration)) {
    durations.push(detail.duration); if (durations.length > 120) durations.shift();
    const ordered = [...durations].sort((first, second) => first - second);
    snapshot.inferenceP95 = Math.round(ordered[Math.ceil(ordered.length * .95) - 1]);
  }
  snapshot = { ...snapshot, hands: detail.hands, gestureState: detail.state, frames: snapshot.frames + 1 };
}
export function report() { return { schemaVersion: 1, source: 'local-session-diagnostics', recordedVideo: false, snapshot: { ...snapshot }, events: [...events] }; }
export function downloadReport() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'flippy-session-report.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
