# Publication and expansion finish reviews

## Read / Elsewhere history

Date: 2026-10-22. Disposition: **SHIP**, scoped to the one scored no-WebGL paper fix.

The initial Read/Elsewhere review found the complete local reader, typography, local navigation, Linktree integration, sourced portfolio content, and mobile layout consistent with the inherited garden. Its material fix concerned reading surfaces becoming transparent when WebGL could not initialize.

The final reviewer reopened the no-WebGL capture and the desktop/mobile reader and Links recaptures. The reader and sticky toolbar now retain opaque paper, text is unobstructed, and the recovery card does not overlap the article. The reviewer marked that fix **resolved**, with no visible regressions in the affected recaptures.

This is a one-fix verdict, not new whole-site approval or a hardware-performance claim. Separate execution verification records 18/18 browser checks with no unexpected errors, 35 passing tests, a passing production build, and validated complete local bodies for all 155 represented published notes.

Earlier parent-garden records remain historical: the 2026-10-21 upgrade sidecar records SHIP for three listed upgrade fixes, following the prior native revision's seven-fix review. Neither verdict approves the standalone publication or the later countryside extension. The parent's sidecar and local captures are historical references, not required files for this project.

## Countryside / vehicles / homestead / workshop extension

Date: 2026-10-22. Final disposition: **SHIP**, scoped **only to the two material fixes scored by the same reviewer**.

The first full expansion review found exactly two material fixes. They were applied in one batch. The same reviewer then read four replacement captures and relevant source, scored both fixes **RESOLVED**, and returned SHIP at that fix-list scope; the remaining material in the supplied evidence was clear. This records the reviewer's verdict rather than a new review by the documenter.

| Scored material fix | Correction and retained evidence | Verdict |
| --- | --- | --- |
| Parked rocket lost in ground fog because aerial camera framing persisted | `src/world/WorldScene.ts` blends rocket ground/aerial framing by altitude and restores the ground camera on landing. `desktop-rocket-boarded.png`, `desktop-rocket-descent.png`, and `desktop-landed.png` are the correction captures. `review-fixes.json` records the rocket parked at altitude 0 with exit enabled and camera distance **43.75**, inside the ground-fog near distance **65**. | **RESOLVED** |
| Cold full-reader spatial destination dropped during deferred WebGL startup | `src/App.tsx` retains a pending `NavigationIntent`, requests the world, and dispatches after the world exists with panel/overview pause cleared. District, essay, vehicle, and person actions share this path; journey start/next enqueue essay destinations. `cold-reader-navigation.png` and `review-fixes.json` record exact arrival at **Choosing your Game will Choose Your Life**, `routeRemaining: 0`, `paused: false`. | **RESOLVED** |

All capture basenames in this section are under `.impeccable/review/expansion/`. The four replacement captures above were opened by the main thread and the reviewer. The final SHIP is not a new full-surface approval, physical-hardware performance certification, CMS authentication, or deployment certification.

### Already-executed verification

These results were supplied by the completed build/correction work. This documentation handoff did not rerun tests, the production build, browser verification/captures, the detector, or the provenance scan.

| Record | Supplied outcome and boundary |
| --- | --- |
| `npm test` | **46/46 pass** after final corrections; the earlier 35-test result above belongs to publication history. |
| Production build | **PASS** after final corrections. |
| `.impeccable/review/expansion/verification.json` | **32/32 pass**, `errors: []`; vehicles, residents, supplied homestead content, workshop previews/local writing, opt-in live preview, reading pause, and mobile controls/layout. |
| `.impeccable/review/worldmwaweru/verification.json` | **18/18 pass**, `errors: []`; retained baseline full-reader/Elsewhere coverage, including cold shared reading and opaque no-WebGL paper. |
| `.impeccable/review/expansion/review-fixes.json` | **5/5 pass**, `errors: []`; cold full text without WebGL construction, retained destination and exact arrival, rocket hover, and landed camera visibility. |
| `/tmp/opencode/mwaweru-expansion-detector.json` | Existing **advisory-only** contextual font-size/palette findings in `src/components/world-expansion.css`. Reused muted icon ink, preview-bar surface/dots, and component-specific type are documented as observed roles; no new global system step is implied by an advisory. The shadow uses the existing dock lift. |
| Supplied shipping-raster provenance scan | **15 new rasters, 0 missing origins**: 11 sourced WebP derivatives with sidecars and four real website JPEGs with embedded source. No new AI generation; the owner's existing DALL·E artwork retains its attribution. |

Browser evidence uses actual WebGL rendering, real keyboard/touch input, and explicitly documented fixed-step replay through the actual controller for long journeys. It supports the recorded behavior and captures, not physical-phone or hardware FPS. Local `.impeccable/` records and the temporary detector file are QA evidence; they are not deployment prerequisites.

### Retained capture inventory

- Entry: `desktop.png`, `mobile.png`.
- Homestead: `desktop-homestead.png`, `mobile-homestead.png`.
- Workshop / writing / preview: `desktop-workshop.png`, `mobile-workshop.png`, `mobile-mathnuscripts.png`, `desktop-live-preview.png`.
- Travel / vehicles: `mobile-travel.png`, `desktop-bike.png`, `mobile-bike.png`, `desktop-cruiser.png`, `desktop-boat.png`, `desktop-plane.png`, `desktop-rocket.png`, `desktop-landed.png`.
- Residents: `desktop-conversation.png`.
- Replacement evidence: `desktop-rocket-boarded.png`, `desktop-rocket-descent.png`, `desktop-landed.png`, `cold-reader-navigation.png` (the landed filename was replaced in place).

Baseline full-reader captures remain under `.impeccable/review/worldmwaweru/`. For as-built documentation, this pass opened representative retained desktop workshop, mobile homestead/bike, landed rocket, and cold-navigation captures; it made no fresh browser captures or new approval finding.

### As-built facts and delivery boundary

- The radius expands **54 → 132**, with country roads, a western airstrip/hangar, an eastern launch field, a terrain horizon skirt, and expanded coast/depth mapping. Five native vehicles and five explicitly fictional residents extend the incumbent Three.js garden.
- The paper workshop is capped at **800px** and leads with the real Mathnuscripts screenshot, summary, and local CTA for **155 complete notes**. Thenks has an icon/word treatment; the three supplied Netlify projects use real screenshots and user-loaded sandboxed iframes.
- `PRODUCT.md` and `content/profile.json` hold the owner's supplied current biography, degree, experience, and achievements. The homestead has the portrait, current-focus section, and 11-image album; historical Linktree/About attribution remains distinct.
- `.pages.yml` configures five directly consumed JSON editors. Media supports `BASE_URL`; the validator checks types, required IDs, URLs, media, and reference notes. CMS status is **CONFIGURED, NOT authenticated or deployed**. `docs/EDITING.md` describes owner GitHub sign-in and publishing/rebuild. **No changes were pushed for this handoff.**
- The retained snapshot records **155 notes, 240 trees, 5,814 generated grass placements, 600 flowers, 5 vehicles, 5 residents, radius 132, 87 fish, 20 birds, 32 butterflies, 16 bees, 99 fireflies, and 220 reeds**. The grass mesh has capacity 6,500; `grass.count = placed` records the actual 5,814 instances, not 6,500 rendered placements or visibility of all instances in one frame.

### Documentation handoff

`DESIGN.md` reconciles the extension with the incumbent system after the last correction, retaining material details, licences/provenance boundaries, full-reader behavior, and narrow review history. The project-local `.impeccable/design.json` was absent; this handoff restores the supported sidecar at that path using incumbent metadata as reference and current project evidence. The parent garden's sidecar is unchanged. Its historical counts, bindings, staging paths, and verdicts are not promoted into current project authority. The README change is limited to the living-grass count/capacity distinction.

The documenter role ran inline using the degraded documenter workflow. Application code, configuration, scripts, assets, and tests were not edited by this documentation handoff.

## Controls / Thenks persistence follow-up — 2026-10-23

The initial finish review requested **FIX** solely for superseded design-persistence assertions. After the documentation handoff, the same reviewer scored that single fix **RESOLVED** and returned **SHIP at the persistence-fix scope only**. The reviewer opened all eight captures listed below and found no further material code or visual fix; fidelity findings were match/adaptation. Earlier reviews above retain their original scope and historical facts.

### Persistence correction recorded

- `DESIGN.md` and the existing project-local `.impeccable/design.json` now record **Thenks first**, canonical URL `https://www.thenks.co/` across Work/Links/About, and the real `public/assets/projects/thenks.jpg` preview. The newest user requirement supersedes Mathnuscripts-first guidance. **Mathnuscripts remains full-width second**, with all **155 complete local notes**.
- Thenks' semantic Work statistics show **$500K+ tips processed, 80+ properties onboarded, and 2,050+ staff members impacted**. “Published results from the first eight months.” and `https://www.thenks.co/#results` identify a sourced editorial snapshot, not live analytics. Source raw HTML starts the JS counters at zero; the supplied settled-browser observation and source JPEG show the stated totals.
- CMS `featured` supplies the full-width entry class: Thenks, Mathnuscripts, and Monad are featured; Kenyan Tech Stack/Boda Rush share two columns. All featured previews float at 42% on desktop and become full-width on touch layouts. Featured titles use Averia 32px/27px; result values use tabular Averia 32px/26px, with Karla labels at 12px and source/context at 11px. At <=360px, results stack into label-left/value-right rows and the redundant monogram hides while wordmark text remains.
- The HUD stays bottom-centre above 1200px, moves left at 601–1200px (22px inset, width `min(640px, calc(100% - 270px))`) to clear the right map, and keeps the later mobile/coarse-pointer upper-left override. The first main-thread pass found 320px statistics/header overflow and 1024px HUD/map overlap; one responsive batch corrected both before the supplied second-round 51/51 result.
- Driver-relative arrow/WASD and touch steering subtract yaw for the +Z-facing models in ground/taxi and airborne-plane simulation; reverse steering changes with speed sign. Bike, Cruiser, boat, and plane use shortest-angle, exponentially damped rear-camera follow with reduced-motion snap. Walking returns by the short turn; the rocket retains its separate framing and corrected parked hint.
- All five project previews are actual website JPEGs. The generic no-image fallback remains available for future entries; it is no longer Thenks' preview. `.pages.yml` exposes `featured`, result value/label pairs, context, and source; validation handles booleans, requires a statistics source, keeps Thenks first, and retains Mathnuscripts.

The incumbent palette, Averia/Karla pairing, opaque-paper layers, and native illustrated world are retained. `README.md`, `PRODUCT.md`, and `docs/EDITING.md` already reflect the current facts and needed no reconciliation edit.

### Supplied execution evidence

These are retained or supplied results from the implementation work. This documentation-only pass did not rerun the browser, build, tests, detector, or provenance scan.

| Record | Supplied outcome and boundary |
| --- | --- |
| `npm test` | **52/52 PASS**, including five new steering/camera regressions and statistics validation. |
| Production build | **PASS after the final responsive correction batch**, confirmed by the parent thread. |
| `.impeccable/review/controls/verification.json` via `scripts/verify-controls.mjs` | Latest **51/51 PASS**, `errors: []`, after the responsive correction batch. |
| `/tmp/opencode/steering-thenks-detector.json` | Ran **once**; contextual type advisories only. These do not create universal tokens. |
| Supplied project-raster provenance scan | **5 files, 0 missing origins**. The new Thenks JPEG embeds an actual Playwright 1600 × 1000 capture dated 2026-10-23, settled counters, JPEG quality 82; no image generation. |

Runtime evidence includes actual native WebGL, controlled fixtures passed through actual DOM key handlers and `setTouch`/`simulate`, plus actual Playwright keyboard delivery and pointer-thumbstick checks. It does not establish 51 manually completed journeys or physical-hardware FPS. Earlier **18/32/5** browser checks and the older test/build results above remain unchanged historical records, not fresh rerun claims.

### Reviewer-opened capture inventory

All paths are under `.impeccable/review/controls/`; the reviewer opened all eight.

| Capture | Scope |
| --- | --- |
| `desktop-driving.png` | 1024px, native WebGL; driving/HUD evidence. |
| `mobile-driving.png` | 390px, native WebGL; mobile driving evidence. |
| `desktop-workshop.png` | 1440px Work layout. |
| `desktop-thenks-stats.png` | Desktop Thenks results and context. |
| `mobile-workshop.png` | 390px Work layout. |
| `mobile-thenks-stats.png` | Mobile Thenks results and context. |
| `small-mobile-workshop.png` | 320px Work/header fit. |
| `small-mobile-thenks-stats.png` | 320px stacked-result fit. |

Work captures intentionally use the no-WebGL paper interface to evaluate content and native fallback; renderer evidence is in the driving captures. The documenter inspected source and retained verification text, without reopening captures or conducting a finish review.

### Handoff / publication boundary

The degraded documenter role ran inline. Writes were limited to `DESIGN.md`, the existing `.impeccable/design.json`, and this dated append; earlier review text remains intact. The same reviewer subsequently scored the single persistence finding **RESOLVED** and returned **SHIP** for that fix, with no documentation regressions identified in the correction. The parent thread recorded this returned verdict and the completed final build.

At the documentation handoff, production was the earlier **`10622bc`**. Publication after review is recorded by Git and Netlify history; the documenter performed no commit or push. The supplied Netlify account settings are `built_with_badge_enabled=false` and `hud_enabled=false`; badge/HUD removal is an account setting, not a CSS workaround or new design-system rule.
