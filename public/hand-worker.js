self.exports = {};
importScripts('/vendor/vision_bundle.cjs');
const { FilesetResolver, HandLandmarker } = self.exports;
let detector;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      const files = await FilesetResolver.forVisionTasks('/vendor/wasm');
      const options = { baseOptions: { modelAssetPath: '/models/hand_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 };
      try { detector = await HandLandmarker.createFromOptions(files, options); }
      catch { options.baseOptions.delegate = 'CPU'; detector = await HandLandmarker.createFromOptions(files, options); }
      self.postMessage({ type: 'ready', backend: options.baseOptions.delegate });
    } catch (error) { console.error('Hand tracking initialization failed:', error); self.postMessage({ type: 'error' }); }
    return;
  }
  if (data.type === 'frame') {
    try {
      const started = performance.now();
      const result = detector.detectForVideo(data.bitmap, data.time);
      self.postMessage({ type: 'landmarks', hands: result.landmarks, width: data.bitmap.width, height: data.bitmap.height, time: data.time, duration: performance.now() - started });
    } catch (error) { console.error('Hand tracking inference failed:', error); self.postMessage({ type: 'error' }); }
    finally { data.bitmap.close(); }
  }
};
