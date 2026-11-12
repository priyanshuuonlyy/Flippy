# Microphone access

Refresh Flippy and select **Enable camera & mic**. Allow Camera and Microphone in the browser permission prompt. **Mic on** means the browser returned a live, enabled audio track. When camera checks finish, select **Start chatting**.

If permission was blocked, open this website's browser permissions, allow Camera and Microphone, then use **Restart camera & mic** under the recovery settings. Also check the operating system's microphone privacy settings and that an input device is connected. A new temporary Cloudflare hostname can require a new permission grant.

The preview stays silent to avoid hearing your own voice. The partner receives the microphone track through WebRTC. If their audio cannot autoplay, **Tap to hear your partner** appears beside the call controls. Leaving releases both camera and microphone and cancels any pending capture request. Next-person and heart actions do not mute the microphone.

## Implementation

`public/media.js` requests audio and video together, with echo cancellation and noise suppression requested for audio. Unsupported constraints or a busy device allow one retry with simpler constraints, still requiring audio. Permission denial is surfaced immediately; there is no camera-only fallback. A returned stream without a live microphone is rejected and its acquired tracks are stopped.

`public/app.js` checks microphone readiness before joining or accepting a match. Track loss or disabling the audio track pauses matching. Temporary browser interruption shows **Mic unavailable**; it does not add a hand gesture that mutes audio. The displayed status describes the capture track, not measured speech volume or a guarantee that the other participant can hear sound. These client checks do not attest physical microphone identity to the server.

## Verification

Run `node --test --test-concurrency=1 tests/media.test.js tests/microphone.e2e.js tests/browser.e2e.js` from the project directory. Tests cover audio constraints, failure handling, no silent video-only fallback, mobile status visibility, retry, track loss, release on Leave, remote audio-track delivery and preserving audio on Next.

Tests use simulated camera and microphone devices. Physical microphone volume, Bluetooth/headset routing, echo quality and mobile browser permission behavior still need device testing. No real microphone permission is granted on behalf of the user.
