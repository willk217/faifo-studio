# Faifo Studio — DESIGN.md

Static, framework-free site (HTML/CSS/vanilla JS — no Node/build step). Built from the Faifo Studio brand guidelines (Edition 01, Aug.10.26) supplied as a pinned brief; the guideline deck's own "Website" slide (11/16) specified the landing-page structure directly.

## Current live state — temporary landing page

The site currently ships a trimmed version while the Auko case study, Clients, and Testimonials content isn't ready to publish: **Hero → Services → How we work → Contact** only. The full version (with Work: Auko, Clients, Testimonials, About) is preserved at the `full-site-v1` git tag for restoration once that content is ready — everything below this section describes that full build's design system, most of which still applies to the trimmed page (tokens, type, motion), except where noted.

Fixes applied on top of the trim:
- **Contact form was unreadable** — `.field input/textarea/select` used on-ink tokens (`--bone-50` text, `--ink-line-on-ink` borders) but the Contact section itself runs on-bone. Now uses `--ink-900` text and `--ink-line-on-bone` borders/chevron, matching the section it's actually in.
- **Contact email corrected** — `studio@faifo.studio` was wrong everywhere it appeared; replaced with `hello@faifostudio.com` (nav panel, contact meta-bar, form note, footer, `js/main.js` mailto handler).
- **Project type** select restored to the contact form (Real estate photography / Videography / Drone / Brand design / Brand media / Something else), matching the Services list.
- **Availability card removed** from Contact per client request; `.availability-card` CSS deleted as dead code.
- **Motion polish** (Emil Kowalski's public "Animations on the Web" principles — no dedicated Claude skill for this was available, so his documented guidance was applied directly): `.reveal` tightened from 700ms/18px to 500ms/14px (duration should track the distance travelled, not linger); `.btn` gained a `translateY(-1px)` hover lift on top of the existing instant-press `:active` state, so buttons feel picked-up-then-pressed rather than just recoloring.

Fixes applied after an `impeccable:impeccable-finish-reviewer` pass on the trimmed page:
- **Contact layout rebalanced** — with the Availability card gone, `.enquire__row` left ~700px of dead space on wide viewports. Rebuilt as a two-column grid: copy (heading/description/"prefer email" line) on the left, the form itself on the right, stacking to one column at the existing 860px breakpoint.
- **The site's one brand-pinned offset shadow was orphaned** when the Availability card (its only owner) was removed. Re-homed onto `.btn.is-primary`, applied to the Contact form's "Send it →" submit button — the single most load-bearing action on this trimmed page.
- **Keyboard focus ring was being suppressed on all form fields** — `.field input/textarea/select:focus` set `outline:none` unconditionally, which (by specificity) killed the site-wide `:focus-visible` ring for keyboard users too, not just mouse clicks. Changed to `:focus:not(:focus-visible)` so the ring still shows for keyboard/tab navigation; mouse-click focus keeps just the border-color change.
- **Placeholder contrast bumped** from `rgba(14,14,12,.38)` to `.55` for better legibility against the bone ground.

## Stack

- Plain HTML, CSS, JS. No framework, no bundler — this machine has no Node/npm installed, and a photography portfolio doesn't need one.
- Fonts self-hosted from the brand deck's own woff2 assets (`assets/fonts/`): Archivo (variable, wdth 62–125, weight 300–900) for display/body, IBM Plex Mono for meta/data.
- Logo mark and lockups extracted as real PNGs from the brand deck (`assets/logo/`) — not regenerated.

## Design tokens (`css/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--ink-900` | `#0E0E0C` | Dark ground |
| `--bone-100` | `#F2EEE6` | Light ground |
| `--bone-50` | `#FAF8F4` | Foreground-on-ink / lightest paper |
| `--bone-200` | `#E7E0D4` | Sunken |
| `--sand-300` | `#C9BCA8` | Fill / offset-shadow color |
| `--clay-500` | `#9C8465` | Accent type only |
| `--green-600` | `#14653A` | Signal — availability status only |
| `--rust-700` | `#9A3412` | Destructive/error only, never decorative |

Grid: 12 columns, 16px gutter, 1440px max width, page margin 24px → 48px at `lg`. Spacing scale is 2px-rooted: 2/4/8/16/24/32/48/64/96/128.

## Type scale

- Display (`h-display`, hero): Archivo 600, `wdth 112`, tracking −4.5%, line-height .9, uppercase, `clamp(2.75rem, 3.4vw+2rem, 7.4rem)`.
- Section (`h-section`): same voice, `clamp(2.25rem, 2.6vw+1.5rem, 4.6rem)`.
- Card heading (`h-card`): 600, tracking −3.5%, `clamp(1.5rem, 1.4vw+1rem, 2.1rem)`.
- Body (`body-text`): 17px/1.6, max 64ch.
- Meta (`meta` / `meta-sm`): IBM Plex Mono, uppercase, tracked +14%, 13px / 11px.

## Motion

Two tiers, deliberately different, per where each mandate applies:

- **Page chrome** (reveals, hovers, nav): CSS only. A single authored `.reveal` fade+rise (14px, 500ms, `cubic-bezier(.2,0,.2,1)`), staggered 70ms per sibling via `IntersectionObserver` in `js/main.js`. No spring/bounce here — the brand doc explicitly specifies "no bounce" for the studio's own UI. Hover/press states use 80–140ms transform/opacity only, with instant `:active` feedback on pointer-down (not on release) per Apple's response principle. iOS Safari needs a `touchstart` listener present anywhere in the document for `:active` to fire at all on tap — added in `js/main.js`.
- **The gallery lightbox** (a real gesture surface, not page chrome): vanilla spring physics in `js/spring.js` — Apple's damping/response model (WWDC18 *Designing Fluid Interfaces*), critically damped (`damping 1.0`) by default, bounce (`damping ~0.86`) reserved *only* for a release that was already moving — a flick gets a little overshoot, a tap-to-open never does. This is the one place bounce exists on the site, and it's earned by the interaction, not decorative.

`prefers-reduced-motion` disables both tiers — CSS via a blanket rule in `base.css`, springs via a `reducedMotion()` check in `spring.js` that snaps straight to the target instead of animating.

## Interaction layer — Auko gallery lightbox

Built from `anthropic-skills:apple-design` (WWDC *Designing Fluid Interfaces* translated to the web). Tap or Enter/Space on any Auko mosaic image opens a full-screen, uncropped viewer (`object-fit: contain`, not `cover` — the lightbox is where you see the whole frame, the mosaic thumbnails are the crops):

- **Materialize in/out** — scale + blur + opacity animate together as one spring, not a flat fade.
- **1:1 drag** — Pointer Events track the image to the finger exactly; axis-locked after a 10px hysteresis threshold (horizontal = page between photos, vertical = drag to dismiss), never both at once.
- **Momentum projection** — a flick doesn't just nudge the page; released velocity projects where the gesture *would* coast to (Apple's exponential-decay formula, not `v²/2a`), and that decides whether it pages or springs back.
- **Velocity handoff** — the release velocity becomes the spring's initial velocity, so there's no seam between the finger letting go and the animation continuing.
- **Interruptible** — grabbing the image mid-animation (mid-page-turn, mid-dismiss, mid-materialize) stops the running spring and starts the new one from its live on-screen value, never the logical target — no visible jump.
- **Rubber-banding** — dragging past the first or last photo resists progressively (Apple's rubberband formula) instead of hard-stopping or dragging forever.
- Keyboard (←/→/Esc), focus-trapped, focus returns to the thumbnail that opened it, `aria-modal`, per-image alt text carried through from the mosaic.

`js/spring.js` is a small (~120 line) dependency-free spring integrator — no Motion/Framer Motion, since there's no npm on this machine. Same physics, hand-rolled.

## Surfaces

Radius 0 everywhere. Exactly **one** offset shadow on the whole site (`box-shadow: 4px 4px 0 var(--sand-300)`), on the primary Contact form submit button (`.btn.is-primary`) — matches the brand doc's "one per page" rule, applied once sitewide since it's a single-page site. Re-homed here from the Availability card once that card was removed from the temporary landing page.

## Brief-pinned patterns kept despite generic anti-slop defaults

Two patterns a generic build would flag as AI-slop are here on purpose, because the brand guideline explicitly specifies them:

- **Section numbering** (`01 —`, `02 —` …) in every section's top meta bar — a documented brand convention, used as a wayfinding/context device across the whole 16-page guideline deck, not a decorative kicker glued above one headline.
- **The offset block shadow** — explicitly specified in the brand doc's own "Surfaces and states" page ("Offset ink shadow, 4px 4px 0. One per page."), used exactly once.

## Content structure

Rebuilt from a client-supplied handoff doc (services list, featured-project copy, process, clients, testimonials, about, contact) laid over the existing brief-pinned visual system. Sitemap of the old→new restructure: `planning/sitemap.canvas` (JSON Canvas). Section order:

1. **Hero** — "Creative media for brands and spaces," the real Auko hero film (`auko-storytelling.mp4`) autoplaying muted/looped as the background, poster falls back to the aerial still. Replaces the brand deck's fictional "Villa Sông, Hoi An" example — this was previously flagged as an open seam (fiction and the real Auko work sitting side by side); the handoff doc's hero rewrite resolves it, since the new copy makes no location-specific claim. Autoplay is gated to desktop + no `prefers-reduced-motion` (`js/main.js`) — mobile and reduced-motion visitors get the static poster only, since this is the full uncompressed 285MB reel, not a short compressed loop; see the deployment note below, this is the single biggest thing to fix before a real launch.
2. **Services** ("What we do") — five items (real estate photography, videography, drone, brand design, brand media) as a numbered editorial row list (`.numbered-list`), not cards — keeps the site's anti-card-grid discipline.
3. **Work: Auko** — the one portfolio section, real client work only. "Auko — Eco-Wellness Lodge, Phong Nha" (corrected from an earlier generic "glamping resort in an unnamed karst valley" framing once the real name and location were confirmed). Intro copy, a plainspoken "what we did" list, and one unified 17-photo masonry gallery (CSS columns, `height: auto`, no `aspect-ratio` box and no `object-fit: cover` anywhere in it) replacing what used to be four separate labeled sub-sections (land / lodges / welcome-wellness-restaurant / lifestyle) — same photos, one concise flowing gallery instead of four padded ones, and genuinely zero cropping: every tile shows the photo's real dimensions. Every image still opens in the interactive lightbox; figcaptions are kept in the DOM (the lightbox reads them) but visually hidden on the grid itself, so the tiles stay clean. The two down-page video embeds (storytelling reel, Open Way walkthrough) were removed once the storytelling reel became the hero background instead — no video player left mid-page. An honestly-marked pull-quote placeholder closes the section (no client quote exists yet). Photography from `/Users/willkillen/Downloads/Auko/__Full Shoot/Final Deliverables/_WEB SIZE/`.
4. **How we work** — four-step process, same numbered-row treatment as Services.
5. **Clients** ("Who we've worked with") — plain editorial text list (Auko, OTA Playhouse), not a logo wall — no logos exist for either, and the handoff doc explicitly prefers text over a mismatched logo grid.
6. **Testimonials** — zero real quotes exist. Built as an honest empty state (`.testimonial-empty`, dashed border, "Coming soon") rather than padded with fabricated quotes or three empty boxes that would read as broken.
7. **About** ("The studio") — merged the old separate Studio + Approach sections into one, per the handoff doc's "About/Philosophy" pattern; the old shooting-doctrine detail (grade, flash, delivery) survives as a compact supporting block. Old disciplines/subjects/also row dropped — Services now covers that ground.
8. **Contact** ("Start a project") — expanded form: added company/property name, project type and budget-range selects, alongside the existing name/email/message. Availability card (the one offset-shadow instance) unchanged.
9. **Footer** — tagline "Creative media for brands and spaces," nav repeat, unchanged location/email/copyright.

**Real content gaps, not fabricated:** an Instagram handle (the handoff doc marks this `[handle]`; omitted from the live page rather than guessed), testimonial quotes, and any logo/asset for OTA Playhouse. Contact email is `hello@faifostudio.com` (corrected from an earlier wrong `studio@faifo.studio`, and from the doc's unresolved `[email]` placeholder before that).

## Known deployment consideration

`assets/video/` is ~382MB (the real, uncompressed Auko exports — no `ffmpeg` on this machine to make web-weight proxies). This is now a bigger deal than it used to be: the hero background is `auko-storytelling.mp4` autoplaying on desktop, meaning every qualifying visitor's browser fetches the full 285MB reel just to load the homepage. It works locally because localhost has no real bandwidth constraint. **Before a real deploy, this file needs to become a short (5-15s), compressed (a few MB) H.264/H.265 loop purpose-built for a hero background** — not the full 1:50 delivery-quality edit. Either transcode it or move it to a video host (Cloudflare Stream, Mux, Vimeo) and swap the `<source>`. Shipping the current file as-is in production would tank LCP and burn real data on anyone's phone plan who happens to load it on a slow connection, even though it's gated off mobile.

The other Auko video, `auko-walkthrough.mp4` (Open Way cut), is currently unreferenced from the page — it was one of the two down-page video embeds removed once the storytelling reel moved to the hero. Real client footage, kept in `assets/video/` rather than deleted, in case there's a use for it later (a dedicated film page, a secondary embed, etc.).

## Imagery

- `assets/photo/auko/*.jpg`: real photography from the Auko shoot, used as delivered (already web-sized, no reprocessing needed). This is now the site's only photography — the earlier AI-generated placeholders (`hero-exterior.png`, `work-detail.png`, `texture-water.png`, used for the old fictional-villa hero and the old Approach section's illustrations) were deleted once the restructure removed every section that referenced them. No square crops anywhere on the site (mosaic tiles use 4:5/3:2/16:9; the lightbox uses `contain`, showing the full uncropped frame).

## Finish status

Structural QA done: full accessibility tree read (every section/heading/image-alt/form-field verified present and in order), all image/video assets confirmed served (200, correct byte sizes), zero horizontal overflow at 375px and 1440px, computed styles spot-checked. The lightbox's open/close/page-forward/page-back were each verified functionally correct (via click and keyboard, with proper focus return and full cleanup on close) — confirmed by checking resulting DOM/ARIA state rather than eyeballing it, since this session's Browser-pane tool had two recurring quirks unrelated to the page itself: screenshots of any scrolled position render blank (top-of-page screenshots are fine), and the tab periodically reports `document.visibilityState: "hidden"`, which throttles `requestAnimationFrame` and made the springs *look* broken (stuck, wrong direction) until accounting for the delay — they weren't; a normally-foregrounded tab runs them at full rate with no such lag. No formal `impeccable-finish-reviewer` pass was run this round for the same reason; recommend one before shipping, with fresh screenshots once a normal (non-automated) browser session confirms the pane issue doesn't apply there.
