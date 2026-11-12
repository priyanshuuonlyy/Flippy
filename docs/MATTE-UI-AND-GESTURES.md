# Photo-backed interface and swipe refinement

Implemented 11 November 2026 in the workspace's Flippy project.

## Visual behavior

- Landscape windows use the supplied IMG_20250518_155005857_HDR_AE.jpg mountain photo. Portrait windows use IMG_20250517_025123955_HDR.jpg, the night photo. Both original files are copied into public/assets without changing their pixels. The night photo stores a 90-degree EXIF rotation; the browser displays it upright at 2304 × 4096. The landscape photo displays at 4096 × 2304. The picture element chooses by viewport orientation, including tablet rotation.
- Rounded matte panels, restrained shadows, translucent controls and original inline SVG line icons replace the previous white/teal layout. No Apple branding or Apple icon assets are used. Remote video remains unobscured during calls, apart from the usual labels, self-preview and intentional reactions.
- On image load and debounced resize, a 48 × 48 canvas samples the visible center crop. The 65th percentile of relative luminance selects the light or dark palette. This is scene brightness calibration; it does not measure the user's display or ambient light and does not watch camera pixels. Orientation-based CSS supplies a readable fallback.
- Panel opacity is 88%, so text never relies solely on blur or the background image. Primary and secondary palette text were tested against all neutral background brightness values at this opacity with contrast at least 4.5:1. Because the light/dark extremes bound each RGB channel, this also bounds other underlying photo colors. This is a palette check, not a full accessibility certification.
- No glowing tabs, text or icons, animated wallpaper, blend-mode text or rapid color adaptation. Reduced motion, increased contrast, reduced transparency, missing backdrop-filter support, keyboard focus, accessible navigation names and a skip link have fallbacks. The previously requested neon hearts remain an intentional reaction.

## Swipe behavior

The existing MediaPipe model is retained; no new model has been trained.

1. Convert landmark X coordinates from image-width units to image-height units using the actual inference bitmap dimensions. Distances, palm size and horizontal/vertical comparisons then use the same unit on portrait and landscape cameras.
2. Keep the existing One Euro smoothing. Check that index and middle fingers are extended, close together and approximately parallel, while the other two fingers are folded. Reject extremely small or malformed hands.
3. Require a stable palm for at least 180 ms and three observations before arming. Track the palm rather than fingertip movement alone.
4. Require a predominantly horizontal, coherent palm-and-fingertip movement. Travel scales with palm size, bounded between 9% and 28% of frame height. At least three moving observations, net/path ratio ≥ 0.82, horizontal/vertical ratio ≥ 2.4 and a bounded motion window reject jitter, diagonal moves, zigzags and slow drifting.
5. Cancel on lost hands, large jumps, sudden scale changes or inference gaps over 320 ms. Successful commands retain their cooldown across peer teardown and rematching, and require releasing the gesture before rearming.

Touchscreen swipes also require clear horizontal travel, a bounded duration and a single uninterrupted touch. Touch cancellation or interaction with a button cannot reuse an earlier touch start. Manual Next remains available.

Heart recognition remains a separate two-hand dwell. The microphone is never muted by a hand gesture. Reaction events continue through room-scoped, rate-limited signaling.

## Evidence and limits

- All 47 unit/transport tests passed, including 15 gesture tests. Synthetic traces cover both directions, four image aspect ratios, three hand scales, hand roll, 5–30 sampled frames/second, smoothing, stationary jitter, diagonal paths, fingertip flicks, zigzags, scale jumps and cooldown retention.
- Browser layout checks cover 1440 × 1050, 768 × 1024, 390 × 844, 320 × 740 and 844 × 390. Checks include EXIF orientation, image loading, theme selection, no horizontal overflow, self-preview not covering instructions, control dimensions and settings navigation.
- A browser test supplies scripted landmarks to the production filtering/FSM/action/signaling pipeline while using real local WebRTC connections with simulated media. A stationary pose causes no skip; a held heart produces one shared reaction; a swipe sends one skip, retains audio and cannot repeat while held.
- Microphone permission/retry/loss/recovery tests passed with the updated interface.
- The Test Lab browser test passed with two labeled partners, no automatic hearts, intentional reaction, Next rematching, diagnostics export and cleanup. Four focused browser tests passed across completed runs (layout, gesture flow, microphone lifecycle and Test Lab).
- The existing public Cloudflare URL was checked with a labeled test partner: photos and calibrated UI loaded, audio tracks were delivered, and no automatic hearts appeared.
- At the visual-update checkpoint, the broad reconnect timeout was still outstanding. A subsequent recovery update reproduced a blocked old ICE operation and fixed scoped signaling teardown; see CONNECTION-RECOVERY.md and the latest completed run in FLIPPY-STATUS.md. The focused visual checks alone are not a full-suite pass.

There is no measured real-hand accuracy percentage yet. Synthetic landmarks and resized desktop browsers cannot establish recognition accuracy, fairness across skin tones, performance in dim rooms, iOS/Safari compatibility, thermal behavior or physical microphone quality. Before release, use consenting participants and real phones/tablets/laptops; record unwanted skips per minute, successful swipes per attempt, dwell-to-command latency and heart false positives across different distances, lighting, hand positions and mobility. Keep the accessible buttons available.

## Repeatable checks

From the project directory:

```text
node --test tests/*.test.js
node --test --test-concurrency=1 tests/appearance.e2e.js tests/gesture-flow.e2e.js tests/microphone.e2e.js tests/lab.e2e.js
node scripts/check-share.js <current HTTPS trycloudflare URL>
```

The full historical regression suite remains available through node scripts/test-all.js.

## Technical references

- [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker?tab=Web): normalized X and Y coordinates use image width and height respectively; this motivates the aspect correction.
- [W3C contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum): text contrast target.
- [MDN color contrast guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast): text and interface contrast context.

The gesture thresholds and visual palette above are this project's engineering choices, not accuracy claims made by these sources.
