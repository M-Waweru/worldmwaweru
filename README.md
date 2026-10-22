# worldmwaweru

A personal world for Mathenge Waweru’s work, writing, and wandering. The Mathnuscripts grow as a connected, natively rendered Three.js garden: published notes become seeds, buds, and campfires in five territories around a central Trailhead. Kijazo accompanies the visitor and introduces optional Origins, Wanderer, Maker, and Sovereign journeys. About, Work, and Writing remain directly accessible alongside exploration.

Repository: **https://github.com/M-Waweru/worldmwaweru**

## Read the complete Mathnuscripts here

All **155 represented published notes** include their complete article text in this repository. Opening a note displays its full content in a wide, readable paper sheet; visitors do not need to leave the website to read it.

- Rich headings, lists, code, tables, images, footnotes, and pre-rendered mathematical notation.
- Links between imported notes open the other note in the same reader.
- Shareable `#essay/<encoded-note-id>` URLs, local section navigation, and copy-link action.
- Same-origin, content-hashed JSON article files, loaded only when needed.
- Full articles remain accessible when WebGL is unavailable.
- Source attribution is an optional secondary link, not the primary reading action.

Article extraction is limited to the existing published-note manifest. Navigation, analytics, scripts, and unrelated source pages are not copied into article content. Three source media files are included locally. One original audio attachment returns 404 at the published source; its note shows an inline notice instead of a broken player.

## Links and portfolio

The **Links** tool brings together the verified destinations from [Mathenge’s Linktree](https://linktr.ee/mathengewaweru): LinkedIn, X, Thenks, Mathnuscripts, and About. Public contact/project details from the linked [About page](https://mwaweru.com/about) add GitHub, email, and the historical Shukran, Agrarian, voting, and crowdsourcing projects. `content/elsewhere.json` records these sources. Mathnuscripts and About entries open the relevant local panels; third-party destinations open explicitly as external links.

## The living world

- Original painted material textures for timber, stone, earth, foliage, roof tiles, snow, paving, flowers, and paper.
- Terrain-aware clear water, moving highlights, bank foam, and caustic-like detail.
- 135 trees, 6,500 grass placements, 600 flowers, and 220 reeds in the current authored scene.
- 87 fish, 20 birds, 32 butterflies, 16 bees, nighttime fireflies, drifting clouds, and a gently moving boat.
- A garden-atmosphere panel with sunlight, golden hour, moonlight, still air, breeze, and rain.
- Warm windows after dark and optional synthesised ambient sound with quiet birdsong.

The living scenery shares the existing world and does not change note IDs, published URLs, reading paths, or traversal geography. Reduced-motion preferences continue to suppress ambient animation.

## Run

Use Node.js 22.18+ or 24+ (the engine tests use native TypeScript stripping).

```sh
npm ci
npm run dev
```

Open **http://localhost:5195**. The strict project port avoids silently opening another locally running app. `npm run preview` serves the production build at **http://localhost:4195**.

```sh
npm test
npm run build
npm run preview
```

The production build uses the bundled published-note manifest when the author's local vault is unavailable. To regenerate published content from a vault:

```sh
VAULT_PATH="/path/to/Mathnuscripts" npm run garden
```

Only the existing allowlisted folders and explicitly published Markdown files enter the manifest.

## Controls

- **WASD / arrows:** walk; **Shift:** run; **Space:** jump.
- **Click / tap the ground:** find and walk a traversable route.
- **E / Enter:** interact with a nearby note, guide, or landmark.
- **M:** map overview; **K:** Kijazo; **Ctrl / Cmd K:** note search.
- **Escape:** leave a note, close a sheet, or close the map/help.
- **Atmosphere control:** choose the light and weather; Escape or the close control returns keyboard focus to its trigger.
- **Phone:** thumbstick movement, nearby-object action, jump, and tap-to-walk. Controls work in portrait and landscape.
- Territory buttons choose a walking destination; they do not switch scenes or teleport the visitor.

Reading pauses movement and preserves the visitor’s actual map position. The accessible index and direct essay links work independently of traversal.

## Content links

The website retains original note IDs for local links and history. Optional source credits use the live source-folder route, not a URL-encoded note title:

```text
https://mathnuscript.com/content/essays/choosing-your-game-will-choose-your-life
```

The shared route helper is `src/game/published-links.mjs`. Audit all bundled destinations against the live published route index and HTTP responses:

```sh
npm run garden:links
npm run garden:links -- --fix
```

The fix command changes only URL fields after every bundled destination is verified. The current audit verified all 155 notes successfully.

### Refresh full article snapshots

Full bodies are already bundled; ordinary installs and builds require no access to the author's vault, no live Mathnuscripts API, and no content-download step.

To refresh bodies from the currently published site:

```sh
npm run articles:sync
npm run articles:check
```

A local, already-published Quartz export can also supply the same URLs without fetching each page:

```sh
QUARTZ_PUBLIC_DIR=/path/to/quartz/public npm run articles:sync
```

The sync script extracts only the main article, sanitises it, rewrites known note links, imports available same-origin media, and writes `src/generated/articles-manifest.json` plus `public/articles/`. A build validates every represented article's presence and SHA-256 digest. When changing the published-note manifest, refresh articles before building.

## Implementation

- `src/world/WorldScene.ts`: simulation loop, input, articulated player, camera, proximity interactions, lighting, native overview, and ink rendering.
- `src/world/engine/terrain.ts`: heightfield, walkability, simplified collisions, fixed-step controller, and A* routing.
- `src/world/native/`: modular native architecture, vegetation, material/spatial batches, and geometry helpers.
- `src/world/native/textures.ts`: original, seeded runtime canvas paintings applied to native materials.
- `src/world/water.ts`: depth-aware river and coastal water shader.
- `src/world/living.ts`: instanced ambient fauna, reeds, fireflies, drifting foliage, clouds, and rain.
- `src/world/environment.ts`: shared, typed atmosphere state.
- `src/world/landscape.ts`: terrain, river/bridges, landmarks, note plants, grass/flowers, and Kijazo.
- `src/world/map.ts`: territory and narrative-path domain data; deterministic note placement.
- `src/game/characters.ts`: native articulated character and companion models.
- `src/App.tsx`: accessible reading, search, guide, journeys, map, and touch controls.
- `src/mwaweru.css`: the evolved personal-portfolio interface, preserving the established visual world.
- `src/components/PortfolioWork.tsx`: factual portfolio entries and the curated Avocado project note when present in the published manifest.
- `src/components/ArticleReader.tsx`: lazy full-length reading, sanitised markup, local links, source credits, and table of contents.
- `src/components/ElsewhereLinks.tsx` and `AboutContent.tsx`: sourced links, biography, and contact details.
- `scripts/article-pipeline.mjs` and `scripts/sync-articles.mjs`: published HTML extraction and portable local article snapshots.
- `scripts/build-garden.mjs`: published vault ingestion and manifest generation.

The active scene uses native meshes, instanced vegetation, shader water, and real terrain coordinates. The reference illustrations guide its art direction; the scene does not render them as photographic backdrops. The older garden modules and reference assets remain available as prior work.

Material textures are original source-generated artwork; font licenses remain under `public/assets/`. The current Work thumbnail is a photograph of the running native scene, with embedded origin metadata and a provenance sidecar. Its exact raw source is archived under `docs/provenance/` for portable provenance. Development captures, dependency folders, builds, private environment files, and asset staging are excluded from Git.

## Verification and design

The 35 automated tests cover publication/links, deterministic placement, connected routes, water/bridges, collision sliding, navigation corners, frame-rate-independent movement, analog input, jumping, boundaries, finite roof geometry, full article preservation, local link rewriting, sanitisation, missing media, and complete local-body coverage.

`DESIGN.md`, `PRODUCT.md`, and `docs/WORLD_PLAN.md` record the visual system, confirmed product facts, and recovered original garden plan. Renderer work and position snapshots are available through `window.__gardenEngine.getSnapshot()` in development only. Headless tests use software WebGL; their timings are not physical-phone FPS measurements.

With the development server running, the optional browser verification exercises full local reading, article deep links, internal note navigation, source-linked portfolio/contact details, and phone reading:

```sh
CHROME_PATH=/absolute/path/to/chrome \
npm run test:browser
```

The browser tooling is development-only and is not part of the production application. It uses installed Chrome by default or `CHROME_PATH`; set `MWAWERU_URL` to verify another development URL. Captures are written to ignored `.impeccable/review/worldmwaweru/`.

Before committing, `npm run repo:check` checks intended repository files for oversized assets and common private-credential formats. It does not print matched credential values.
