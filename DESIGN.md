# Faifo Studio — DESIGN.md

Static, framework-free site (HTML/CSS/vanilla JS — no Node/build step). Built from the Faifo Studio brand guidelines (Edition 01, Aug.10.26) supplied as a pinned brief; the guideline deck's own "Website" slide (11/16) specified the landing-page structure directly.

## Current live state — temporary landing page

The site currently ships a trimmed version while the Auko case study, Clients, and Testimonials content isn't ready to publish: **Hero → Services → How we work → Contact** only. The full version (with Work: Auko, Clients, Testimonials, About) is preserved at the `full-site-v1` git tag for restoration once that content is ready — everything below this section describes that full build's design system, most of which still applies to the trimmed page (tokens, type, motion), except where noted.

Fixes applied on top of the trim:
- **Contact form was unreadable** — `.field input/textarea/select` used on-ink tokens (`--bone-50` text, `--ink-line-on-ink` borders) but the Contact section itself runs on-bone. Now uses `--ink-900` text and `--ink-line-on-bone` borders/chevron, matching the section it's actually in.
- **Contact email corrected** — `studio@faifo.studio` was wrong everywhere it appeared; replaced with `hello@faifostudio.com` (nav panel, contact meta-bar, form note, footer, `js/main.js` mailto handler).
- **Project type** select restored to the contact form (Photography / Cinematography / Brand identity / Something else — updated again when Services was restructured, see below), matching the Services list.
- **Availability card removed** from Contact per client request; `.availability-card` CSS deleted as dead code.
- **Motion polish** (Emil Kowalski's public "Animations on the Web" principles — no dedicated Claude skill for this was available, so his documented guidance was applied directly): `.reveal` tightened from 700ms/18px to 500ms/14px (duration should track the distance travelled, not linger); `.btn` gained a `translateY(-1px)` hover lift on top of the existing instant-press `:active` state, so buttons feel picked-up-then-pressed rather than just recoloring.

Fixes applied after an `impeccable:impeccable-finish-reviewer` pass on the trimmed page:
- **Contact layout rebalanced** — with the Availability card gone, `.enquire__row` left ~700px of dead space on wide viewports. Rebuilt as a two-column grid: copy (heading/description/"prefer email" line) on the left, the form itself on the right, stacking to one column at the existing 860px breakpoint.
- **The site's one brand-pinned offset shadow was orphaned** when the Availability card (its only owner) was removed. Re-homed onto `.btn.is-primary`, applied to the Contact form's "Send it →" submit button — the single most load-bearing action on this trimmed page.
- **Keyboard focus ring was being suppressed on all form fields** — `.field input/textarea/select:focus` set `outline:none` unconditionally, which (by specificity) killed the site-wide `:focus-visible` ring for keyboard users too, not just mouse clicks. Changed to `:focus:not(:focus-visible)` so the ring still shows for keyboard/tab navigation; mouse-click focus keeps just the border-color change.
- **Placeholder contrast bumped** from `rgba(14,14,12,.38)` to `.55` for better legibility against the bone ground.

**Hero: photo background swapped for a mouse trail (`js/main.js`, `.hero__trail*` in `css/style.css`).** The hero's static aerial photo and scrim are gone — the ground is now plain `--ink-900`. In their place, moving the mouse across the hero spawns a real Auko frame at the cursor (from a 12-image pool), pops it in (opacity/scale, 260ms), holds briefly, then fades it out (480ms) and removes it, capped at 5 concurrent images and throttled to one spawn per 110px of cursor travel so it reads as a trail, not a smear. Images sit at `z-index:1`, behind `.hero__content` (`z-index:2`), so the headline and CTAs are never obscured. Sized `width:200px; height:auto` — no `object-fit:cover`, consistent with the site's no-cropping rule. Gated to `(hover: hover) and (pointer: fine)` and off entirely under `prefers-reduced-motion`, so touch visitors and reduced-motion visitors just get the plain ink ground. CSS-only transitions (this is page chrome, not a gesture surface — no spring physics needed here, per the two-tier motion system below).

## Services restructure — three dedicated pages

The site went from a flat five-item Services list (real estate photography, videography, drone, brand design, brand media) to three consolidated services — **Photography** (stills, ground and aerial, merged with the old drone line), **Cinematography** (renamed from videography), **Brand identity** (merged brand design + brand media) — each with its own page: `photography.html`, `cinematography.html`, `brand-identity.html`.

Built from a project-local skill at `/Users/willkillen/Documents/Claude Skills/skills-main/skills/servicewebsite/SKILL.md` (not in this session's registered skill list, invoked by the user pointing directly at the file), which argues each service should be its own page rather than sharing a section, and lays out an 8-part structure: headline (service + audience), supporting paragraph, primary + secondary CTA, what's included, process, proof, FAQ, final CTA. All three pages follow that structure. Copy was drafted and passed through `anthropic-skills:humanizer` (no em dashes in prose, no AI-vocabulary words, no promotional language); `impeccable:impeccable`'s craft floor was read before editing UI — its bans on identical icon-cards and colored border-left accents shaped the layout choices below, and its explicit "pinned brief overrides" carve-out is why the site's brand-documented offset shadow and section-numbering convention were kept where they already existed.

- **Headlines split into two tiers** rather than one long compound line ("Real estate & property photography" as the big `h-section`, "For hotels, resorts & developers" as a smaller `.service-hero__audience` line below it) — a single run-on headline naming both service and audience wrapped unevenly at display size; splitting them reads more balanced and still satisfies the skill's "name the service and the audience" requirement.
- **What's included** reuses the existing `.dash-list` component (em-dash bullets, already on-brand) rather than a new checklist pattern.
- **Proof**: Photography's proof section revives the `.mosaic` masonry grid and the lightbox (`js/spring.js` + `js/lightbox.js`, re-included on this page only) with real Auko photos — genuine work, not fabricated. `js/lightbox.js`'s gallery selector was generalized from `#work .mosaic figure` to `.mosaic figure` so it isn't tied to the old (now-removed) Auko section id. Cinematography and Brand identity have no real proof yet — no video work exists, and no delivered brand-identity project exists in this project's assets — so both reuse the existing `.testimonial-empty` honest-placeholder pattern instead of inventing examples, per the user's explicit "add video soon, keep placeholders" instruction and this project's standing no-fabrication practice.
- **FAQ** is a hand-rolled accessible accordion (`.faq`, `<button aria-expanded>` + a `role`-less content region, not native `<details>`) so the open/close height can transition smoothly via a `grid-template-rows: 0fr → 1fr` trick — native `<details>` hides its content outside CSS's reach, so it can't be animated this way reliably across browsers. Toggle logic lives in `js/main.js`, shared across all pages.
- **Pricing**: the user chose to show pricing but didn't provide real numbers or a rate card. Every FAQ pricing answer on the three pages is deliberately factor-based ("scopes on property size / filming days / how much of the system you need," "send the basics and you'll get a straight scope and price back") rather than an invented number — **this still needs real figures from the user** to fully satisfy the skill's "at least a range or pricing factors" guidance.
- **Timelines** (process-step turnaround estimates — "5–7 business days," "1–2 weeks," etc.) were written as reasonable placeholders at the user's explicit instruction ("just make them up for now, I will edit later") and should be revisited once real numbers are settled.
- **Homepage Services section** (`#services` in `index.html`) links out to each dedicated page rather than carrying the full copy itself — matches the skill's guidance to keep one primary intent per page rather than blending. Hero subhead, hero meta line, and the Contact form's Project Type select were all updated to the three new service names; the Process section's "We shoot" step description was trimmed since it referenced the old category names directly. (Its visual treatment changed again below — `.service-overview` no longer exists.)

### Follow-up pass — web-interface-guidelines audit, apple-design motion audit, creative services display, cross-links

Three things done together after the initial three-page build shipped:

**`web-design-guidelines` skill (Vercel's Web Interface Guidelines) ran against all four pages.** Fixed: `[id] { scroll-margin-top: 88px; }` added globally — `.nav` is `position: sticky`, so every `#anchor` jump (nav links, hero CTAs, footer, the `photography.html#proof` cross-link) was landing with its target flush under the header before this. Every `<img>` sitewide (logo marks + the 9-photo mosaic) gained explicit `width`/`height` attributes matching each file's real intrinsic size (CLS prevention — the mosaic images keep their real, varying aspect ratios since nothing is cropped). `#f-email` got `spellcheck="false"`. Added `<meta name="theme-color" content="#0E0E0C">` to all four pages. Added `touch-action: manipulation` globally to `a, button` (removes the mobile double-tap-zoom delay). Added `text-wrap: balance` to `.h-display`/`.h-section` (only `.lead` had it before — headline widow prevention). Throttled `js/main.js`'s hero-trail `pointermove` handler, which was calling `getBoundingClientRect()` on every single move event (forced layout read, potentially 100+×/sec) — now the hero's rect is cached and only refreshed on `pointerenter`/`resize`. Noted but not changed: this guideline wants curly quotes, `humanizer` strips them to straight — no live conflict today since no quoted copy exists on the site, but a real choice if a testimonial or pull-quote goes in later.

**`anthropic-skills:apple-design` re-read and used to audit motion, not just as a build reference this time.** The original build (hero mouse-trail, lightbox, nav) already followed it closely — critically-damped springs with the right damping/response values, velocity handoff, momentum projection, rubber-banding, `prefers-reduced-transparency` handling on the translucent nav (`backdrop-filter: blur(20px) saturate(160%)`, drops to solid + no blur under reduced transparency), a soft gradient scroll-edge instead of a hard divider, size-specific letter-tracking already in `tokens.css` (`--tracking-display: -0.045em` large / `--tracking-meta: 0.14em` small, tightening further past 1400px) — all of that predates this pass and needed nothing. The real gaps were in components added in later turns, after the original pass: `.faq__q`, `.service-hero__back`, and the old `.service-overview__item` had no `:active` press-feedback, breaking the sitewide "respond on pointer-down" convention every other interactive element follows. Fixed by extending each with the same `transform: scale()` / `opacity` instant-press pattern already established elsewhere (`.nav__links a:active`, the shared icon-button press rule).

**Services display redesigned to be more visual, per explicit request** ("more creative way to display the services"). `.service-overview` (a compact text-only numbered list) is gone, replaced by `.service-features`: three large alternating rows (`.service-feature`), each pairing a big `h-section`-sized title with a real, uncropped Auko photo (`width:100%; height:auto`, no `object-fit:cover` — same no-cropping rule as the mosaic), image and text sides swapping per row (`nth-child(even)` order flip), stacking to one column under 860px. Photography's image is genuinely representative (a real estate interior shot). Cinematography and Brand identity use mood-appropriate Auko photography (a dusk exterior; the bamboo welcome pavilion) as atmosphere, not as a claim of specific delivered work for those services — the honest "coming soon" framing on each service page's own Proof section is what actually states what's real. A subtle `scale(1.03)` image zoom on hover/focus is the one added flourish, matching the mosaic's existing hover treatment.

**"Related services" cross-links added to all three service pages** (`.related-services`, two `.btn`-styled links each, pointing at the other two services), sitting between FAQ and the Final CTA. This directly follows the skill's own SEO section ("Internal links to related service pages"), which the initial build had missed — each service page dead-ended without ever mentioning the other two existed.

### Filmstrip gallery — Photography's Proof section, inspired by noho.ink

Direct request: "more premium feeling features... take inspiration from noho.ink... especially the gallery section." Inspected noho.ink's actual DOM rather than guessing from the screenshot — it's Webflow + GSAP + Lenis, with a `.gallery-collection` list (`display:flex`, `overflow-x` driven by a wheel listener, wider than the viewport) and a circular cursor-follow badge whose label swaps between "Scale" and "Close" depending on state. Reused image assets are one thing to copy; a smooth-scroll library and a bundled animation engine dropped into a zero-dependency vanilla site is another — so the *mechanism* was rebuilt from scratch to fit how this site already works, not vendored in.

`#proof`'s `.mosaic` grid (CSS-column masonry) became `.filmstrip` (`.mosaic filmstrip` — both classes stay on the same element so `js/lightbox.js`'s existing `.mosaic figure` selector keeps working unchanged): a `display:flex` row, `overflow-x:auto`, each figure sized by `height` with `width:auto` (real aspect ratio, still never cropped), bleeding past `.wrap`'s max-width to the section's own edges (`margin-inline: calc(-1 * var(--page-margin))` on `.filmstrip-wrap`) for a wider, more cinematic frame than the centered column everywhere else on the page.

Three pieces, matching what was asked for specifically:
- **Scroll** — native `overflow-x` is the accessible baseline (touch, trackpad, keyboard all just work unmodified); `js/main.js` adds a `wheel` listener that redirects vertical wheel input into `scrollLeft`, plus a thin `.filmstrip-progress__bar` tracking `scrollLeft / (scrollWidth - clientWidth)`.
- **Hover grows the photo** — `.filmstrip figure[tabindex]:hover { transform: scale(1.26); z-index: 3; }`, `transform-origin: bottom center` so it rises up rather than growing in all directions. The catch: `overflow-x:auto` forces `overflow-y` to compute as `auto` too (a CSS spec pairing, not a bug), so a scaled figure would get clipped at the container's edge — fixed with `padding-top: 16vh` reserved as headroom on `.filmstrip` itself, so growth has room to happen *inside* the scrollable box rather than needing to escape it. Disabled on `max-width:700px` (no real hover on touch, and no headroom reserved there either, so it would just clip).
- **Click still opens the existing lightbox** (`js/lightbox.js` + `js/spring.js`, spring-physics materialize/drag/rubber-band, built earlier this project) rather than rebuilding noho's own expand-in-place — it already covers the full viewport, which is a stronger version of "gets even larger to cover the text box above it," and it already had drag-to-page and momentum that noho's version doesn't attempt. No reason to replace something more capable with something less.
- **Custom cursor** — `.filmstrip-cursor`, a fixed-size circle absolutely positioned within `.filmstrip-wrap`, tracked via `pointermove` on the wrap and shown via `pointerenter`/`pointerleave` on each figure. Copy reads "Scale," matching noho's own label. Gated to `(hover: hover) and (pointer: fine)` plus `!prefers-reduced-motion` — the same gate the hero mouse-trail already uses — and hidden outright under 700px.

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
