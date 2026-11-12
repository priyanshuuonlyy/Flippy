# Connection and capture recovery

Implemented 11 November 2026.

## Fixes

- Signaling work now belongs to a resettable connection scope. Closing a call invalidates queued work and starts a fresh queue. An unresolved ICE operation from the previous peer cannot hold up the next match, and a late failure cannot pause the replacement call.
- Starting the next room preserves the order of its offer, answer and ICE messages. Candidate buffering is scoped to the peer that received those candidates.
- Repeated Next presses are throttled for 1.6 seconds before the local connection is closed. This agrees with the existing server rate limit and prevents a rejected skip from leaving the client disconnected while the server still considers it paired.
- Browser permission requests cannot overlap. Leave cancels the pending operation's authority; a late granted stream is stopped and a late denial cannot stop a newer preview. Camera track callbacks from an old stream are ignored.
- The camera sampler counts delivered video frames, or advancing video time when frame callbacks are unavailable. Timer ticks alone no longer manufacture camera progress. Old callbacks and luminance samples cannot revive a detached stream.
- Remote playback state resets for each peer. If the browser blocks audio autoplay, a visible **Tap to hear your partner** button appears next to the call controls.
- Session HTTP requests and WebSocket opening attempts have ten-second timeouts so a stalled attempt can enter the existing reconnect backoff.

## Evidence

The original broad reconnect check passed on a fresh run, confirming that its earlier failure was intermittent. A new deterministic regression test then held one old ICE operation pending and disconnected signaling: the original implementation timed out. After adding the scoped queue, the same test passed, including reconnecting, rejecting the old operation late, rapid Next presses, rematching and checking that the microphone remains enabled.

The targeted test is tests/reconnect.e2e.js. Unit coverage for pending/stale operations is tests/async-scope.test.js. Capture cancellation is covered in tests/microphone.e2e.js; camera frame accounting is covered in tests/camera-sampler.test.js.

Use node scripts/test-all.js for the complete regression run. FLIPPY-STATUS.md records the latest completed run, rather than treating targeted checks alone as a full pass.

Final complete run: **54 unit/transport tests and 8 browser tests passed**, with no failures or skipped tests. The previously failing broad reconnect check also passed in that run.

## Operating limits

The current Cloudflare link is a temporary test deployment and needs the sharing process and this computer to remain running. It has labeled simulated partners, not a population of live users. Cross-network connections on restrictive networks may still need configured TURN credentials. Physical hand recognition, microphones and mobile/Safari behavior still need actual device verification.

[WebRTC specification](https://w3c.github.io/webrtc-pc/webrtc.html?specStatus=REC) and [MDN connection cleanup](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/close) describe the asynchronous peer-connection lifecycle; the scoped queue and cancellation guards above are this application's implementation choices.
