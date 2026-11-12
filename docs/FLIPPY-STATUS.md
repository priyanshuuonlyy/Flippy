# Flippy implementation and evidence

Prepared 11 November 2026. This iteration is implemented in the workspace's `outputs/rgc` folder. The supplied Downloads/Flippy folder is a separate copy, not a filesystem link. It was inspected but not overwritten. A temporary Cloudflare tunnel now serves the workspace copy; see CLOUDFLARE-SHARING.md. During the microphone update, the public homepage and new media module returned HTTP 200 with the updated code.

## Implemented

- Connection recovery: pending signaling from an old peer cannot block or pause a new call; rapid Next presses are gated before local teardown; capture requests are cancellable and late results cannot affect a replacement preview. Camera sampling counts actual frame progress. Blocked partner audio gets a visible recovery button. See CONNECTION-RECOVERY.md for the reproduced regression and fixes.

- Photo-backed matte interface: supplied portrait/landscape photos selected by viewport orientation, preserved EXIF rotation, crop-brightness palette selection, frosted controls, consistent line icons, contrast-tested panel colors and accessible navigation. Swipe recognition now corrects for camera aspect ratio, follows palm motion, rejects incoherent/diagonal/zigzag/fingertip-only motion, scales travel to hand size and preserves cooldown across room changes. See MATTE-UI-AND-GESTURES.md for implementation details, evidence and limits.

- Microphone permission is requested explicitly together with camera access after the user's button click. The client no longer silently falls back to camera-only capture. It shows Mic on/off/unavailable, explains denied permissions, requires a live microphone before starting a conversation, and releases camera/microphone on Leave. These are client-side capture checks, not a new server attestation of microphone identity.

- Familiar call layout: Flippy identity, large remote video, self-preview, stable next/heart controls, camera switching, responsive desktop/tablet/mobile layouts. Text Leave control instead of a red phone-drop icon. Keyboard/manual controls remain available.
- Isolated loopback Test Lab on port 3300, explicit start/stop for one to four labeled simulated partners, bounded event log and JSON export. Bot-to-bot matching is rejected by the server, and test mode is unavailable on the regular server.
- Real-time recognition remains the existing MediaPipe worker and gesture FSM. Added timestamp-aware One Euro filtering, spatial association when hand result ordering changes, resets after hand loss, aspect-preserving portrait/landscape resize, worker-duration measurements and adaptive scheduling.
- Per-session diagnostics separate gesture detection, command emission, received reaction and session state. Export stores no video or landmarks. p95 is an inference-only rolling measurement, not a physical-device/end-to-end performance guarantee.
- Heart display now follows server acknowledgement; the former immediate local burst could double-render the initiating participant's reaction and circumvent visual rate limiting.
- Consumed heartbeat challenges cannot be replayed with a higher sequence number. A valid previous outstanding nonce can tolerate reordering, but each nonce is consumed once.
- Local call tests respect an explicitly empty ICE configuration. The client no longer silently injects external STUN when the server configured none, and unnecessary ten-connection ICE preallocation was removed.
- The all-tests runner discovers new test files and reports actual counts instead of hardcoding 23 passes.

## Verification record

Latest completed run, connection-recovery update: node scripts/test-all.js exited successfully with **54 unit/transport tests and 8 browser tests passed (62 total, zero failures/skips)**. This includes the original broad camera/reconnect regression, a deterministic stalled-old-ICE reconnect test, rapid Next/rematching, late permission grant/denial after Leave, both gesture actions, microphone lifecycle, responsive appearance and labeled Test Lab partners. The targeted old-ICE test failed before the scoped-queue fix and passed after it. These are browser tests with simulated media/landmarks, not physical-device accuracy measurements.

The records below describe earlier checkpoints and are superseded by that successful complete run.

After the complete run, the existing public Cloudflare link also passed the HTTPS/photo/UI check and a simulated call with a labeled partner: WebSocket signaling, camera gate, microphone capture, remote audio track and no spontaneous hearts. The temporary tunnel was kept running; client files are served with no-store and update on refresh.

Photo/UI/swipe checkpoint: all 47 unit/transport tests passed. Browser checks passed for five layout sizes, microphone lifecycle and scripted landmarks driving one synced reaction and one actual call skip. The public HTTPS tunnel loaded the photo and calibrated UI and completed a labeled test-bot call with live audio tracks and no automatic reactions. These checks used simulated media/landmarks; they did not measure physical hand accuracy. The reconnect timeout was still outstanding at that checkpoint.

Microphone update: six media-acquisition unit tests and the Chrome microphone lifecycle test passed. The latter uses a mobile viewport and simulated media, covers denied permission, retry, capture status, Leave cleanup, a stopped microphone pausing matching, and recovery. The existing permission-denial browser test also passed. The broader two-participant browser test verified remote audio-track delivery before failing at the reconnect wait (`tests/browser.e2e.js:60`); a second run reproduced that timeout. The combined invocation therefore finished with 8 passes and 1 failure, not an all-green suite. Physical microphone audio quality remains unverified. See MICROPHONE.md for the user flow and developer checks.

Earlier implementation record:

Completed observed runs: 27 unit/state-machine/transport tests passed; the two existing Chrome browser tests passed after fixing local ICE configuration; the new Test Lab browser test passed in a separate run. Desktop, tablet-width and mobile-width screenshots were generated, with desktop/mobile and lab views visually inspected. These are 30 checks across completed separate runs, not a claim that the final combined invocation completed.

The initial combined run reported all 27 unit tests passing, but its browser completion could not be retrieved after the execution environment lost its registered runtime. That historical verification gap has now been superseded by the latest completed full-suite run above. The separate Downloads copy remains unchanged.

## Research and future work

The engineering plan cites official documentation, original papers and project repositories. Its recommended long-term language is TypeScript for browser/server/shared contracts, with Python for offline evaluation/training. The existing code is still JavaScript; there is no claim of a completed TypeScript migration or newly trained ML model.

Fairness, low-light recognition, real-hand accuracy, cross-device thermal/performance behavior, iOS/Safari and different-network TURN paths still require actual consenting participants and physical devices. A mobile viewport and a fake camera do not establish those results. Current gesture thresholds and camera luminance checks remain heuristics.

Bot testing does not attest that a camera is physical or a user is live. Virtual cameras, prerecorded feeds, fabricated telemetry and anonymous session resets remain possible. No flawless, zero-error or equal-performance claim is made.

See FLIPPY-ENGINEERING-PLAN.md for concrete proposed release metrics, cohort protocols, rollout stages, and measured-vs-unmeasured distinctions; see FLIPPY-TEST-LAB.md for the repeatable operator workflow.
