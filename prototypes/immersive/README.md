# NOVA Bots — immersive scroll prototype

## Stage 02 / full page

The local preview now includes all four lower-page sections: editorial process with a scroll-driven rail; one native disclosure-based brief interface; typographic FAQ; and a large final CTA with the real NOVA mark and MAX / Telegram / VK links.

Content comes directly from the v1 section generators in `src/components.mjs`. Only the requested invitation to discuss development and a preliminary estimate is new copy. No new libraries, decorative 3D scenes or forms were added.

`sections.mjs`, `full-page.css` and `full-page.js` are isolated from the approved experience. The entire hero/header HTML and its scene, CSS and scroll controller are verified against `89c2224`. Production files, metadata/JSON-LD, contact destinations and deployment rules remain unchanged.

Run `node prototypes/immersive/qa-full-page.cjs` for the full-page checks, or add `--integrity-only` to check the protected first screen and technical configuration. Checks passed at 1440×900, 1366×768, 390×844, 430×932, 320×740 and 768×1024. Brief/FAQ mouse and keyboard interaction, rapid toggles, reduced motion including changes during animation, no-JS disclosures, process progress, six-scene geometry, swipe, UTM and local analytics stubs are covered.

Review gallery: http://127.0.0.1:4196/review/full-page/gallery.html . `review/full-page/` contains all eight real desktop/mobile section screenshots and `qa.json`. Screenshots use 1440px/390px widths and a 1200px capture viewport to fit each complete section; functional responsive tests use the standard sizes above. These are browser-emulated mobile checks, not physical-device certification.

Local only, branch `design/nova-immersive`. Production source files, `dist`, `main` and publishing scripts are unchanged. Earlier experiments are preserved in `design/nova-v2` at `ba5c220`.

```powershell
node prototypes/immersive/build.mjs
node prototypes/immersive/serve.mjs
```

Preview: http://127.0.0.1:4196/

## Interaction

- Desktop with motion enabled: a two-viewport document section contains one sticky viewport. Native scroll progress controls the retreat of the NOVA mesh, the headline exit and the MAX/employee interface entrance. Reverse scrolling reverses the transition. No wheel/touch interception, snapping, mandatory delay or recurring scene loop.
- “Посмотреть в работе” and the six scenario links use native smooth scrolling to the completed demonstration. “Наверх” returns to the hero. Internal navigation retains the query string and incoming UTM.
- At widths up to 1000px, short viewports, reduced motion or manual motion pause: hero and demonstration remain ordinary consecutive HTML sections. Mobile uses one cached canvas image, not animated 3D.
- All six v1 scenario records and full MAX/employee markup are reused. The final CTA appears only in scenario six. Arrow buttons, 01–06 selectors, keyboard arrows/Home/End and horizontal swipe remain available. Vertical touch scroll is native.

## Rendering and fallback

`scene.js` generates original folded-ribbon geometry. Desktop uses native WebGL. The vertex/fragment uniform precision mismatch was fixed and WebGL startup is tested. No library or external model dependency is needed.

When WebGL is unavailable or lost, the same interaction uses a Canvas 2D poster captured from this exact WebGL geometry/material, with the original composited CSS transforms. Mobile loads a 24 KB transparent WebP; desktop fallback loads 49 KB. The original projection is reconstructed from the saved frame/crop coordinates at any aspect ratio. No CPU mesh shading occurs on mobile or scroll. SVG remains visible until the poster is decoded, and stays if it cannot load or both contexts are unavailable. Renderers stop when idle or the document is hidden. DPR is capped at 1.5 for WebGL and 1.25 for the poster.

Diagnostic URLs, for QA only:

- `/?renderer=canvas` — force cached Canvas fallback.
- `/?renderer=svg` — force SVG fallback.
- Browser `prefers-reduced-motion: reduce` — sequential layout with no moving scene.

## Files and verification

- `build.mjs`: generates this prototype only, reusing production metadata/JSON-LD and scenario data; adds `noindex` for the local prototype.
- `scroll.js` / `scroll.css`: current scroll entry point. `immersive.js` is the earlier click-to-enter interaction, preserved but not loaded.
- `qa.cjs`: regression, renderer and local performance checks using an existing Playwright installation. `NOVA_PLAYWRIGHT_PATH` and `CHROME_PATH` can override the local runtime paths. Build/preview require no new dependencies.
- `review/qa.json`: measured results, viewport checks and fallback outcomes. These are local Chromium measurements and emulated mobile viewports, not field Core Web Vitals or a physical-phone test.
- `record.cjs`: captures actual Chromium frames during wheel scrolling, scenario switching and return navigation, then encodes WebM using browser MediaRecorder. No desktop capture permission or external upload. Capture cadence is not a performance/FPS benchmark.
- `review/scroll-transition.webm`: short interaction recording.

Earlier scroll-stage checks: seven viewport sizes, all six scenarios, reverse/native wheel scrolling, CTA/UTM, keyboard and swipe, forced Canvas/SVG fallbacks, actual WebGL context loss and Canvas recovery, reduced motion and no-JS sequential content passed. Historical CLS was 0–0.000064 and local LCP was 168–396 ms. See the material-pass measurements below for the current renderer; localhost results are not a production-speed claim.

## Reference research

Observed at [Unseen Studio](https://unseen.co/) on desktop and an emulated 390×844 mobile viewport: a persistent spatial scene, camera/material response, typography layered over the scene, a transition into project content, and ordinary navigation alongside exploratory interaction. NOVA adapts the continuity of the experience; it does not use Unseen's code, objects, artwork, copy or identity.

Our accessibility differences are deliberate: readable HTML outside the canvas, unrestricted zoom, no required drag/hold/sound, native vertical scroll, visible focus, motion control and a sequential reduced-motion path. The main remaining review is artistic approval and testing on physical mobile hardware before any production decision.

## Visual refinement

The approved hero, 3D geometry, scroll transition and showcase are untouched. Lower-page styling stays scoped to `.full-page`: consistent medium-weight headings and tracking, quieter shared dividers and microtype, more readable process descriptions, lighter brief material, inset keyboard focus and restrained contact hover states. Chapter spacing is tightened on desktop; the section order and all copy are unchanged.

The final CTA uses the N and star from the original `public/assets/nova-logo.png`. An inline SVG luminance mask and two bounding crops remove the icon tile and arc. No replacement contours are drawn; the public logo asset and production icons remain untouched. This static mask is not animated.

`capture-refinement.cjs` checks the entire generated document against `400761e`, allowing only that decorative mark replacement, verifies keyboard focus and produces twelve real Chromium screenshots. The gallery is at `/review/refinement/gallery.html`. Hero/showcase captures use 1440×900 and 390×844; whole lower sections use the same widths with a 1200px capture height.

`review/refinement/qa.json` records the six-viewport interaction regression, stable six-scenario geometry, UTM/contact checks, metadata/JSON-LD preservation, reduced motion and no-JS checks. `visual-qa.json` records capture/focus/content checks. Mobile results are browser emulation, not physical-device testing. No dependencies were added and nothing was published.

## Cold polished chrome

Only sculpture material/fallback changed. The regular surface pattern came from an explicit 48-groove UV shader, a mediump fragment-coordinate hash and fallback machining lines. They are removed. The existing 6,501 vertices / 12,544 triangles, smooth unit normals, index winding, cursor transform and scroll transform remain intact; the before/after rendered silhouette comparison has IoU 1. All typography, section styles, carousel, copy and production source remain unchanged.

`chrome-studio.js` defines original cold studio illumination, baked once into a 128px RGBM cubemap. The metal shader uses one environment lookup, conductor Fresnel and tone mapping. No reflection render pass, bloom, downloaded HDR, library or ongoing environment computation. High precision is used when supported, with a matched mediump shader fallback.

`bake-chrome-posters.cjs` captures the real shader/mesh into `materials/` for mobile and context loss; rerun it after material changes. `qa-chrome.cjs` rejects stale posters by source hash, validates normals/indices, protects all other page content, measures local before/after rendering, and tests blocked WebGL, blocked Canvas, image failure, real context loss, Retina and reduced motion. Context loss no longer mistakes inherited canvas dimensions/draw counters for a valid cached image.

Review: `/review/chrome/gallery.html`, three desktop states plus mobile/fallback captures. `material-qa.json` contains the detailed local measurements; `regression/qa.json` contains the seven-viewport scenario/scroll regression. In the comparative local run, pointer-frame p95 was 16.8 ms, cubemap preparation 31 ms once, mobile poster submission 1.2 ms, no mobile long task over 50 ms, and idle draw counts stopped. Submission timing is not GPU timing; these are headless Chromium diagnostics, not physical-device or field-performance claims. No dependency, publishing or production changes.
