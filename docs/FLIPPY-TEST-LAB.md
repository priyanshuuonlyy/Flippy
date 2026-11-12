# Flippy Test Lab — चलाने और जाँचने का तरीका

## Start

From the updated project folder:

```powershell
node scripts/lab.js
```

Open **http://localhost:3300/lab.html**. Choose two partners and press **Start partners**. Once both are searching, choose **Open camera practice**, enable your real webcam, wait for “Camera ready”, then start chatting. The partner badge must say **TEST BOT**. Use **Leave** to stop your camera/microphone. No red call-drop icon or hand mute action is present.

The installed Chrome browser and development dependencies are required. `BROWSER_CHANNEL=msedge` may select Edge; it is not a claim of tested Edge support. Use `LAB_PORT` for a different local port. This lab is deliberately local-only and has an independent in-memory queue. The regular server does not expose `/api/lab` or `/lab.html`. Its bot API cannot be enabled by a query string or ordinary client message.

## What to test

| Attempt | Expected behavior | Where to look |
| --- | --- | --- |
| Two fingers held still for several seconds | No skip | Session remains with the same partner |
| Two fingers together, pause, then horizontal swipe | One next command | Gesture status, diagnostics, new partner |
| Repeated held pose after swipe | No repeated skipping until release | Event report |
| Two-hand heart held briefly | One server-accepted heart burst | Gesture → command → reaction-received events |
| Wait without making a gesture or pressing a reaction control | No automatic bot hearts | Local reaction event count stays unchanged |
| Natural talking, face touches, waving, V-sign, typing | No unintended skip | Negative-testing observation log |
| Disable gestures | Manual buttons continue working | Settings + call controls |
| Dark, covered, unplugged or paused camera | Warning/pause/explicit recovery as appropriate | Camera notice and authoritative session state |
| Network disconnect | Old room closes; reconnect checks camera afresh | Session-state report |

Start with two bots because the previous partner is avoided for fifteen seconds. Bots never match one another and never automatically send hearts. Their generated media validates connection behavior; reactions require an intentional gesture or manual reaction control. You must present your own real hands to the camera to test visual gesture recognition. Nothing here proves skin-tone parity, liveness or real-world gesture accuracy on its own.

## Reports

In camera practice, expand **Test session diagnostics** and **Export session report**. It contains a bounded history of session transitions, recognized gestures, commands and received reactions plus aggregate inference duration. It saves no video or landmarks. In the lab, **Export bot run report** captures bot lifecycle and state events. Neither export is automatically uploaded.

Inference p95 reflects the last 120 inference measurements and excludes camera capture, frame transfer, dwell and network time. It is not end-to-end latency and is not “zero dropped frames”. The time origin in session reports is the browser's monotonic performance clock; do not subtract timestamps from a different device.

For manual labeled trials, record expected gesture, observed action, lighting, orientation, device/browser, and consented participant code. Separate missing recognition from failed command delivery. Collect skin-tone audit metadata only with informed consent and a documented protocol; no race classification is performed by this app.

## Automated checks

```powershell
node scripts/test-all.js
```

The runner discovers unit and browser test files instead of printing a stale hardcoded “23/23” count. Browser tests use Chrome's synthetic camera: they check loaded inference and call mechanics, not real-hand accuracy. The lab test starts two actual browser bots, verifies isolation, pairs a third test participant, checks the test label, reactions, next, reports and stop cleanup. Separate 390-, 768- and 1440-pixel viewport checks do not replace physical-phone/tablet tests.

## Operational boundaries

- Do not expose the local bot controller through the public tunnel. It can launch up to four headless browser contexts on the developer machine. Same-origin controls and a loopback host are required.
- Test-bot role is assigned by the test server using an in-memory secret header supplied by the controller, not a user-editable `join` role. All bots still pass the usual camera health checks.
- Stop bots through the lab before closing it. Ctrl+C in the lab terminal closes its owned browser and server. Closing the dashboard tab alone does not stop the run.
- The older `scripts/bot.js` is retained for compatibility. Its synthetic stream, optimistic log messages and button presses must not be treated as recognition-quality evidence. Prefer this isolated lab.
- Existing public tunnel and bots are not automatically stopped or restarted by the lab. Deploying validated changes to the live copy is a separate step.
