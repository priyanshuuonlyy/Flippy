export function hasMicrophone(stream) {
  return !!stream?.getAudioTracks().some(track => track.readyState === 'live' && track.enabled);
}

export async function acquireConversationStream(mediaDevices, video) {
  let acquired;
  try {
    acquired = await mediaDevices.getUserMedia({ video, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (error) {
    if (!['OverconstrainedError', 'NotReadableError'].includes(error.name)) throw error;
    acquired = await mediaDevices.getUserMedia({ video: video.deviceId ? { deviceId: video.deviceId } : true, audio: true });
  }
  if (!hasMicrophone(acquired)) {
    acquired.getTracks().forEach(track => track.stop());
    const error = new Error('No working microphone was returned. Connect a microphone and allow access, then try again.');
    error.name = 'MicrophoneUnavailableError'; throw error;
  }
  return acquired;
}
