# PearlFox Website — Permanent Rules

## Heart-Logic Caution Signal (applies to every Heart section in this document)

Whenever a request, question, or planned change touches, modifies, or risks disturbing **any** Heart-level logic documented anywhere in this file — not just the section it happens to be discussed under — prefix the response with a red heart (❤️) before proceeding, asking for confirmation, or explaining the risk. This makes Heart-adjacent moments immediately visible in the conversation, on top of (not instead of) the normal "stop and ask" behavior each Heart section already requires.

## The Heart — Nav Bar & Section 1/2/3 Structure (NEVER touch without explicit confirmation)

The home page (`index.html`) opens with three tightly-coupled pieces — the sticky nav, the hero (section 1), the Company section (section 2), and the Products section (section 3) — whose heights, positions, and the scroll-driven logo handoff between them were tuned through many rounds of real bug fixes on 2026-09-13/14. Getting any one of them wrong breaks the others in ways that are easy to ship without noticing.

**Heart components — stop and ask before touching any of these:**
- `nav` and `nav.nav-solid` (`shared.css`) — transparent-over-hero at the top, solid once scrolled (`scroll > 40px`, via `shared.js`)
- `.nav-logo-target` / `.nav-logo-target-icon` / `.nav-logo-target-word` — the invisible landing spot the flying logo docks into; must stay `opacity:0` (never `visibility:hidden` — hidden elements are excluded from click hit-testing, which broke the nav home-link once already)
- `.brand-mark-icon` / `.brand-mark-word` (`shared.css`) — the actual flying elements; must keep `pointer-events:none` (without it, the visible image itself steals the click instead of passing it through to `.nav-logo-target`, which shipped as a real bug) and `z-index:9999` with **no z-indexed ancestor between them and `<body>`** (an ancestor with its own z-index traps their z-index inside it — this is exactly how the logo ended up rendering behind the nav despite having z-index:9999)
- `makeFlyer()` / `updateLogoHandoff()` (`shared.js`) — the FLIP-based scroll handoff. The `flightStart` freeze-on-entry pattern is load-bearing: blending toward the element's *live* (continuously scrolling) position instead of a frozen start point is what let the logo swing off-screen when section 2's height changed
- `getNavH()` (`shared.js`) — nav height is *measured live*, never hardcoded. Nav wraps to multiple rows on mobile (taller than the 64px desktop height), and a hardcoded value silently desyncs the flight timing there
- `.brand-mark{min-height:1000px}` (section 2) and `section.app-preview{padding:88px 0}` + its `640px`-min-height visual column (section 3) — the two heights the scroll-handoff math is tuned against
- `.brand-mark > .wrap` must **never** get its own explicit `z-index`** — the earlier bug where the flying logo rendered behind the nav was caused by exactly this (an ancestor z-index capping the flying elements' z-index:9999 to its own lower value); `position:relative` alone is safe, a `z-index` on top of it is not

**Rules for the heart:**
- Changing section 2 or section 3's height requires re-verifying the scroll handoff still starts/lands correctly (the trigger is keyed off `.brand-mark`'s own bottom edge reaching the nav — see `updateLogoHandoff()`).
- Never add `overflow:hidden` to `.brand-mark` (or any ancestor of the flying elements) — it clips the logo mid-flight the instant it moves outside that box's bounds, exactly as it visually needs to. (Decorative backgrounds like the circuit-line pattern don't need it — they're already sized to their own box via `inset:0`.)
- Never give `.brand-mark-icon`/`.brand-mark-word` (or the target elements) a lower z-index, and never give an ancestor of theirs its own z-index — either one silently re-traps them behind the nav.
- If a new element needs to sit visually "in" the nav-logo area, it must go into `.nav-logo-target` (the real, always-clickable link) — never a second copy layered on top, which is what caused the original click-through bug.
- If unsure whether a change touches this system: **STOP and ask.**

Added 2026-09-14 after fixing, in order: the flying logo swinging off-screen when section 2's height changed, the logo rendering fully behind the nav (ancestor z-index trap), a frosted-glass blur bleeding onto the docked logo (nav's `backdrop-filter`), and the docked logo being unclickable (`visibility:hidden` excludes an element from hit-testing, and the visible image itself was stealing clicks meant for the underlying link). All four are now fixed and documented above so they don't quietly come back.
