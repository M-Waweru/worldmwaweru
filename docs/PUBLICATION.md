# worldmwaweru — publication record

Recorded 2026-10-22. Standalone repository: [M-Waweru/worldmwaweru](https://github.com/M-Waweru/worldmwaweru). The approved garden supplies the inherited visual foundation; this child extends it with full local reading and sourced portfolio links. [DESIGN.md](../DESIGN.md) records the implemented visual system; [PRODUCT.md](../PRODUCT.md) records confirmed product facts.

**PEER REVIEW: SHIP — the one scored no-WebGL paper fix is resolved.** See [REVIEW.md](REVIEW.md) for the limited verdict scope. GitHub delivery is recorded by the target repository's `main` history; this document records implementation and verification, not a deployment announcement. Earlier parent acceptance applies only to the foundation.

## Built features and source map

| Feature | Repository sources |
| --- | --- |
| Full local articles, original-ID `#essay/<encoded-note-id>` routes, related notes and garden return | `src/App.tsx`, `src/components/EssayArticle.tsx` |
| Lazy reader, DOMPurify sanitisation, local note links, hash-preserving section/footnote scrolling, copy-link feedback, secondary original-publication footer | `src/components/ArticleReader.tsx` |
| Paper reader capped at 760px; Karla 16px/1.85 and 66ch measure, 15px/1.85 on mobile; Averia headings, semantic-code monospace, pre-rendered KaTeX CSS | `src/components/article-reader.css`, `src/styles.css`, `src/mwaweru.css` |
| Five dock tools including Links; opaque reader/toolbar when WebGL fails, with the recovery card hidden while a panel is open | `src/App.tsx`, `src/mwaweru.css` |
| Elsewhere destinations, biography/contact links, sourced Work entries | `content/elsewhere.json`, `src/components/ElsewhereLinks.tsx`, `src/components/AboutContent.tsx`, `src/components/PortfolioWork.tsx`, `src/components/elsewhere.css` |
| Public HTML extraction, sanitisation, known-note rewriting and media caching | `scripts/article-pipeline.mjs`, `scripts/sync-articles.mjs` |
| Offline article presence/identity/SHA-256 build checks | `scripts/check-articles.mjs`, `package.json` |

## Public content boundary

- **155 complete public article bodies**, restricted to the existing eligible IDs in `src/generated/garden-manifest.json`. `src/generated/articles-manifest.json` maps those IDs to source URLs and SHA-256-addressed snapshots in `public/articles/`.
- The implementation handoff records **154 pages from an already-public local Quartz HTML export and one from public HTTP**. The local export and the author's vault are not required to install, build, or read the bundled articles. This extraction does not import a broader vault, unpublished notes, or clippings.
- Extraction retains the main article's rich text and pre-rendered mathematics; source navigation, scripts, analytics, and unrelated page chrome are excluded. `sanitize-html` handles extraction; DOMPurify sanitises again before runtime insertion.
- Known links between represented notes route locally. External citations retain their meaning; the original publication is a secondary footer credit. There is no forced Mathnuscripts redirect.
- `content/article-media.json` records **three cached local media files** and **one unavailable published audio attachment**. The handoff observed HTTP 404; the stored inventory groups 404/410 failures. Its article shows a graceful inline notice and retains the complete text.

## Link and asset provenance

[Mathenge's Linktree](https://linktr.ee/mathengewaweru) establishes LinkedIn, X, Thenks, Mathnuscripts, and About. The linked [public About page](https://mwaweru.com/about) supplies the statement, GitHub/email, historical Shukran role, and Agrarian, voting, and crowdsourcing projects. `content/elsewhere.json` retains the source URLs. Mathnuscripts and About entries open local panels. No current Thenks founder role, employment, or commercial metrics are inferred.

The world uses original source-generated runtime paintings. The Work thumbnail, `public/assets/world-project.png`, is a capture of the native scene; `public/assets/world-project.png.provenance.json` points to its exact raw archive, `docs/provenance/world-project-source-5f8f4abd10a01a23.png`. Historical staging/capture references in origin metadata are production history, not required parent files. Averia and Karla font licenses remain in `public/assets/averia-OFL.txt` and `public/assets/karla-OFL.txt`. The article code stack is a system fallback for semantic code, not an additional display face or an installed-font guarantee.

## Portable operation

- Node.js **22.18+** (or 24+) supports the existing native TypeScript test workflow. `README.md` uses the standalone `worldmwaweru` heading.
- Vite uses strict development port **5195** and preview port **4195** (`vite.config.ts`). Article JSON/local-media paths and the Work thumbnail use Vite's `BASE_URL`; no deployment base or hosting target is asserted here.
- Reader data is already bundled. Ordinary builds use local SHA-256 checks without downloading content. `npm run articles:sync` is the explicit public-content refresh; `QUARTZ_PUBLIC_DIR` optionally selects an already-published HTML export.
- Browser tooling is development-only `playwright-core`, using installed Chrome or optional `CHROME_PATH`; `MWAWERU_URL` selects the target URL. `scripts/verify-worldmwaweru.mjs` defines the checks.
- `.impeccable/` is ignored local QA. Parent metadata, local captures, and a design sidecar are not repository prerequisites; the versioned design truth is `DESIGN.md` and this record.

## Verification record and review handoff

Existing browser output checked at **2026-10-22T02:24:27.033Z** reports **18/18 passing checks, `errors: []`**. It covers the 155-note index, a full article through its final paragraph, local-origin reading, preserved world position, deep-link reload, internal note navigation, Links/Work/About content, five mobile tools without document overflow, internal mobile scrolling, same-origin article requests, and readable opaque paper without WebGL. Browser timings use software graphics and establish no hardware FPS claim.

Required captures are already present in ignored local QA output under `.impeccable/review/worldmwaweru/`:

| Review surface | Recorded viewport | Capture names |
| --- | --- | --- |
| Full reader and Links, desktop | 1440 × 900 | `desktop-reader.png`, `desktop-links.png` |
| Full reader and Links, mobile | 390 × 844 | `mobile-reader.png`, `mobile-links.png` |
| Supporting no-WebGL reader | 1280 × 900 | `reader-no-webgl.png` |

The first review's FIX concerned a transparent reader without WebGL. The root texture now defaults to `none`; the current negative-case record confirms opaque sheet/toolbar and a hidden recovery card while reading. The final reviewer marked this fix resolved and returned **SHIP** at that one-fix scope on 2026-10-22, reopening the affected reader and Links captures. The detector ran once: palette/type advisories remain advisory; its legitimate code-font-role warning is reconciled in `DESIGN.md` without rerunning the detector.

Pre-documentation handoff results: **35 tests PASS; production build PASS; npm audit: 0 vulnerabilities; repository preflight: 249 files, about 16 MB, 0 credential findings.** These are earlier results, not fresh runs or post-documentation inventory counts.

This documentation pass independently checked the two manifests' exact 155-ID coverage, all 155 article SHA-256 digests, 30 rewritten note-link targets, all three media digests, the unavailable-attachment notice, both portable thumbnail provenance digests, and the existing 18/18 verification JSON. It did not run the application, browser, tests, build, dependency installation, audit, or Git publication.

**Final evidence:** [REVIEW.md](REVIEW.md) records the returned one-fix verdict. Source commits and GitHub delivery have their own repository history. Deployment is a separate operation and is not claimed here.
