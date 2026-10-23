---
name: Mwaweru · A Living Garden
description: Mathenge Waweru’s connected illustrated garden and countryside, with native vehicles, a visual workshop, and full-length reading on opaque paper.
colors:
  paper: "#f5f2e7"
  ink: "#2d4435"
  muted: "#54644c"
  green: "#405f46"
  line: "#d2d4bf"
  green-hover: "#2f4c35"
  button-ink: "#f8f6e9"
  icon-hover: "#dce3c9"
  destination-hover: "#e8ecdf"
  destination-active: "#e0e6d3"
  tool-active: "#e0e6d3"
  tool-hover: "#e6eadb"
  sheet-copy: "#526149"
  reader-ink: "#384d3b"
  field-line: "#aebba0"
  scene-ink: "#253b36"
  crown-dark: "#356849"
  crown-green: "#477752"
  crown-mid: "#568653"
  crown-light: "#698f51"
  snow: "#f0f1f2"
  bridge-timber: "#a89063"
  paving: "#b8b7a2"
  muted-icon: "#637d5b"
  preview-dot: "#97a68a"
typography:
  display:
    fontFamily: "'Averia Serif Libre', Georgia, serif"
    fontSize: "clamp(42px, 3.5vw, 51px)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "-.035em"
  headline:
    fontFamily: "'Averia Serif Libre', Georgia, serif"
    fontSize: "42px"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-.03em"
  title:
    fontFamily: "'Averia Serif Libre', Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "'Karla', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.78
  lead:
    fontFamily: "'Karla', sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.48
  excerpt:
    fontFamily: "'Averia Serif Libre', Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
  reading:
    fontFamily: "'Karla', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.85
  reading-mobile:
    fontFamily: "'Karla', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.85
  article-title:
    fontFamily: "'Averia Serif Libre', Georgia, serif"
    fontSize: "clamp(32px, 3vw, 43px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-.03em"
  code:
    fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace"
    fontSize: ".86em"
  label:
    fontFamily: "'Karla', sans-serif"
    fontSize: "13px"
    fontWeight: 600
  note-title:
    fontFamily: "'Karla', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  keycap: "3px"
  control: "4px"
  action: "5px"
  dock: "6px"
  surface: "7px"
  circular: "50%"
spacing:
  compact: "4px"
  small: "8px"
  control: "12px"
  medium: "16px"
  roomy: "24px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.button-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "5px 0"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.circular}"
    size: "36px"
  button-icon-hover:
    backgroundColor: "{colors.icon-hover}"
  territory:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  territory-hover:
    backgroundColor: "{colors.destination-hover}"
  territory-active:
    backgroundColor: "{colors.destination-active}"
  garden-dock:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dock}"
    padding: "8px 14px"
  interaction-prompt:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "10px 15px 10px 9px"
  portfolio-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "0 33px 30px"
    width: "480px"
  workshop-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "0 33px 30px"
    width: "800px"
  project-preview:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
  vehicle-hud:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 18px"
    width: "640px"
  article-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.reader-ink}"
    typography: "{typography.reading}"
    rounded: "{rounded.surface}"
    padding: "0 43px 30px"
    width: "760px"
  elsewhere-entry:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "17px 0"
  library-search:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
  note-entry:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.note-title}"
    padding: "17px 0"
  garden-map:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "8px"
    width: "142px"
  touch-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circular}"
    padding: "8px"
    width: "52px"
---

# Design System: Mwaweru · A Living Garden

## Overview

**Creative North Star: "A little world of my own"**

An inhabited, ink-edged native world with a calm fibrous-paper interface. Painted timber, stone, glass, varied foliage, clear green-turquoise water, and cool highlands make the garden feel tended and lived in. Dark green lettering and compact controls keep the scenery prominent while giving work and published writing a quiet, readable home.

The user confirmed evolving the existing connected garden into Mwaweru, Mathenge Waweru’s broader personal portfolio. Tidehaven’s detailed materials, living-world richness, and dynamism inform this expansion. Native Three.js geometry, original seeded canvas paintings, triplanar material sampling, eight-band toon shading, geometric linework, depth-derived ink, and directional shadows supply its own illustrated character. The four original user images remain art-direction references. The approved native framework, continuous walking, published notes, and self-hosted type pairing remain foundational.

The countryside extension carries that same world into roads, an airstrip, a launch field, five usable native vehicles, and conversations with fictional residents. The homestead uses the owner's supplied biography and images; the workshop pairs real project evidence with complete local writing. These additions inherit the opaque-paper surfaces and established type voices.

**Key Characteristics:**
- Native geometry and material-specific surface paintings own scenery and environmental depth.
- Dark green ink on fibrous paper separates controls and reading from the living landscape.
- Averia Serif Libre headings pair with Karla body text and controls.
- A continuous, camera-follow world supports keyboard, pointer, and touch walking, driving, boating, and flight.
- Accessible HTML reading and search remain independently reachable.
- Complete Mathnuscripts articles and sourced Elsewhere destinations share the existing paper interface.
- Owner-supplied homestead content, real workshop previews, and fictional residents extend the same world.
- Sunlight, golden hour, moonlight, and weather change atmosphere while the paths stay connected.

### Standalone Read / Elsewhere history

As-built documentation for **worldmwaweru (2026-10-22)**. The approved parent garden is the inherited visual foundation. This child adds full-length Read and sourced Elsewhere surfaces while retaining its materials, connected geography, motion grammar, and direct HTML navigation. Any earlier parent acceptance belongs to foundation history only.

The current cascade in `src/main.tsx` loads `src/styles.css`, the effective shell overrides in `src/mwaweru.css`, `src/components/elsewhere.css`, then `src/components/world-expansion.css`. `src/components/EssayArticle.tsx` lazy-loads `ArticleReader.tsx`, its DOMPurify dependency, KaTeX stylesheet, and `article-reader.css`. `src/App.tsx` owns panel routes and the six garden tools. Native-world evidence remains in `src/world/WorldScene.ts`, `src/world/landscape.ts`, `src/world/water.ts`, `src/world/living.ts`, `src/world/environment.ts`, `src/world/map.ts`, `src/world/native/`, and `src/game/characters.ts`; vehicle simulation and models are in `src/world/engine/vehicles.ts` and `src/world/native/vehicles.ts`.

Frontmatter records reusable values; the sections below describe their use. `PRODUCT.md` owns confirmed product facts. [Publication record](docs/PUBLICATION.md) owns the content boundary, portable provenance, and verification summary. `.impeccable/` is ignored local QA, not a repository dependency or a source of required parent files.

**Historical review: SHIP at the one scored no-WebGL paper-fix scope (2026-10-22).** The reviewer reopened the affected desktop/mobile reader and Links captures, marked the fix resolved, and observed no regressions there. This remains a separate, narrow review in `docs/REVIEW.md`, alongside earlier parent-garden review history.

### Countryside / homestead / workshop extension

As built after the last material correction (2026-10-22), the playable radius grows from 54 to 132 world units. `countryRoads` connects the existing territories to the western airstrip/hangar and eastern launch field. A terrain horizon skirt supports aerial views; the coast and terrain-derived water depth map expand with the world extent. The central geography, note IDs, materials, lighting, and weather remain the inherited world.

The new paper surfaces are `AboutContent.tsx`, `PortfolioWork.tsx`, `ProjectPreview.tsx`, `TravelContent.tsx`, and `Conversation.tsx`, styled by `world-expansion.css`. Directly consumed JSON supplies site copy, the owner's current biography and album, project summaries, fictional dialogue, and attributed links. `PRODUCT.md` and `content/profile.json` own the supplied personal facts; this design record adds no biography. Pages CMS is **CONFIGURED, not authenticated or deployed**; owner GitHub sign-in and publishing/rebuild steps are in `docs/EDITING.md`.

**Historical reviewer disposition (2026-10-22): SHIP at the two-fix verdict-pass scope only.** The same reviewer read four replacement captures and relevant source, scoring both the parked-rocket fog/camera mismatch and dropped cold-reader navigation intent **RESOLVED**. This is not renewed full-surface approval. Separate supplied execution evidence records 46/46 tests and a passing production build after final corrections, expansion checks 32/32, baseline checks 18/18, and follow-up checks 5/5, each browser record with `errors: []`. The captures use actual WebGL and keyboard/touch input, with explicitly documented fixed-step replay for long trips; they do not establish physical-hardware FPS. `docs/REVIEW.md` preserves the evidence paths, capture inventory, and scope. No changes were pushed for that handoff.

### Controls / Thenks persistence follow-up

The 2026-10-23 existing-world update makes Thenks the top workshop project, retains Mathnuscripts as the full-width second project with all 155 local notes, and corrects driver-relative steering and rear-camera follow. The palette, type pairing, material world, and complete-reader boundary remain incumbent.

**Latest finish verdict: SHIP at the single scored persistence-fix scope.** The reviewer opened all eight controls/work captures and found no further material code or visual fix, then scored the documentation correction **resolved**. The dated follow-up in `docs/REVIEW.md` records 52/52 tests, 51/51 controls checks, the successful final production build, and capture boundaries. Publication and deployment are tracked by repository and hosting history.

## Colors

The interface is restrained green and paper; native scene materials own a broader botanical, mineral, timber, clay, water, and winter palette.

### Primary
- **Forest action green** (`green`, `green-hover`): filled actions, carets, and visible keyboard focus, deepening on action hover.

### Secondary
- **Native crown greens** (`crown-dark`, `crown-green`, `crown-mid`, `crown-light`): repeated, mixed foliage pigments across varied tree crowns and acacias. Surface flecks and toon light bands enrich these base assignments.
- **Bridge timber** (`bridge-timber`): repeated native planks at the river crossings. Other timber and clay pigments stay with their authored architectural modules.

### Neutral
- **Quiet paper** (`paper`): dock, reading sheets, map, tools, location labels, and interaction prompts.
- **Dark green ink** (`ink`): inherited HTML text and headings; **moss-muted text** (`muted`) supports metadata and context.
- **Soft reading ink** (`sheet-copy`): repeated portfolio paragraphs beneath darker lead text.
- **Article reading ink** (`reader-ink`): long-form paragraphs and list items, with the larger Read type ramp.
- **Pale leaf rule** (`line`) and **field edge** (`field-line`): list dividers and the search boundary.
- **Action-paper text** (`button-ink`): lettering on filled actions.
- **Leaf state surfaces** (`icon-hover`, `destination-hover`, `destination-active`, `tool-hover`, `tool-active`): localized interactive states; territory location and pressed garden-tool state retain their separate assignments.
- **Muted pictorial ink** (`muted-icon`): reused travel and conversation SVG marks, supporting the darker text rather than introducing a new accent.
- **Preview chrome** (`tool-hover`, `preview-dot`): the existing leaf surface also backs repeated project preview bars; quiet dots identify the preview frame. These are contextual component roles, not a new palette strategy. The generic no-image fallback uses existing forest green and paper; all five current workshop projects use actual website JPEGs.
- **Native edge ink** (`scene-ink`): the modular kit's geometric linework. Character outlines and the depth-ink shader have their own source assignments.
- **Neutral snow** (`snow`): shared terrain and snowy-roof pigment, lit with a neutral key and cool fill for readable blue-gray shadows.
- **Native paving** (`paving`): repeated landmark forecourts, with shader-defined staggered seams.

The five interface custom properties retain their source names. Additional names describe recurring assignments, not new code-level variables. `paper` is the opaque CSS fallback; the runtime paper painting retains its own pale base over that fallback. The root texture defaults to `none` before world initialisation, keeping paper valid when WebGL cannot open. Architecture supplies slate roofs, warm timber, clay, subdued glazing, and stone locally. The depth-aware water shader supplies shallow/deep color, foam, highlights, and caustics. Sunlight, golden light, moonlight, rain, and output color-space conversion affect appearance without replacing material identity.

### Named Rules
**The Material Owns Its Color Rule.** Let native foliage, timber, clay, stone, water, and snow keep their material palette; apply green and paper to interface chrome.

## Typography

**Display Font:** Averia Serif Libre (with Georgia, serif)

**Body Font:** Karla (with sans-serif)
**Semantic Code Font:** `ui-monospace, 'Cascadia Code', Consolas, monospace`, restricted to article code.

**Character:** Averia's irregular serif forms suit the inhabited, illustrated geometry. Karla keeps controls, metadata, note lists, and extended prose clear. Keycaps remain Karla. The code stack is a legitimate semantic reading role, not a display face or a promise that either named system font is installed. KaTeX's bundled mathematical faces serve pre-rendered notation only.

### Hierarchy
- **Display:** regular, fluid welcome heading; `typography.display` records the effective native-shell ramp, not the superseded base selector.
- **Headline:** regular, tightly spaced portfolio-sheet headings. Full articles use `typography.article-title`, capped at 21ch, and become 32px on phones.
- **Title:** regular serif section headings; map and journey titles use smaller contextual sizes. Reader h1/h2 use 29px/1.25 and h3 uses 23px/1.35; phone h2/h3 become 26px/22px. Elsewhere destination names use Averia at 21px.
- **Body:** regular Karla portfolio paragraphs; welcome copy uses 14px with tighter leading (1.65).
- **Reading:** Karla paragraphs and list items use 16px/1.85, reducing to 15px/1.85 at widths up to 600px. The article body is capped at 66ch. Footnotes use 13px/1.7; metadata and source credit remain quieter.
- **Lead:** larger Karla opening paragraphs in dark ink.
- **Excerpt:** project blockquotes use 19px/1.55. Article quotations use Averia at 21px/1.65, becoming 20px on phones. The former preview-only summary selector does not define full-article prose.
- **Label:** semibold filled actions and header navigation. Territory and garden-tool labels are regular (12px); reading metadata is generally 12px, with compact phone variants (11px).
- **Note title:** medium-weight Karla with compact leading, distinct from its metadata line.
- **Code:** article `code` uses the semantic monospace stack at .86em; preformatted blocks provide a 13px/1.8 context and horizontal scrolling. Inline code gets a small tonal inset. Neither treatment applies to navigation, keycaps, or headings.

The serif `mwaweru.` wordmark is 32px with a Karla “Mathenge Waweru” subtitle. Welcome headings use 43px at widths up to 1100px, 35px/1.08 on phones, 33px below 370px, 30px in coarse-pointer short landscape, and 53px from 1650px. Phone welcome copy is 13px/1.6; ordinary portfolio body remains 14px/1.78, lead becomes 17px/1.48, and ordinary sheet headline becomes 35px. Full-article rules above take precedence within the Read surface.

The expansion retains those voices with contextual assignments: full-width featured project titles use Averia at 32px (27px on touch layouts); published-result values use tabular Averia numerals at 32px (26px on touch layouts), with 12px Karla labels and 11px source/context. Conversation quotations are 24px/1.45 and their linked-note titles 23px/1.3; vehicle names are 21px (18px on touch layouts), with tabular Karla speed/altitude at 25px (23px on touch layouts). Captions, travel context, project support text, and action labels reuse 12px Karla; compact identity/HUD guidance uses 11px, reducing to 10px on touch layouts, while preview hosts and HUD units use 10px. The generic no-image preview fallback retains a 38px word treatment (28px on touch layouts); it is not Thenks’ current preview. These observed component assignments do not turn every detector advisory or one-off branding size into a global type-scale step; the pre-existing small metadata role remains contextual.

Both faces are self-hosted WOFF2 with `font-display: swap`. Averia is weight 400; Karla's shipped variable range is 200–800, with regular, medium, and semibold used. Preserve `public/assets/averia-OFL.txt` and `public/assets/karla-OFL.txt`.

### Named Rules
**The Two Voices Rule.** Use Averia for headings and reflective excerpts; use Karla for body reading, navigation, metadata, fields, and keycaps. Semantic code and mathematical notation retain their specialist faces without becoming additional interface voices.

## Layout

The shell fills and clips the viewport (`100dvh`). Canvas, header wash, invitation, tools, dock, atmosphere panel, and reading sheets occupy separate layers. A subtle wash supports identity; paper texture backs the invitation, header navigation, and other reading/control surfaces. Sheets scroll internally with contained overscroll and a sticky toolbar. Recurring spacing steps are observed values, not a strict universal grid.

Ordinary desktop portfolio sheets use a 480px cap, viewport-minus-56px width constraint, right inset 28px, top 101px, and native bottom inset 103px. The workshop widens to `min(800px, calc(100% - 56px))`. Its CMS `featured` boolean supplies the full-width entry class: Thenks leads, Mathnuscripts is second, and Monad is also full-width; Kenyan Tech Stack and Boda Rush share the two-column grid, with 28px row and 24px column gaps. Every featured entry floats a 42%-width preview beside its summary. Published results clear that preview and form a ruled three-column semantic definition list, followed by reporting context and a source link. Full articles use `min(760px, calc(100% - 56px))`, with 43px horizontal padding and a centred 66ch body. These sheets retain the sticky toolbar, internal vertical scroll, and the character's actual world position. At widths above 900px, a camera view offset leaves scenery beside the sheet.

The dock is a single shallow paper strip with six territory buttons and six garden tools: Map, Vehicles, Kijazo, Paths, Index, and Links. Its effective desktop minimum height is 61px; it sits 22px from either side and respects the bottom safe area. The atmosphere panel sits beside the lower-right tool tray, with a three-column light selector and a compact weather row.

The vehicle HUD is a separate paper layer above the desktop dock (bottom 112px), wrapping identity, metric, and actions as needed. Above 1200px it is horizontally centred at width `min(640px, calc(100% - 250px))`. From 601px through 1200px it is left-aligned (left 22px, no centring transform) at width `min(640px, calc(100% - 270px))`, clearing the right-hand map. The later touch/coarse-pointer override takes precedence: upper left (top 90px, left 14px, right 70px), with full-row action buttons and mobile-specific guidance. The homestead pairs its heading with a cropped portrait and uses a two-column album with first/last figures spanning both columns.

Effective responsive behavior across `src/styles.css`, `src/mwaweru.css`, and the later `src/components/world-expansion.css`:
- **From 1650px:** enlarge outer header/invitation margins and the welcome display.
- **Up to 1100px:** hide the inline territory row and distribute all six garden tools across the dock; narrow the invitation. This expansion override takes precedence over the earlier 800px territory cutoff.
- **Up to 900px:** inherited header padding and sheet top clearance compact; sheet top becomes 84px.
- **Up to 800px:** compact the header and retain 46px-minimum dock actions. The expanded map retains all six territory destination rows, with additional airstrip and launch-field routes.
- **Up to 600px, or coarse pointer with height up to 600px:** compact invitation with 31px left/right insets and bottom 116px; tools move upper right (top 90px; inherited 150px with a journey). Hide zoom controls, the collapsed minimap, and the header GitHub icon; GitHub remains in workshop and contacts. Use a 96px thumbstick at lower left, separated circular jump/action buttons with 52px minima at lower right, and safe-area-aware bottom positions. While aboard, the nearby action becomes Exit and Jump is replaced by the HUD's flight actions. The atmosphere panel fits beside the tools, capped at `calc(100vw - 81px)`. The workshop becomes a single column, every featured preview becomes full-width without a float, and its sheet uses `calc(100% - 24px)` width. The vehicle HUD moves above the scenery as described above.
- **Up to 600px:** inherited phone sheet rules set top 75px, horizontal insets 12px, and padding `0 24px 25px`; the native bottom inset is 90px. The full reader uses `calc(100% - 24px)` width and 23px horizontal padding. Search remains at least 48px tall; the shortcut hint is hidden. Six dock actions retain icons above their labels and 46px minimum height.
- **Coarse-pointer short landscape:** invitation width is 295px, atmosphere panel top is 81px, thumbstick/actions sit at bottom 105px, jump/action buttons become a horizontal pair, the location label is hidden, and expanded map width is 320px. Desktop-width inherited header/sheet rules still participate in this cascade.
- **Up to 370px:** tighten the header and hide the wordmark subtitle; the native welcome size remains its native override.
- **Up to 360px:** hide only the redundant circular monogram, keeping the `mwaweru.` wordmark text. Published results become stacked rows, each with its label left and value right, so the numbers fit the narrow paper sheet.

Rendering treats coarse pointers or width below 700px as handheld for camera span and density. Seeded plant and inhabitant counts remain the same on mobile. This is separate from CSS breakpoints. Portrait framing keeps the actor above the invitation; overview fits the same native map to the aspect ratio beside its labelled schematic and destinations. Scene framing is implemented in `src/world/WorldScene.ts`; publication verification sizes are recorded in `docs/PUBLICATION.md`.

Code blocks, tables, and display mathematics scroll horizontally inside their own bounds rather than widening the document. Images stay within the body measure. Elsewhere uses full-width destination rows; About contact links form a two-column grid. HTML reading remains available independently of WebGL, with opaque paper on the sheet and toolbar. Loading and failed-world cards are hidden while a portfolio panel is open.

## Elevation & Depth

Environmental depth comes from native geometry, terrain height, material-specific paintings sampled triplanarly, eight toon bands, geometric edges, depth-ink postprocessing, directional shadows, and fog. Wood grain/knots, stone courses, roof shingles, foliage flecks, earth, paving, and fine snow grain stay distinct. Glass and emissive window surfaces bypass opaque surface painting; sparse transparent glazing keeps native desks and shelves visible. Terrain-derived water depth controls transparency, foam and caustics, with moving highlights. Winter retains a neutral key and cool fill; golden hour warms light and fog, rain cools/dims them, and moonlight retains the actor’s lowered, offset lamp.

The expanded coast/depth map and horizon skirt keep that material continuity in flight. `WorldScene.ts` adapts camera span to each vehicle and altitude. The bike, Land Cruiser, boat, and plane use `drivingCameraYaw` to follow behind their +Z-facing models: target heading plus π, shortest-angle interpolation, exponential damping, and a reduced-motion snap. Returning to walking takes the short turn back to the inherited camera yaw. The rocket retains its separate framing, blending ground and aerial focus/offset across altitude 8–35; aerial fog applies above altitude 15. Returning to the pad restores ground framing inside the ground-fog clear range. The retained landed observation is 43.75 camera distance against fog near 65; this is correction evidence, not a new universal camera token.

Paper overlays use soft, low-opacity green-tinted shadows and original runtime-generated fiber grain. Buttons and reading rows remain flat inside them. The HTML interface has no backdrop blur or hard-offset-shadow vocabulary; native fire, lighting, glass, and toon shading are legitimate world materials.

### Shadow Vocabulary
- **Navigation dock / vehicle HUD:** `0 7px 26px rgba(32,58,37,.10)`.
- **Reading sheet:** `0 12px 38px rgba(29,51,34,.16)`.
- **Header navigation:** `0 4px 19px rgba(36,62,42,.065)`.
- **Invitation:** `0 8px 28px rgba(34,60,39,.085)`.
- **Atmosphere panel:** `0 10px 34px rgba(25,51,36,.17)`.
- **Location label:** `0 5px 18px rgba(34,60,39,.08)`.
- **Exploration help:** `0 9px 30px rgba(43,60,33,.13)`.
- **Interaction prompt:** `0 6px 18px rgba(36,55,34,.13)`.
- **Garden map:** `0 7px 21px rgba(36,55,34,.1)`.
- **Touch action:** `0 4px 12px rgba(36,55,34,.1)`.

### Named Rules
**The Paper Above Place Rule.** Reserve ambient HTML lift for paper layers above scenery; keep actions and reading-list rows flat within those layers.

## Shapes

HTML corners are gently softened: keycaps and small schematic areas use `rounded.keycap`; small controls use `rounded.control`; actions, prompts, maps, thumbnails, and tool trays use `rounded.action`; dock/header navigation use `rounded.dock`; broad paper surfaces use `rounded.surface`. The atmosphere panel’s contextual 8px corner is not a new universal scale step. Circular forms belong to the monogram, SVG icon controls, map markers, thumbstick, and touch actions. Single-pixel separators organize reading lists instead of individually elevated cards.

The world deliberately reuses authored primitives: boxes, cylinders, deformed spheres, cones, extruded silhouettes, curved roof profiles, and arcs. Composition, material seams, ink, and deformation give them specificity. Roofs have curved eaves and shingle linework; the waterfront has readable arched openings; trees vary among flattened acacias, clustered/elongated crowns, and tiered snow pines. Reusing geometry is part of the native kit, not a defect or an instruction to return to photo plates.

The native vehicle kit follows that form language: a low dark motorcycle with brown saddle and visible forks/spokes; a boxy sand-toned Cruiser with rack and spare wheel; an extruded motorboat hull with timber seating; a cream/ochre high-wing bush plane with struts and propeller; and a ringed silver Starling with fins, landing legs, and a native flame plume. Their local pigments describe the models, not extra interface tokens. Runtime paper labels use Karla and disappear while occupied; the HTML HUD takes over the vehicle identity.

## Components

### Buttons

Quiet, compact actions that leave the world in charge.
- **Primary:** forest fill, light lettering, semibold Karla, softened action corners, and inline SVG arrow/external-link mark. Desktop minimum height is 46px; the phone invitation uses 45px and inherited padding `10px 16px`.
- **Text:** transparent, regular Karla (12px), padding `5px 0`, SVG mark, hover underline offset 4px.
- **Icon:** transparent circle (36px), localized leaf hover. The tool tray uses 38px desktop/40px touch; the sheet close uses 40px. Phone header sound control is 36px × 42px.
- **Focus:** green outline (2px) offset 4px for buttons, links, fields, and selects.
- **Disabled:** opacity .4 and default cursor; destination walking/zoom depend on scene readiness, and the touch nearby-action depends on proximity.
- **Motion:** primary background transition (180ms ease); other small states change directly.

### Cards / Containers

Paper supports reading and orientation rather than packaging every item.
- **Reading sheet:** paper, broad softened corners, ambient shadow, sticky toolbar, internal scroll, and an explicit close control.
- **Help:** smaller paper layer with SVG close control and concise keyboard/touch instructions.
- **Project entries and narrative paths:** flat article blocks with single-pixel rules. Repeated website-preview frames use an action-sized corner, leaf-rule border, shallow host bar, and top-aligned real screenshots. They do not add independent card shadows. The garden thumbnail remains an actual native-scene capture, displayed with `object-fit: cover` at 190px high. `public/assets/world-project.png.provenance.json` identifies its immutable raw archive under `docs/provenance/`; historical staging/capture locations are not build prerequisites.
- **Map:** compact desktop schematic, or expanded paper panel with outlined Karla labels, position dot, six territory destination rows plus airstrip/launch-field routes, and a clear close action. Country roads and the wider coast appear in the schematic. Expanded height is capped at `calc(100dvh - 190px)` with contained internal scrolling. Territory marker colors remain sourced from `src/world/map.ts`.

### Inputs / Fields

Search is a restrained outlined line: SVG search mark, gap 10px, minimum height 48px, padding `0 12px`, small control corners, and text-input padding `12px 0`. It inherits the green caret/focus treatment. The native subject select remains paper-backed, with maximum width 205px on desktop and 190px on phones; the phone select has a 42px minimum height. No-result feedback is inline with a clear-search action; there is no invented error-field variant.

### Navigation

- **Identity/header:** serif `mwaweru.` and the personal-name subtitle lead; semibold About, Work, and Writing actions sit on shallow textured paper and reach HTML sheets directly. GitHub is a direct desktop header link as well as a prominent workshop row and an existing contact. `aria-current="page"` underlines the selected sheet; hover uses a 6px underline offset.
- **Territory dock:** six text buttons initiate actual walking. Pale current-location treatment uses `aria-current="location"` and follows the character's district, not the requested destination.
- **Garden tools:** SVG plus label for Map, Vehicles, Kijazo, Paths, Index, and Links. Map, Vehicles, and Links expose pressed state; compact layouts put icons above labels. Vehicles opens `#travel`; Links opens the local Elsewhere sheet (`#links`).
- **Map destinations:** full-width flat rows initiate the same terrain-aware navigation as dock buttons. SVGs, rather than text glyphs, provide pictorial icons.

### Atmosphere

“A different light.” opens a compact paper panel. Sunlight / Golden hour / Moonlight and Still / Breeze / Rain are separate, labelled `aria-pressed` groups. Opening focuses the close control; explicit close or Escape restores focus to the atmosphere toggle. These choices affect native light, fog, wind, clouds, and rain; they do not change routes. Still retains gentle ambient motion; reduced-motion preference freezes ambient animation and hides falling rain.

### Interaction and Touch

The nearby-object prompt is a paper action, not the former projected place pin. It has an E keycap on desktop, context/title, and SVG arrow. Touch hides the keycap and provides separate Jump and Read/Talk/Enter controls. Thumbstick capture, release, cancellation, and lost capture control actual walking input. Route status provides Stop or an arrival-dismiss action. Journey status offers next-note walking and an explicit exit.

The small contextual line in the interaction prompt and the wordmark subtitle describe interaction/identity; they are not a reusable decorative eyebrow style.

### Reading List / Full Article

Notes remain flat full-width rows with a growth/read mark, medium-weight title, subject/time metadata, and an SVG arrow. Hover underlines the title. Green and ochre distinguish growth statuses, also written out beside the article title. Optional local history substitutes a checkmark. Opening a note renders its complete local body, followed by related notes and an action to find its planted object.

`EssayArticle.tsx` supplies the title, growth metadata, related notes, and garden action. `ArticleReader.tsx` supplies same-origin lazy JSON loading, runtime DOMPurify sanitisation, copy-link feedback, optional “On this page” navigation, body markup, and a quiet source-credit footer. Loading has an inline status; a failed fetch has a retry action. Clipboard failure offers the browser address as a fallback.

Shareable routes retain the original note IDs as `#essay/<encoded-note-id>`. Known links between represented articles open the local reader; section and footnote anchors scroll within the sheet without replacing that route hash. Section scrolling respects reduced motion. External citations retain their destinations. “Original publication” is a secondary footer link only; complete reading does not require a Mathnuscripts redirect.

Cold shared-article routes render full text before constructing WebGL. Closing the sheet or choosing a spatial action requests the world. `App.tsx` retains a pending `NavigationIntent` until a world exists and dispatches it with panel/overview pause cleared; the ready-with-no-panel effect flushes deferred requests. District, essay, vehicle, and person destinations share this path; journey start/next actions enqueue essay destinations. The follow-up evidence confirms arrival at the exact requested note, rather than merely successful engine startup.

The article body preserves rich prose, lists, semantic code, tables, images, footnotes, and pre-rendered mathematical markup styled by KaTeX CSS. Subtle rules, tonal code/table insets, and a collapsible contents block structure long text without introducing elevated content cards. An unavailable published attachment gets an inline notice while the complete text stays readable. Content import scope and SHA-256 validation are recorded in `docs/PUBLICATION.md`.

### Elsewhere / About / Work

`ElsewhereLinks.tsx`, `AboutContent.tsx`, and `PortfolioWork.tsx` extend the existing paper-sheet grammar. Elsewhere destination rows have a 76px minimum height, 17px vertical padding, a single leaf-rule separator, an SVG identity mark, Averia title, Karla description, and a direction/external-link mark. Hover underlines the title; keyboard focus inherits the shared green outline. Contact links use flat 46px-minimum rows.

`content/elsewhere.json` records `https://linktr.ee/mathengewaweru` and `https://mwaweru.com/about` as public sources. LinkedIn, X, Thenks, Mathnuscripts, and About come from Linktree; GitHub, email, the personal statement, and historical Shukran, Agrarian, voting, and crowdsourcing details come from the linked About page. Mathnuscripts and About rows open local panels. Other web destinations are explicitly external; email uses its mail action. Sources remain visible as secondary attribution. That historical source boundary remains intact: the current Founder & CEO of Thenks role and the supplied degree, experience, and achievements now come explicitly from the owner via `PRODUCT.md` and `content/profile.json`, not an employment inference from a project link.

The homestead pairs the supplied portrait with the heading, followed by the current role, introduction, a ruled “Right now” section, supplied biography, existing personal statement, workshop/writing actions, contacts, and an 11-image captioned album. The symbolic portrait is labelled existing DALL·E artwork from 2022. This is owner-supplied content, not a licence to invent further personal claims.

The 800px-capped workshop leads with **Thenks**, using the actual website JPEG at `public/assets/projects/thenks.jpg` and canonical URL `https://www.thenks.co/`, also used in Links and About. Its Work entry shows **$500K+ tips processed, 80+ properties onboarded, and 2,050+ staff members impacted**, explicitly labelled “Published results from the first eight months.” with a [published-results source](https://www.thenks.co/#results). These editable figures are an editorial snapshot, not live analytics; the source page’s raw HTML counters begin at zero and settle in the browser, where the supplied observation and JPEG show the published totals.

**Mathnuscripts remains the full-width second project**, with its real site JPEG, substantial summary, and local-reading CTA for all 155 complete notes. All five current workshop projects have actual website JPEG previews; the former Thenks icon/word placeholder is superseded. `ProjectPreview.tsx` retains a generic no-image fallback for a future entry without a preview. Kenyan Tech Stack, Boda Rush, and Monad additionally offer explicit user-loaded sandboxed iframes. The component shows a loading status, live-site context, and a close control; the normal project link remains available. Screenshots appear before opt-in iframe loading. Preview host bars and dots are contextual chrome, not evidence of a browser session running inside a static image.

### Travel / Vehicles / Conversations

`TravelContent.tsx` presents the supplied Zontes photograph, flat vehicle entries with SVG marks and walk-to actions, and five explicitly fictional residents. Native vehicles are the owner-photo-inspired Zontes 250V, Land Cruiser, motorboat, bush plane, and Starling rocket. Nearby E/Enter or touch action boards; Up/Down or W/S supplies throttle, and Left/Right or A/D steers toward the driver’s corresponding side, with the same thumbstick mapping. For the +Z-facing models, user steering subtracts yaw in ground/taxi and airborne plane simulation; the ground branch reverses yaw with negative speed for natural reverse steering. This mapping holds across all four compass headings. Safe exits return to walkable land; the boat requires proximity to shore and aircraft require landing. The plane takes off and offers Return & land to its runway; the rocket ascends, hovers, and lands vertically on its original pad.

The paper vehicle HUD uses an SVG identity mark, serif vehicle name, contextual keyboard/touch guidance, tabular speed or altitude, flight action where applicable, and Park & exit. Ground/taxi keyboard guidance explicitly names arrow speed/steering with WASD equivalence; touch guidance names the thumbstick. The parked rocket says “Ready for a vertical hop” rather than giving a driving hint. Disabled exit has an explanatory shore/landing hint. The HUD sits bottom-centre only above 1200px, bottom-left clear of the map at 601–1200px, and upper left under the later touch/coarse-pointer override, which gives actions a full row. The same simulation drives both input modes. Reading/panel pauses still freeze vehicle motion, including airborne states.

`Conversation.tsx` uses a muted SVG mark, resident name/role, serif greeting, authored paragraphs, a ruled full-width note action, and a return-to-wandering action. `content/people.json` is editable and explicitly identifies the residents as fictional; each recommendation is an exact real local article ID: Wanjiku → “Pillars of Building a Great Startup”; Asha → “Extending Human Intelligence”; Otieno → “Africa and the Discipline of Hope”; Jabali → “Space Exploration is About Perspective”; Imani → “Choosing your Game will Choose Your Life”. These are authored conversations, not generated biographies or claims about real people.

### Editable Content / Asset Boundary

`.pages.yml` configures five editors for `content/site.json`, `content/profile.json`, `content/projects.json`, `content/people.json`, and `content/elsewhere.json`; the app consumes these files directly. Project fields include the `featured` boolean, published-result value/label pairs, reporting context (`statsNote`), and source URL (`statsSource`). Media resolution supports Vite `BASE_URL`. The editorial validator handles booleans, requires a source for supplied statistics, keeps Thenks first, retains the Mathnuscripts entry and GitHub ID, and checks field types, required IDs, URLs, media, and referenced notes. `docs/EDITING.md` documents the owner's GitHub sign-in, publishing, and rebuild flow. Configuration does not establish an authenticated CMS connection or deployment.

The historical expansion provenance scan covered 15 new shipping rasters with zero missing origins: 11 sourced WebP derivatives with sidecars under `public/assets/photos/` and four website JPEGs. The supplied 2026-10-23 project-preview scan covers all **five** current JPEGs under `public/assets/projects/`, with zero missing origins. The added Thenks JPEG embeds its source origin: an actual Playwright capture at 1600 × 1000 on 2026-10-23 after counters settled, encoded as JPEG quality 82. No new image generation was performed; the pre-existing DALL·E artwork keeps its original attribution. Preserve these origins, the native-garden thumbnail's archived raw source, article-import boundaries, and both font OFL files. Review captures remain local QA rather than shipping image assets.

### Native World and Characters

The wanderer is articulated geometry with copper jacket, curly hair and facial details, deep teal scarf, leather satchel and map, trousers, and footwear. Limb gait, torso bob, head sway, and bag/scarf secondary motion follow simulation movement; static details are merged within articulated groups. Kijazo has a sage body and dark-blue face, follows the wanderer, and offers deterministic recommendations from published notes. Native seeds, buds, and evergreen campfires reflect manifest growth status. Seeded grass, flowers, reeds, fish, birds, butterflies, bees, night fireflies, drifting leaves/clouds, chimney smoke, and a gently bobbing moored boat inhabit the existing terrain. Authored counts in `src/world/landscape.ts` and `src/world/living.ts` are implementation details, not reusable visual quotas.

Camera follow, restrained mouse peek, terrain grounding, sliding, jumping, and A* navigation share one connected world. Reading pauses movement at the exact location; closing restores world focus there. Reduced-motion preference freezes ambient landscape animation, snaps camera/light interpolation, and minimizes CSS motion while preserving deliberate walking. Mechanics live in `src/world/WorldScene.ts` and `src/world/engine/terrain.ts`; recorded browser checks do not establish physical-hardware frame rates.

The retained post-correction scene snapshot records 155 notes, 240 trees, **5,814 generated grass placements**, 600 flowers, five vehicles, five residents, radius 132, 87 fish, 20 birds, 32 butterflies, 16 bees, 99 fireflies, and 220 reeds. Grass capacity is 6,500, but `grass.count = placed` makes 5,814 the actual generated instance count. These are current as-built statistics, not density quotas or a claim that every instance is visible in a frame.

## Do's and Don'ts

### Do:
- **Do** build scenery and characters from the authored native mesh kit and material-specific surface paintings.
- **Do** keep neutral snow, cool shadows, legible landmark openings, and varied vegetation silhouettes.
- **Do** use paper-backed controls over detailed scenery and separate touch movement, actions, and tools.
- **Do** keep headings in Averia and reading/control text in Karla.
- **Do** reserve monospace for semantic article code and specialist mathematical faces for notation.
- **Do** retain accessible HTML navigation, visible keyboard focus, source links, and internally scrollable reading.
- **Do** preserve full local reading, original note IDs, opaque paper without WebGL, and the secondary source-credit footer.
- **Do** respect reduced motion while preserving deliberate walking and direct access to writing.
- **Do** preserve shipping raster provenance and the self-hosted fonts' OFL files.

### Don't:
- **Don't** restore full reference-photo scene planes or the superseded four-place travel model.
- **Don't** recolor every native material into the interface palette or flatten winter into yellow-green lighting.
- **Don't** turn flat reading-list rows into individually elevated cards.
- **Don't** replace SVG pictorial icons with text-glyph icons.
- **Don't** treat model-specific pigments, advisory detector findings, or software-renderer timings as new system requirements.
- **Don't** invent biography, social destinations, or live-product claims from a published project note.
- **Don't** broaden the 155-note public snapshot import into unpublished vault content or clippings.

Not canonized: unused `--paper-deep`, superseded base/plate/pin/four-place and preview-only summary selectors, one-off model pigments or branding sizes, and local tooling previews are not reusable shipped primitives. Runtime paintings are source-generated material inputs, not reference-photo plates. Contextual prompt, preview-host, identity, and HUD metadata are not a decorative eyebrow system or a global small-type prescription. Historical detector code-font advice concerned the semantic reading role recorded above; the expansion and controls detector's contextual palette/type advisories are not blanket defects or new universal tokens. Scene capacities are not generated counts, and software-renderer timings are not hardware benchmarks. Thenks’ published snapshot is not live analytics, and its former branded fallback is not its current preview. Scoped SHIP verdicts are not full-surface approval, CMS authentication, or deployment certification.
