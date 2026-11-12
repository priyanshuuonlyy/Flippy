# Flippy UI integration standard (draft)

**Purpose:** New features must look and behave like built-in parts of Flippy. This is a release-gate specification, not evidence that consent, moderation, age assurance, or bans are deployed.

## Design language

- Reuse existing `public/flippy.css` variables: `--surface-rgb`, `--ink`, `--secondary-ink`, `--line`, `--control`, `--selected`, `--accent`, `--rose`. Respect both appearance modes and orientation-based palettes.
- Reuse `.glass`, 13–23px rounded control geometry, native inline SVG icon strokes, and existing typography; do not introduce mismatched neon-black cards or third-party emoji glyphs inside controls.
- Keep the video image clear and full-view: `object-fit: contain`; black letterboxing is preferable to cropping faces or hands. Keep video top/bottom metadata legible and controls outside the visible face area when possible.
- Animate opacity and transforms, not layout properties. Limit canvas particles and glow work; support reduced motion and low-performance phones. Avoid full-frame tint or background dimming during reactions.
- Touch targets >=44x44 CSS pixels, readable labels, keyboard focus, accessible name and disabled states. Ensure small phones and landscape orientations have no clipped reaction trays.

## Planned user-facing safety UX — not implemented

- Entry: concise one-tick agreement to the Terms of Service and Community Guidelines, with an acknowledgement of the Privacy Notice; **no misleading adult-only branding**.
- Age-appropriate entry and matching: identify the user cohort with lawful, privacy-preserving age assurance, separate minors from adults, and keep underage matching disabled until protections and required guardian permissions actually work. Never interpret one checkbox as age verification.
- Explain privacy, reporting, prohibited content, enforcement and appeals on linked policy pages rather than an intimidating long entry overlay.
- In-call safety: native Report and Block affordances within call controls; immediate local video shielding on Report; explicit server acknowledgement or honest retry on failure.
- Bans: server-enforced restrictions and moderator case review. Browser device-linking cannot promise unbypassable hardware bans.
- Camera and microphone: use separate, browser-native permissions after required agreement. No automatically granted permissions or deceptive consent.
- Free use: no subscription, coins, paid reactions, or implied premium purchase prompts while the product is free. Footer attribution: "Developed by Doer" with non-promissory improvement notice.

## Required verification before production merge

1. `npm test` and project browser/gesture tests against the current repository; do not replace the user's most recent audio work.
2. Desktop (Chrome, Firefox, Safari) and Android/iOS viewport checks, especially 320px portrait, landscape, dark/light appearance, reduced motion and keyboard navigation.
3. Real 2-person WebRTC calls with packet-loss and network-switch tests; measure connection times, freeze ratios, RTT and frame drops, not just static screenshots.
4. Negative safety tests: no matching without required agreement; no unrestricted minor/adult matching; report failure never shown as success; server ban consistently enforced.
5. Render deployment and rollback check using actual deploy ID; compare live commit to merge commit before claiming success.

**Status:** The visual changes in PR #1 are isolated from production. Safety features above remain outstanding and are hard gates for a minors-inclusive launch.
