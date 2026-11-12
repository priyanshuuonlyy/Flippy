# Implementation status

Prepared 11 November 2026. A fresh starter was created because no existing RGC source was available in this workspace. It is not deployed.

| Requested behavior | Implementation |
| --- | --- |
| Two fingers together + horizontal swipe | Implemented with dwell, actual trajectory, velocity, cancellation and release cooldown |
| Remove mute/unmute gestures | No such actions exist; next/heart never toggle microphone state |
| Two-hand heart | Implemented with two-hand landmark geometry and sustained dwell |
| Neon-red outline balloons | 88 thin glowing hearts, upward drift and fade, transparent over visible video |
| Partner reaction sync | Server-acknowledged room-scoped seed event; token bucket, deduplication and particle limits |
| Camera-required matching | Server-owned eligibility and queue/room gates, fresh challenged heartbeat |
| Black/unusable camera for two minutes | Warning then authoritative pause/room removal; sustained healthy recovery |
| Dark rooms and accessibility | Sensitive threshold option, explicit recovery, manual controls, reduced motion |
| Mobile UI First redesign | Modern mobile-first stylesheet, touch swipe gestures, PiP layout toggle, ergonomic bottom controls dock, safe area insets |
| Disconnect/reconnect | Peer grace, negotiation timeout, WebSocket backoff, stale-room protection, fresh camera checks |
| Security validation | Origin/cookie checks, bounded messages, finite telemetry, schema and membership checks, rate limits |
| Tests and developer docs | Unit/state-machine, transport and browser suites; architecture and trust boundaries |

## Automated checks

- Final combined run: **23 passed, 0 failed, 0 skipped**, using `node --test tests/*.test.js tests/browser.e2e.js` on Node 24.13.0 and installed Chrome. Both browser page exceptions and console errors were checked; neither occurred in the successful flow.
- Unit/state-machine/real-transport coverage includes 21 tests, including server-side termination of an active black-camera room at the two-minute limit.
- Two Chrome browser tests cover desktop/mobile layout, real local WebSocket/WebRTC calls, loaded MediaPipe inference, synced visible red-heart rendering, camera disable/recovery, dropped-socket reconnect with a new room, next/stop cleanup, and simulated permission denial. Test camera/microphone sources are synthetic; permission denial is injected.
- Desktop and 390-pixel mobile screenshots were rendered and visually inspected. There is no horizontal mobile overflow in the checked viewport.
- Dependency audit after upgrading `ws` to 8.22.2 reported zero known advisories across the installed production and development dependencies. This is a point-in-time registry check, not proof of absence of vulnerabilities.
- Synthetic hand landmarks exercise stationary poses, horizontal trajectories, vertical movement, discontinuity, dropped frames, heart dwell and held-pose cooldowns.
- Simulated monotonic time covers the full 120-second grace, recovery, lost heartbeats and reconnect history without shortening the production timeout.

## Remaining verification and operational work

- Real hands/cameras: two-finger swipe and heart detection must be verified across hand sizes, skin tones, occlusion, lighting, orientation and mobility needs. Synthetic geometry tests cannot certify visual recognition accuracy.
- Physical unplug/permission revocation, dark-room stationary users, black camera feeds and sleep/background behavior on real devices.
- Safari/iOS and Firefox, slower Android devices, inference performance/thermal behavior and real accessibility testing.
- Two actual devices over different networks, TURN relay credentials and restrictive/firewalled networks. Local simulated-camera calls do not establish WAN reliability.
- Public product operations: moderation/reporting, identity and abuse persistence, metrics, shared state and load testing. These are not delivered as production-complete.

No zero-error or non-bypassable physical-camera claim is made. Virtual cameras, prerecorded feeds, fabricated browser telemetry and anonymous session resets remain limitations described in ARCHITECTURE.md.
