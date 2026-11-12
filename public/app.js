import { GestureMachine, twoFingersTogether, metricHands, scissorState } from '/shared/gestures.js';
import { CameraSampler } from './camera.js';
import { HeartBalloons } from './reactions.js';
import { RgcVisuals3D } from './visuals3d.js';
import { HandFilter, inferenceSize } from '/shared/hand-filter.js';
import { GestureFeedbackRenderer } from './gesture-feedback.js';
import { record, inference, report, downloadReport } from './diagnostics.js';
import { acquireConversationStream, hasMicrophone } from './media.js';
import { AsyncScope } from '/shared/async-scope.js';
import { initI18n, t, setLanguage, getLanguage, TRANSLATIONS } from './i18n.js';

initI18n();

const elements = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
const sampler = new CameraSampler(elements.localVideo);
const gestures = new GestureMachine();
const hearts = new HeartBalloons(elements.hearts, () => elements.reduceMotion.checked);
const feedback = elements.gestureFeedback ? new GestureFeedbackRenderer(elements.gestureFeedback, () => elements.reduceMotion.checked) : null;
const visuals3d = elements.threeCanvas ? new RgcVisuals3D(elements.threeCanvas, () => elements.reduceMotion.checked) : null;
const handFilter = new HandFilter();
let inferenceInterval = 40;
let labEnabled = false;
elements.reduceMotion.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
let isSimulatedCamera = false;
let simCanvas = null;
let simTimer = null;
let stream = null;
let socket = null;
let peer = null;
let micAudioContext = null;
let boostedMicTrack = null;
let room = null;
let candidates = [];
let iceServers = [];
let wantsChat = false;
let userMuted = false;
let eligible = false;
let healthState = 'off';
let state = 'idle';
let sequence = 0;
let reconnectAttempt = 0;
let reconnectTimer;
let connectionTimer;
let disconnectTimer;
let cameraGeneration = 0;
let mediaPending = false;
let lastSkipAt = -Infinity;
let currentDeviceId = null;
let availableCameras = [];
async function updateCameraList() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(d => d.kind === 'videoinput');
    if (availableCameras.length > 1) {
      const realCam = availableCameras.find(d => d.label && !/droidcam|virtual|obs/i.test(d.label));
      const currentCam = availableCameras.find(d => d.deviceId === currentDeviceId);
      if (realCam && (!currentDeviceId || (currentCam && /droidcam|virtual|obs/i.test(currentCam.label)))) {
        currentDeviceId = realCam.deviceId;
      }
    } else if (availableCameras.length === 1 && !currentDeviceId) {
      currentDeviceId = availableCameras[0].deviceId;
    }
    if (elements.switchCameraBtn) {
      elements.switchCameraBtn.hidden = availableCameras.length <= 1;
    }
    if (elements.cameraSelect) {
      elements.cameraSelect.innerHTML = '';
      for (const cam of availableCameras) {
        const option = document.createElement('option');
        option.value = cam.deviceId;
        option.textContent = cam.label || `Camera ${elements.cameraSelect.children.length + 1}`;
        if (cam.deviceId === currentDeviceId) option.selected = true;
        elements.cameraSelect.appendChild(option);
      }
    }
  } catch (err) {
    console.warn('Could not enumerate devices:', err);
  }
}
let worker;
let workerReady = false;
let workerBusy = false;
let lastDetection = 0;
let gestureEpoch = 0;
let disposed = false;
let currentSessionId = null;
const signalingScope = new AsyncScope();
const labels = { idle: 'Ready when you are', preview: 'Camera preview · not connected', searching: 'Finding someone new…', connecting: 'Connecting your conversation…', chatting: 'You’re connected', paused: 'Matching paused', reconnecting: 'Reconnecting…' };
const labelKeys = { idle: 'labelIdle', preview: 'labelPreview', searching: 'labelSearching', connecting: 'labelConnecting', chatting: 'labelChatting', paused: 'labelPaused', reconnecting: 'labelReconnecting' };
function getStatusLabel(s) {
  return (labelKeys[s] ? t(labelKeys[s]) : '') || labels[s] || s;
}
const transitions = {
  idle: ['preview', 'paused', 'reconnecting'], preview: ['searching', 'paused', 'idle', 'reconnecting'],
  searching: ['connecting', 'paused', 'preview', 'idle', 'reconnecting'], connecting: ['chatting', 'searching', 'paused', 'preview', 'idle', 'reconnecting'],
  chatting: ['searching', 'preview', 'paused', 'idle', 'reconnecting'], paused: ['preview', 'searching', 'idle', 'reconnecting'],
  reconnecting: ['preview', 'searching', 'paused', 'idle']
};
function setState(next) {
  if (next !== state && !transitions[state].includes(next)) return;
  state = next; document.body.dataset.state = state;
  record('session', { state });
  elements.connectionStatus.textContent = getStatusLabel(state);
  elements.startButton.disabled = mediaPending || (!!stream && (!eligible || (!hasMicrophone(stream) && !userMuted) || wantsChat || socket?.readyState !== WebSocket.OPEN));
  elements.startButton.textContent = !stream
    ? t('btnEnableMedia', 'Enable camera & mic')
    : wantsChat
    ? state === 'chatting'
      ? t('btnConnected', 'Connected')
      : t('btnFinding', 'Finding your connection…')
    : state === 'paused'
    ? t('btnResume', 'Resume chatting ↗')
    : t('btnStart', 'Start chatting ↗');
  elements.nextButton.disabled = !eligible || !wantsChat;
  elements.stopButton.disabled = !stream && !mediaPending;
  elements.heartButton.disabled = state !== 'chatting';
  if (elements.blockButton) elements.blockButton.hidden = state !== 'chatting';
  if (elements.micToggleBtn) elements.micToggleBtn.disabled = !stream || mediaPending;
  if (elements.startGestureTestBtn) elements.startGestureTestBtn.disabled = !stream;
  elements.emptyState.hidden = state === 'chatting';
  elements.emptyTitle.textContent = state === 'searching'
    ? t('emptyTitleSearching', 'Finding your next hello…')
    : state === 'connecting'
    ? t('emptyTitleConnecting', 'Making the connection…')
    : state === 'paused'
    ? t('emptyTitlePaused', 'A moment to reconnect.')
    : t('emptyTitle', 'Ready when you are.');
  elements.emptyText.innerHTML = state === 'searching'
    ? t('emptyTextSearching', 'Waiting for another camera-ready person. Try a second browser to test.')
    : state === 'paused'
    ? t('emptyTextPaused', 'Check your camera and microphone, then resume when you’re ready.')
    : t('emptyTextDefault', 'Turn on your camera and microphone to find your next conversation.');
  elements.partnerLabel.textContent = state === 'chatting'
    ? t('partnerLive', 'YOUR NEW CONNECTION')
    : t('partnerNext', 'YOUR NEXT CONNECTION');
}
let currentNoticeKey = null;
let currentNoticeFallback = '';
let currentNoticeWarning = false;
function notice(message, warning = false) {
  let text = message;
  if (TRANSLATIONS?.en?.[message]) {
    currentNoticeKey = message;
    currentNoticeFallback = TRANSLATIONS.en[message];
    text = t(message);
  } else {
    const foundKey = Object.keys(TRANSLATIONS?.en || {}).find(k => TRANSLATIONS.en[k] === message);
    if (foundKey) {
      currentNoticeKey = foundKey;
      currentNoticeFallback = message;
      text = t(foundKey);
    } else {
      currentNoticeKey = null;
      currentNoticeFallback = message;
    }
  }
  currentNoticeWarning = warning;
  elements.notice.textContent = text;
  elements.notice.classList.toggle('warning', warning);
}
function microphoneStatus() {
  if (!elements.micBadge) return;
  const microphone = stream?.getAudioTracks()[0];
  elements.micBadge.textContent = !hasMicrophone(stream) && !userMuted
    ? t('micOff', 'Mic off')
    : userMuted
    ? t('micMuted', 'Mic muted')
    : microphone?.muted
    ? t('micUnavailable', 'Mic unavailable')
    : t('micOn', 'Mic on');
  if (elements.micToggleBtn) {
    elements.micToggleBtn.classList.toggle('muted', userMuted);
    elements.micToggleBtn.setAttribute('aria-label', userMuted ? t('btnUnmute', 'Unmute microphone') : t('btnMute', 'Mute microphone'));
    if (elements.micToggleLabel) elements.micToggleLabel.textContent = userMuted ? t('btnUnmute', 'Unmute') : t('btnMute', 'Mute');
  }
}
function send(message) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
function resetGestures(options) { gestures.reset(options); handFilter.reset(); gestureEpoch = performance.now(); }
function closePeer({ resetSignaling = true } = {}) {
  if (resetSignaling) signalingScope.reset();
  clearTimeout(connectionTimer); clearTimeout(disconnectTimer);
  if (peer) {
    peer.onconnectionstatechange = null;
    peer.oniceconnectionstatechange = null;
    peer.onicecandidate = null;
    peer.ontrack = null;
    peer.close();
  }
  if (boostedMicTrack) {
    try { boostedMicTrack.stop(); } catch {}
    boostedMicTrack = null;
  }
  if (micAudioContext) {
    try { micAudioContext.close(); } catch {}
    micAudioContext = null;
  }
  elements.remoteVideo.pause();
  elements.remoteVideo.srcObject = null;
  elements.remoteVideo.muted = false;
  elements.remoteVideo.volume = 1.0;
  if (elements.audioButton) elements.audioButton.hidden = true;
  peer = null; room = null; candidates = []; resetGestures({ preserveCooldown: true });
}
function pause(message) {
  wantsChat = false; send({ type: 'stop' }); closePeer(); setState('paused'); notice(message, true);
}
async function enableCamera() {
  if (mediaPending) return;
  mediaPending = true;
  const generation = ++cameraGeneration;
  elements.startButton.disabled = true; elements.retryButton.disabled = true;
  wantsChat = false; eligible = false; send({ type: 'stop' }); closePeer();
  userMuted = false;
  stream?.getTracks().forEach(track => track.stop()); stream = null; sampler.detach();
  microphoneStatus();
  elements.stopButton.disabled = false;
  notice('Allow camera and microphone access in your browser to start a conversation.');
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera and microphone access need HTTPS or localhost.');
    const videoConstraints = {
      width: { ideal: 960 },
      height: { ideal: 720 },
      ...(currentDeviceId ? { deviceId: { exact: currentDeviceId } } : { facingMode: { ideal: 'user' } })
    };
    const acquired = await acquireConversationStream(navigator.mediaDevices, videoConstraints);
    if (generation !== cameraGeneration || disposed) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired;
    microphoneStatus();
    const microphone = stream.getAudioTracks()[0];
    if (microphone?.applyConstraints) {
      microphone.applyConstraints({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }).catch(() => {});
    }
    microphone.addEventListener('ended', () => {
      if (stream !== acquired) return;
      microphoneStatus(); pause('Microphone disconnected or permission changed. Use Restart camera & mic to restore it.');
    });
    for (const eventName of ['mute', 'unmute']) microphone.addEventListener(eventName, () => {
      if (stream !== acquired) return;
      microphoneStatus();
      if (microphone.muted) notice('Your microphone is temporarily unavailable. Check the device connection.', true);
    });
    const activeTrack = stream.getVideoTracks()[0];
    if (activeTrack) {
      const settings = activeTrack.getSettings?.();
      if (settings?.deviceId) currentDeviceId = settings.deviceId;
    }
    await updateCameraList();
    if (generation !== cameraGeneration || disposed) return;
    elements.localVideo.srcObject = stream;
    try { await elements.localVideo.play(); } catch {}
    if (generation !== cameraGeneration || disposed) return;
    sampler.attach(stream);
    elements.localEmpty.hidden = true; elements.cameraBadge.textContent = 'CAMERA ON';
    const track = stream.getVideoTracks()[0];
    track.addEventListener('ended', () => { if (stream !== acquired) return; eligible = false; pause('Camera disconnected. Restart your camera to recover.'); });
    track.addEventListener('mute', () => { if (stream !== acquired) return; eligible = false; pause('Camera temporarily unavailable. Check it before resuming.'); });
    setState('preview'); notice('Microphone is on. Checking your camera before you connect.');
    startWorker();
  } catch (error) {
    if (generation !== cameraGeneration || disposed) return;
    userMuted = false;
  stream?.getTracks().forEach(track => track.stop()); stream = null; sampler.detach();
    microphoneStatus();
    elements.localEmpty.hidden = false; elements.cameraBadge.textContent = 'CAMERA OFF'; setState('idle');
    if (error.name === 'NotAllowedError') {
      notice('Camera or microphone permission was denied. Open your browser’s site permissions, allow both Camera and Microphone, then try again.', true);
    } else if (error.name === 'NotReadableError') {
      notice('Camera or microphone could not be opened. Close other apps using the device, check your system privacy settings, and try again.', true);
    } else if (error.name === 'NotFoundError') {
      notice('A camera or microphone was not found. Connect both devices and try again.', true);
    } else {
      notice(error.message || 'Camera or microphone unavailable. Check your system and browser permissions.', true);
    }
  } finally {
    if (generation === cameraGeneration) { mediaPending = false; elements.retryButton.disabled = false; setState(state); }
  }
}
function createSimulatedStream() {
  if (!simCanvas) {
    simCanvas = document.createElement('canvas');
    simCanvas.width = 640;
    simCanvas.height = 480;
  }
  const ctx = simCanvas.getContext('2d');
  let angle = 0;
  let frameCount = 0;

  const renderSim = () => {
    frameCount++;
    angle += 0.05;
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#0c0714');
    grad.addColorStop(0.5, '#1e0c2b');
    grad.addColorStop(1, '#081726');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    const cx = 320 + Math.sin(angle) * 110;
    const cy = 240 + Math.cos(angle * 1.2) * 70;
    const glow = ctx.createRadialGradient(cx, cy, 15, cx, cy, 140);
    glow.addColorStop(0, '#00ffff');
    glow.addColorStop(0.3, '#ff007f');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(320, 240);
    ctx.rotate(Math.sin(angle * 0.5) * 0.15);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-90, -45, 180, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧪 TEST STREAM', 0, -8);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('ACTIVE & MOVING', 0, 18);
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 240, 40);
    ctx.fillStyle = '#39ff14';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`● 30 FPS • Frames: ${frameCount}`, 20, 35);
  };

  renderSim();
  if (simTimer) clearInterval(simTimer);
  simTimer = setInterval(renderSim, 1000 / 30);

  const canvasStream = simCanvas.captureStream(30);

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001;
      const dest = audioCtx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) canvasStream.addTrack(audioTrack);
    }
  } catch {}

  return canvasStream;
}

async function toggleSimulatedCamera() {
  if (isSimulatedCamera) {
    isSimulatedCamera = false;
    if (simTimer) clearInterval(simTimer);
    simTimer = null;
    notice('Switching to webcam…');
    await enableCamera();
  } else {
    isSimulatedCamera = true;
    stream?.getTracks().forEach(t => t.stop());
    const simStream = createSimulatedStream();
    stream = simStream;
    elements.localVideo.srcObject = stream;
    try { await elements.localVideo.play(); } catch {}
    sampler.attach(stream);
    elements.localEmpty.hidden = true;
    elements.cameraBadge.textContent = 'TEST CAM';
    setState('preview');
    notice('🧪 Test stream active! Frames and motion are guaranteed. Ready to connect.', false);
    startWorker();
  }
}

function stop() {
  ++cameraGeneration; mediaPending = false; elements.retryButton.disabled = false; wantsChat = false; eligible = false; send({ type: 'stop' }); closePeer();
  if (simTimer) { clearInterval(simTimer); simTimer = null; isSimulatedCamera = false; }
  userMuted = false;
  stream?.getTracks().forEach(track => track.stop()); stream = null; sampler.detach();
  microphoneStatus();
  elements.localVideo.srcObject = null; elements.localEmpty.hidden = false; elements.cameraBadge.textContent = 'CAMERA OFF';
  setState('idle'); notice('Chat ended. Your camera and microphone are off.');
}
function join() {
  if (!stream) return;
  if (!hasMicrophone(stream)) { notice('Enable your microphone using Restart camera & mic before starting a chat.', true); return; }
  wantsChat = true;
  if (eligible && healthState === 'ready') {
    send({ type: 'join' });
    setState('searching');
  } else {
    setState('searching');
    notice('Checking camera readiness before finding connection…');
  }
}
function next() {
  const now = performance.now();
  if (!eligible || !wantsChat || now - lastSkipAt < 1600) return;
  lastSkipAt = now;
  record('command', { action: 'skip' });
  visuals3d?.warp();
  closePeer();
  send({ type: 'skip' });
  setState('searching');
}
function react(kind = 'heart') {
  if (state === 'chatting' && room) {
    record('command', { action: kind });
    send({ type: 'reaction', kind, room });
  }
}
function blockPeer() {
  if (state !== 'chatting' || !room) return;
  record('command', { action: 'block' });
  elements.remoteVideo.pause();
  elements.remoteVideo.srcObject = null;
  elements.remoteVideo.muted = true;
  if (elements.remoteCard) {
    elements.remoteCard.classList.add('shielded');
    setTimeout(() => elements.remoteCard.classList.remove('shielded'), 600);
  }
  send({ type: 'block', room });
  closePeer();
  setState('searching');
  notice(t('noticeBlocked', 'Connection ended and blocked. Finding someone new…'));
}

function optimizeSdpAudio(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  return sdp.replace(/a=fmtp:(\d+)\s+([^\r\n]+)/g, (match, pt, params) => {
    if (sdp.includes(`a=rtpmap:${pt} opus/48000`)) {
      let updated = params;
      if (!updated.includes('maxaveragebitrate')) updated += ';maxaveragebitrate=128000';
      if (!updated.includes('useinbandfec')) updated += ';useinbandfec=1';
      if (!updated.includes('usedtx')) updated += ';usedtx=0';
      if (!updated.includes('maxplaybackrate')) updated += ';maxplaybackrate=48000';
      if (!updated.includes('sprop-maxcapturerate')) updated += ';sprop-maxcapturerate=48000';
      return `a=fmtp:${pt} ${updated}`;
    }
    return match;
  });
}

function tuneAudioSender(pc) {
  try {
    const audioSender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
    if (audioSender && audioSender.getParameters) {
      const params = audioSender.getParameters();
      if (params && params.encodings && params.encodings[0]) {
        params.encodings[0].maxBitrate = 128000;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        audioSender.setParameters(params).catch(() => {});
      }
    }
  } catch {}
}

function getTransmittedAudioTrack(rawTrack) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !rawTrack) return rawTrack;
  try {
    micAudioContext ??= new AudioCtx({ latencyHint: 'interactive' });
    if (micAudioContext.state === 'suspended') {
      micAudioContext.resume().catch(() => {});
    }
    const source = micAudioContext.createMediaStreamSource(new MediaStream([rawTrack]));
    const compressor = micAudioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-28, micAudioContext.currentTime);
    compressor.knee.setValueAtTime(24, micAudioContext.currentTime);
    compressor.ratio.setValueAtTime(3.5, micAudioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, micAudioContext.currentTime);
    compressor.release.setValueAtTime(0.25, micAudioContext.currentTime);

    const gainNode = micAudioContext.createGain();
    gainNode.gain.setValueAtTime(2.2, micAudioContext.currentTime);

    source.connect(compressor);
    compressor.connect(gainNode);

    const destination = micAudioContext.createMediaStreamDestination();
    gainNode.connect(destination);

    const boosted = destination.stream.getAudioTracks()[0];
    if (boosted) {
      boosted.enabled = !userMuted;
      boostedMicTrack = boosted;
      return boosted;
    }
  } catch (err) {
    console.warn('Microphone booster fallback to raw track:', err);
  }
  return rawTrack;
}

async function matched(message) {
  if (!stream || (!hasMicrophone(stream) && !userMuted) || !wantsChat || !eligible) { send({ type: 'stop' }); return; }
  visuals3d?.warp();
  wantsChat = true;
  eligible = true;
  closePeer({ resetSignaling: false }); room = message.room; setState('connecting');
  if (elements.partnerType) elements.partnerType.textContent = message.partnerKind === 'bot' ? 'TEST BOT · simulated video' : labEnabled ? 'TEST SESSION' : 'LIVE CONNECTION';
  record('matched', { partnerKind: message.partnerKind ?? 'person' });
  const current = new RTCPeerConnection({
    iceServers: iceServers ?? [],
    iceCandidatePoolSize: 0
  });
  peer = current;
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) current.addTrack(videoTrack, stream);
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    const trackToSend = getTransmittedAudioTrack(audioTrack);
    current.addTrack(trackToSend, stream);
  }
  current.onicecandidate = event => { if (event.candidate && peer === current) send({ type: 'signal', room: message.room, data: { candidate: event.candidate.toJSON() } }); };
  current.ontrack = event => {
    if (peer !== current) return;
    if (event.streams && event.streams[0]) {
      elements.remoteVideo.srcObject = event.streams[0];
    } else {
      let remoteStream = elements.remoteVideo.srcObject;
      if (!remoteStream || !(remoteStream instanceof MediaStream)) {
        remoteStream = new MediaStream();
        elements.remoteVideo.srcObject = remoteStream;
      }
      if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }
    }
    elements.remoteVideo.muted = false;
    elements.remoteVideo.volume = 1.0;
    elements.remoteVideo.play().catch(() => {
      const resume = () => {
        elements.remoteVideo.muted = false;
        elements.remoteVideo.volume = 1.0;
        elements.remoteVideo.play().catch(() => {});
      };
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('touchstart', resume, { once: true });
    });
  };
  const updateConnected = () => {
    if (peer !== current) return;
    if (current.connectionState === 'connected' || current.iceConnectionState === 'connected' || current.iceConnectionState === 'completed') {
      clearTimeout(connectionTimer); clearTimeout(disconnectTimer); setState('chatting'); notice('Say hello! Two fingers + a sideways swipe finds someone new.');
    } else if (current.connectionState === 'failed' || current.iceConnectionState === 'failed') {
      pause('The video connection failed. Resume to try again. Some networks need a configured relay server.');
    } else if (current.connectionState === 'disconnected') {
      notice('Connection interrupted. Giving it a moment to recover…', true);
      clearTimeout(disconnectTimer); disconnectTimer = setTimeout(() => { if (peer === current) pause('Connection lost. Resume to find someone new.'); }, 8000);
    }
  };
  current.onconnectionstatechange = updateConnected;
  current.oniceconnectionstatechange = updateConnected;
  connectionTimer = setTimeout(() => { if (peer === current) pause('Could not establish video. Resume to retry; restrictive networks need a relay server.'); }, 30000);
  if (message.initiator) {
    const offer = await current.createOffer(); if (peer !== current) return;
    const optimizedSdp = optimizeSdpAudio(offer.sdp);
    const desc = new RTCSessionDescription({ type: offer.type, sdp: optimizedSdp });
    await current.setLocalDescription(desc); if (peer !== current) return;
    tuneAudioSender(current);
    send({ type: 'signal', room: message.room, data: { description: current.localDescription.toJSON() } });
  }
}
async function signaling(message) {
  const current = peer;
  if (!current || message.room !== room) return;
  if (message.data.description) {
    try {
      await current.setRemoteDescription(message.data.description);
    } catch (err) {
      console.warn('setRemoteDescription warning:', err);
      return;
    }
    if (current !== peer) return;
    const pending = candidates; candidates = [];
    for (const candidate of pending) {
      if (current !== peer) return;
      try {
        if (candidate && candidate.candidate) await current.addIceCandidate(candidate);
      } catch (err) {
        console.warn('Buffered ICE candidate warning:', err);
      }
    }
    if (current !== peer) return;
    if (message.data.description.type === 'offer') {
      try {
        const answer = await current.createAnswer();
        if (current !== peer) return;
        const optimizedSdp = optimizeSdpAudio(answer.sdp);
        const desc = new RTCSessionDescription({ type: answer.type, sdp: optimizedSdp });
        await current.setLocalDescription(desc);
        if (current !== peer) return;
        tuneAudioSender(current);
        send({ type: 'signal', room, data: { description: current.localDescription.toJSON() } });
      } catch (err) {
        console.warn('answer/localDescription warning:', err);
      }
    }
  } else if (message.data.candidate) {
    if (current.remoteDescription) {
      try {
        if (message.data.candidate && message.data.candidate.candidate) {
          await current.addIceCandidate(message.data.candidate);
        }
      } catch (err) {
        console.warn('Live ICE candidate warning:', err);
      }
    } else if (candidates.length < 80) {
      candidates.push(message.data.candidate);
    }
  }
}
async function connect() {
  clearTimeout(reconnectTimer);
  try {
    const controller = new AbortController();
    const requestTimer = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      const sessionUrl = currentSessionId ? `/api/session?session=${encodeURIComponent(currentSessionId)}` : '/api/session';
      response = await fetch(sessionUrl, { signal: controller.signal });
    }
    finally { clearTimeout(requestTimer); }
    if (!response.ok) throw new Error('Signaling unavailable');
    const configuration = await response.json();
    if (configuration.id) currentSessionId = configuration.id;
    iceServers = configuration.iceServers; labEnabled = configuration.testing === true;
    if (elements.labLink) elements.labLink.hidden = !labEnabled;
    if (elements.labTools) elements.labTools.hidden = !labEnabled;
    if (disposed) return;
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const tokenQuery = currentSessionId ? `?token=${encodeURIComponent(currentSessionId)}` : '';
    const connection = new WebSocket(`${wsProto}//${location.host}/signal${tokenQuery}`);
    socket = connection;
    const openingTimer = setTimeout(() => { if (connection.readyState === WebSocket.CONNECTING) connection.close(); }, 15000);
    connection.onopen = () => {
      clearTimeout(openingTimer);
      reconnectAttempt = 0;
      sequence = 0;
      setState(stream ? 'preview' : 'idle');
      if (stream) {
        notice('Connected. Checking your camera…');
      }
    };
    connection.onmessage = ({ data }) => {
      if (socket !== connection) return;
      let message;
      try { message = JSON.parse(data); } catch { return; }
      if (message.type === 'challenge') send({ type: 'heartbeat', nonce: message.nonce, seq: ++sequence, sample: sampler.telemetry(elements.lowLight.checked) });
      else if (message.type === 'health') {
        eligible = message.eligible; healthState = message.state;
        if (stream) {
          if (message.state === 'warning') {
            if (message.reason.includes('frames are not updating') || message.reason.includes('view is too dark')) {
              notice(`${message.reason}. Matching will pause in ${Math.ceil(message.remainingMs / 1000)}s. Check your camera shutter and lighting.`, true);
            } else {
              notice(`${message.reason}. Matching will pause in ${Math.ceil(message.remainingMs / 1000)}s. Improve lighting or try dim-room checks.`, true);
            }
          }
          else if (!eligible && ['paused', 'off'].includes(message.state)) pause(`${message.reason}. Restore your camera, then resume.`);
          else if (message.state === 'ready') {
            if (wantsChat && !room) join();
            else if (!wantsChat) notice(hasMicrophone(stream) ? 'Camera ready. Microphone is on. Start a conversation when you’re ready.' : 'Camera ready, but your microphone is unavailable. Use Restart camera & mic.', !hasMicrophone(stream));
          }
        }
        setState(state);
      } else if (message.type === 'queued') setState('searching');
      else if (message.type === 'matched' || message.type === 'signal') {
        signalingScope.enqueue(() => message.type === 'matched' ? matched(message) : signaling(message), () => pause('Could not negotiate video. Resume to try a fresh connection.'));
      } else if (message.type === 'ended') {
        closePeer();
        if (wantsChat && eligible) { setState('searching'); send({ type: 'join' }); }
        else if (state !== 'paused') setState(stream ? 'preview' : 'idle');
      } else if (message.type === 'reaction' && message.room === room) {
        record('reaction-received', { kind: message.kind });
        hearts.burst(message);
        visuals3d?.burst(message);
      }
      else if (message.type === 'error') {
        if (message.code === 'camera-required') pause('Camera checks are not ready. Restore a usable camera view, then resume.');
        else if (message.code === 'camera-recovering') notice('Camera is calibrating. Connection will start as soon as it’s ready…');
        else if (message.code.endsWith('rate-limit')) notice('Give it a moment before trying that again.');
      }
    };
    connection.onclose = () => {
      clearTimeout(openingTimer);
      if (socket !== connection || disposed) return;
      eligible = false; closePeer(); setState('reconnecting'); notice('Connection lost. Reconnecting and checking your camera again…', true); scheduleReconnect();
    };
    connection.onerror = () => {};
  } catch { if (!disposed) { setState('reconnecting'); notice('Could not reach the chat server. Retrying…', true); scheduleReconnect(); } }
}
function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, Math.min(10000, 600 * 2 ** Math.min(reconnectAttempt++, 4)) + Math.random() * 250);
}
function startWorker() {
  if (worker || !elements.gesturesEnabled.checked) return;
  elements.gestureStatus.textContent = 'Loading hand gestures…';
  worker = new Worker('/hand-worker.js');
  const failed = () => {
    workerReady = false; workerBusy = false; worker?.terminate(); worker = null;
    elements.gestureStatus.textContent = 'Hand tracking unavailable · buttons still work';
  };
  worker.onerror = failed;
  worker.onmessage = ({ data }) => {
    workerBusy = false;
    if (data.type === 'ready') { workerReady = true; record('worker', { backend: data.backend }); elements.gestureStatus.textContent = '✧ Hand gestures ready'; }
    if (data.type === 'error') failed();
    if (data.type === 'landmarks' && stream && elements.gesturesEnabled.checked && data.time > gestureEpoch && performance.now() - data.time < 500) {
      const rawHands = metricHands(data.hands || [], data.width, data.height);
      const hands = handFilter.update(rawHands, data.time);
      const allowScissor = elements.enableScissorGesture ? elements.enableScissorGesture.checked : true;
      const allowSwipe = elements.enableSwipeGesture ? elements.enableSwipeGesture.checked : true;
      const sensitivity = elements.gestureSensitivity ? elements.gestureSensitivity.value : 'balanced';
      const action = gestures.update(hands, data.time, { allowScissor, allowSwipe, sensitivity });
      try {
        const holdProgress = gestures.state === 'heart-dwell' ? Math.min(100, Math.round(((data.time - gestures.since) / 500) * 100)) : 0;
        feedback?.update(hands, gestures.state, holdProgress, data.width / data.height);
      } catch {}
      recordDiagTelemetry({
        time: data.time,
        hands: hands.length,
        state: gestures.state,
        action,
        scissor: hands.length === 1 ? scissorState(hands[0]) : null,
        velocity: gestures.path > 0 && gestures.motionSince ? gestures.path / Math.max(0.001, (data.time - gestures.motionSince) / 1000) : 0
      });
      inferenceInterval = Math.max(33, Math.min(180, (data.duration || 25) * 1.15));
      inference({ duration: data.duration, hands: hands.length, state: gestures.state });
      if (action) record('gesture', { action });
      if (elements.gestureMeter) elements.gestureMeter.textContent = `${hands.length} hands · ${Math.round(data.duration || 0)} ms · ${gestures.state}`;
      if (action === 'skip' && state === 'chatting') {
        elements.gestureStatus.textContent = 'Skip detected · finding someone new';
        try { feedback?.triggerSkip(); } catch {}
        next();
      } else if (action === 'heart' && state === 'chatting') {
        elements.gestureStatus.textContent = 'Heart detected';
        try { feedback?.triggerHeart(); } catch {}
        react();
      } else if (gestures.state === 'heart-dwell') {
        const holdProgress = Math.min(100, Math.round(((data.time - gestures.since) / 500) * 100));
        elements.gestureStatus.textContent = `Heart held · ${holdProgress}%`;
      } else if (gestures.state === 'swipe-armed') {
        elements.gestureStatus.textContent = 'Ready · move your whole hand sideways';
      } else if (gestures.state === 'swipe-dwell') {
        elements.gestureStatus.textContent = 'Two fingers together · hold briefly';
      } else if (hands.length === 2) {
        elements.gestureStatus.textContent = 'Two hands · join fingertips and thumbs for a heart';
      } else if (hands.length === 1) {
        if (twoFingersTogether(hands[0])) {
          elements.gestureStatus.textContent = 'Two fingers together · swipe sideways to skip';
        } else {
          elements.gestureStatus.textContent = 'Hand in view · hold index and middle fingers together';
        }
      } else if (workerReady) {
        elements.gestureStatus.textContent = '✧ Hand gestures ready';
      }
    }
  };
  worker.postMessage({ type: 'init' });
}
async function detect(now) {
  if (disposed) return;
  if (workerReady && !workerBusy && stream && elements.gesturesEnabled.checked && elements.localVideo.readyState >= 2 && !document.hidden && now - lastDetection >= inferenceInterval) {
    workerBusy = true; lastDetection = now;
    try {
      let bitmap;
      try {
        bitmap = await createImageBitmap(elements.localVideo, inferenceSize(elements.localVideo.videoWidth, elements.localVideo.videoHeight) || {});
      } catch {
        bitmap = await createImageBitmap(elements.localVideo);
      }
      if (worker && workerReady) worker.postMessage({ type: 'frame', bitmap, time: now }, [bitmap]);
      else { bitmap.close(); workerBusy = false; }
    } catch { workerBusy = false; }
  }
  requestAnimationFrame(detect);
}
elements.startButton.onclick = () => {
  elements.remoteVideo.muted = false;
  stream ? join() : enableCamera();
};
elements.retryButton.onclick = enableCamera;
elements.nextButton.onclick = next;
elements.stopButton.onclick = stop;
elements.heartButton.onclick = react;
if (elements.audioButton) {
  elements.audioButton.hidden = true;
  elements.audioButton.onclick = () => {
    elements.remoteVideo.muted = false;
    elements.remoteVideo.play().catch(() => {});
    elements.audioButton.hidden = true;
  };
}
elements.gesturesEnabled.onchange = () => { resetGestures(); if (elements.gesturesEnabled.checked) startWorker(); elements.gestureStatus.textContent = elements.gesturesEnabled.checked ? 'Hand gestures enabled' : 'Hand gestures off · use buttons'; };
elements.helpButton.onclick = () => { elements.guide.scrollIntoView({ behavior: 'smooth', block: 'center' }); elements.helpButton.setAttribute('aria-expanded', 'true'); };
if (elements.switchCameraBtn) {
  elements.switchCameraBtn.onclick = async event => {
    event.stopPropagation();
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    currentDeviceId = availableCameras[nextIndex].deviceId;
    const label = availableCameras[nextIndex].label || `Camera ${nextIndex + 1}`;
    notice(`Switching to: ${label}...`);
    await enableCamera();
  };
}
if (elements.cameraSelect) {
  elements.cameraSelect.onchange = async () => {
    currentDeviceId = elements.cameraSelect.value;
    notice(`Switching camera to: ${elements.cameraSelect.options[elements.cameraSelect.selectedIndex]?.text}...`);
    await enableCamera();
  };
}
if (elements.pipToggle && elements.chatGrid) {
  elements.pipToggle.onclick = event => {
    event.stopPropagation();
    elements.chatGrid.classList.toggle('pip-mode');
    elements.pipToggle.setAttribute('aria-pressed', String(elements.chatGrid.classList.contains('pip-mode')));
  };
}
if (elements.settingsToggle && elements.accessibilityPanel) {
  elements.settingsToggle.onclick = () => {
    elements.accessibilityPanel.open = !elements.accessibilityPanel.open;
    if (elements.accessibilityPanel.open) elements.accessibilityPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
}
elements.accessibilityPanel.addEventListener('toggle', () => elements.settingsToggle.setAttribute('aria-expanded', String(elements.accessibilityPanel.open)));
elements.settingsLink?.addEventListener('click', () => { elements.accessibilityPanel.open = true; });
if (elements.langSelect) {
  elements.langSelect.value = getLanguage();
  elements.langSelect.onchange = (e) => {
    setLanguage(e.target.value);
  };
}
window.addEventListener('flippy:languagechange', () => {
  setState(state);
  microphoneStatus();
  if (currentNoticeKey) {
    notice(currentNoticeKey, currentNoticeWarning);
  }
  const cur = getLanguage();
  document.querySelectorAll('.onboard-lang-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.lang === cur);
  });
});

let currentAppearancePreset = 'natural';
try {
  const savedPreset = localStorage.getItem('flippy_appearance_preset');
  if (['natural', 'soft-light', 'radiance'].includes(savedPreset)) {
    currentAppearancePreset = savedPreset;
  }
} catch {}

function setAppearancePreset(preset) {
  const valid = ['natural', 'soft-light', 'radiance'];
  if (!valid.includes(preset)) preset = 'natural';
  currentAppearancePreset = preset;
  try { localStorage.setItem('flippy_appearance_preset', preset); } catch {}
  if (elements.localVideo) {
    elements.localVideo.classList.remove('appearance-natural', 'appearance-soft-light', 'appearance-radiance');
    elements.localVideo.classList.add(`appearance-${preset}`);
  }
  if (elements.appearanceSelect && elements.appearanceSelect.value !== preset) {
    elements.appearanceSelect.value = preset;
  }
  document.querySelectorAll('.preset-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.preset === preset);
  });
}

function cycleAppearancePreset() {
  const presets = ['natural', 'soft-light', 'radiance'];
  const nextIndex = (presets.indexOf(currentAppearancePreset) + 1) % presets.length;
  const nextPreset = presets[nextIndex];
  setAppearancePreset(nextPreset);
  const presetLabels = {
    'natural': t('appearanceNatural', 'Natural'),
    'soft-light': t('appearanceSoftLight', 'Soft Light'),
    'radiance': t('appearanceRadiance', 'Radiance')
  };
  notice(`${t('appearanceLabel', 'Camera Look')}: ${presetLabels[nextPreset] || nextPreset}`);
}

function showOnboarding(step = 1) {
  if (!elements.onboardingModal) return;
  elements.onboardingModal.hidden = false;
  setOnboardingStep(step);
}

function closeOnboarding() {
  if (!elements.onboardingModal) return;
  elements.onboardingModal.hidden = true;
  try { localStorage.setItem('flippy_onboarded_v2', 'true'); } catch {}
}

function setOnboardingStep(step) {
  const num = Number(step) || 1;
  document.querySelectorAll('.onboard-step-panel').forEach(panel => {
    panel.classList.toggle('active', Number(panel.dataset.step) === num);
  });
  document.querySelectorAll('.onboard-dot').forEach(dot => {
    dot.classList.toggle('active', Number(dot.dataset.step) === num);
  });
}

if (elements.blockButton) elements.blockButton.onclick = blockPeer;

if (elements.appearanceSelect) {
  elements.appearanceSelect.value = currentAppearancePreset;
  elements.appearanceSelect.onchange = e => setAppearancePreset(e.target.value);
}
if (elements.appearanceToggleBtn) {
  elements.appearanceToggleBtn.onclick = event => {
    event.stopPropagation();
    cycleAppearancePreset();
  };
}
if (elements.welcomeTourBtn) {
  elements.welcomeTourBtn.onclick = () => showOnboarding(1);
}

if (elements.onboardCloseBtn) elements.onboardCloseBtn.onclick = closeOnboarding;
if (elements.onboardStartBtn) elements.onboardStartBtn.onclick = () => {
  closeOnboarding();
  if (!stream) enableCamera();
};

document.querySelectorAll('.onboard-btn-next').forEach(btn => {
  btn.onclick = () => {
    const nextStep = btn.dataset.next;
    if (nextStep) setOnboardingStep(nextStep);
  };
});

document.querySelectorAll('.onboard-lang-btn').forEach(btn => {
  btn.onclick = () => {
    const lang = btn.dataset.lang;
    if (lang) {
      setLanguage(lang);
      document.querySelectorAll('.onboard-lang-btn').forEach(b => b.classList.toggle('selected', b === btn));
    }
  };
});

document.querySelectorAll('.preset-card').forEach(card => {
  card.onclick = () => {
    const preset = card.dataset.preset;
    if (preset) setAppearancePreset(preset);
  };
});

setAppearancePreset(currentAppearancePreset);

try {
  if (!localStorage.getItem('flippy_onboarded_v2')) {
    showOnboarding(1);
  }
} catch {}
document.querySelectorAll('nav a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('nav a').forEach(item => { item.classList.remove('nav-active'); item.removeAttribute('aria-current'); });
  link.classList.add('nav-active'); link.setAttribute('aria-current', 'location');
}));
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchActive = false;
const touchTarget = elements.remoteCard || elements.chatGrid;
if (touchTarget) {
  touchTarget.addEventListener('touchstart', event => {
    touchActive = event.touches.length === 1 && !event.target.closest('button, a, input, select');
    if (touchActive) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartTime = performance.now();
    }
  }, { passive: true });
  touchTarget.addEventListener('touchend', event => {
    const validTouch = touchActive; touchActive = false;
    if (validTouch && event.touches.length === 0 && event.changedTouches.length === 1 && wantsChat && eligible) {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      const deltaTime = performance.now() - touchStartTime;
      if (Math.abs(deltaX) > Math.max(72, touchTarget.clientWidth * .16) && Math.abs(deltaX) > Math.abs(deltaY) * 2.4 && deltaTime >= 80 && deltaTime < 700) {
        next();
      }
    }
  }, { passive: true });
  touchTarget.addEventListener('touchcancel', () => { touchActive = false; }, { passive: true });
}
let hiddenTimer = null;
document.addEventListener('visibilitychange', () => {
  resetGestures();
  if (document.hidden) {
    if (wantsChat) {
      clearTimeout(hiddenTimer);
      hiddenTimer = setTimeout(() => {
        if (document.hidden && wantsChat) {
          pause('Chat paused while this tab is hidden. Return and resume when ready.');
        }
      }, 5000);
    }
  } else {
    clearTimeout(hiddenTimer);
  }
});
window.addEventListener('pagehide', () => { disposed = true; clearTimeout(reconnectTimer); stop(); socket?.close(); worker?.terminate(); clearInterval(sampleTimer); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
const sampleTimer = setInterval(() => {
  sampler.sample();
  microphoneStatus();
  if (stream && !hasMicrophone(stream) && !userMuted && wantsChat) pause('Microphone is off. Use Restart camera & mic before resuming.');
  const track = stream?.getVideoTracks()[0];
  if (track && (!track.enabled || track.readyState !== 'live') && wantsChat) { eligible = false; pause('Camera is off. Restore it before resuming.'); }
}, 500);
if (elements.simCamBtn) {
  elements.simCamBtn.addEventListener('click', () => { if (labEnabled) toggleSimulatedCamera(); });
}
if (elements.exportReport) elements.exportReport.onclick = downloadReport;
if (elements.gestureMeter) setInterval(() => {
  if (elements.inferenceMetric) elements.inferenceMetric.textContent = `Inference p95: ${report().snapshot.inferenceP95 ?? '—'} ms`;
}, 1000);

if (elements.micToggleBtn) {
  elements.micToggleBtn.onclick = () => {
    if (!stream) return;
    userMuted = !userMuted;
    stream.getAudioTracks().forEach(track => { track.enabled = !userMuted; });
    if (boostedMicTrack) boostedMicTrack.enabled = !userMuted;
    microphoneStatus();
    setState(state);
  };
}

document.querySelectorAll('.reaction-emoji-btn').forEach(button => {
  button.onclick = event => {
    event.stopPropagation();
    const kind = button.dataset.kind || 'heart';
    react(kind);
  };
});

let diagRecorder = null;
let diagChunks = [];
let diagTelemetry = [];
let diagTimerInterval = null;
let isDiagRunning = false;

function recordDiagTelemetry(sample) {
  if (isDiagRunning) {
    diagTelemetry.push(sample);
  }
}

if (elements.startGestureTestBtn) {
  elements.startGestureTestBtn.onclick = () => {
    if (isDiagRunning || !stream) return;
    startGestureDiagnostic();
  };
}

function startGestureDiagnostic() {
  isDiagRunning = true;
  diagChunks = [];
  diagTelemetry = [];
  if (elements.startGestureTestBtn) elements.startGestureTestBtn.disabled = true;
  if (elements.gestureTestTimer) {
    elements.gestureTestTimer.hidden = false;
    elements.gestureTestTimer.textContent = '15s remaining';
  }
  if (elements.gestureTestResults) elements.gestureTestResults.hidden = true;
  if (elements.downloadDiagVideo) elements.downloadDiagVideo.hidden = true;
  if (elements.downloadDiagTelemetry) elements.downloadDiagTelemetry.hidden = true;

  let timeLeft = 15;
  diagTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      if (elements.gestureTestTimer) elements.gestureTestTimer.textContent = `${timeLeft}s remaining`;
    } else {
      clearInterval(diagTimerInterval);
      stopGestureDiagnostic();
    }
  }, 1000);

  try {
    const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))
      ? 'video/webm;codecs=vp9'
      : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm'))
      ? 'video/webm'
      : '';
    diagRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    diagRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) diagChunks.push(e.data); };
    diagRecorder.start(250);
  } catch (err) {
    console.warn('Diagnostic MediaRecorder init error:', err);
  }
}

function stopGestureDiagnostic() {
  isDiagRunning = false;
  clearInterval(diagTimerInterval);
  if (elements.gestureTestTimer) elements.gestureTestTimer.hidden = true;
  if (elements.startGestureTestBtn) elements.startGestureTestBtn.disabled = !stream;

  if (diagRecorder && diagRecorder.state !== 'inactive') {
    diagRecorder.onstop = () => processDiagResults();
    try { diagRecorder.stop(); } catch { processDiagResults(); }
  } else {
    processDiagResults();
  }
}

function processDiagResults() {
  const totalFrames = diagTelemetry.length;
  const framesWithHands = diagTelemetry.filter(s => s.hands > 0).length;
  const handPercent = totalFrames > 0 ? Math.round((framesWithHands / totalFrames) * 100) : 0;
  const peakVelocity = diagTelemetry.reduce((max, s) => Math.max(max, s.velocity || 0), 0);
  const triggersFired = diagTelemetry.filter(s => s.action).length;

  if (elements.statFrames) elements.statFrames.textContent = String(totalFrames);
  if (elements.statHandSeen) elements.statHandSeen.textContent = `${handPercent}%`;
  if (elements.statPeakVelocity) elements.statPeakVelocity.textContent = peakVelocity.toFixed(2);
  if (elements.statTriggers) elements.statTriggers.textContent = String(triggersFired);

  let feedbackText = '';
  if (totalFrames < 10) {
    feedbackText = '⚠️ Very few inference frames captured. Camera may be slow or overloaded.';
  } else if (handPercent < 20) {
    feedbackText = '⚠️ Hand was barely detected in view (<20% of frames). Make sure your hand is centered in front of the camera with good lighting.';
  } else if (triggersFired > 0) {
    feedbackText = `🎉 Success! Recognized ${triggersFired} gesture trigger(s)! Tracking responded smoothly.`;
  } else {
    const reachedArmed = diagTelemetry.some(s => s.state === 'swipe-armed');
    const sawScissor = diagTelemetry.some(s => s.scissor);
    if (sawScissor) {
      feedbackText = '✂️ Scissor fingers detected! Try opening and closing index+middle fingers twice in rapid succession (under 1.1s) for instant skip.';
    } else if (reachedArmed) {
      feedbackText = `✋ Two fingers held and gesture armed! Peak flick speed was ${peakVelocity.toFixed(2)}. For swipe, flick horizontally faster (reach ~0.20 velocity) or try Scissor Snip.`;
    } else {
      feedbackText = '💡 Tip: Hold index and middle fingers together facing the camera for 0.2s until armed, or use the 2-finger Scissor Snip (✂️ open & close twice) which requires no arm movement!';
    }
  }
  if (elements.gestureTestFeedback) elements.gestureTestFeedback.textContent = feedbackText;
  if (elements.gestureTestResults) elements.gestureTestResults.hidden = false;

  if (diagChunks.length > 0 && elements.downloadDiagVideo) {
    try {
      const videoBlob = new Blob(diagChunks, { type: diagChunks[0].type || 'video/webm' });
      elements.downloadDiagVideo.href = URL.createObjectURL(videoBlob);
      elements.downloadDiagVideo.hidden = false;
    } catch {}
  }

  if (diagTelemetry.length > 0 && elements.downloadDiagTelemetry) {
    try {
      const telemetryBlob = new Blob([JSON.stringify(diagTelemetry, null, 2)], { type: 'application/json' });
      elements.downloadDiagTelemetry.href = URL.createObjectURL(telemetryBlob);
      elements.downloadDiagTelemetry.hidden = false;
    } catch {}
  }
}

setState('idle'); updateCameraList(); connect(); requestAnimationFrame(detect);
