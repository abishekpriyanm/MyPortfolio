# Portfolio PageSpeed diagnosis and proposed resolution

Date: 2026-11-07

Status: Diagnosis completed; proposed changes have not been implemented. EGM independent review is pending configuration confirmation.

Local source inspected: commit `1589193`, initially clean working tree. Live site measured: https://www.abishekpriyan.dev/.

## What the supplied report establishes

Source: `/Users/abishekpriyanm/Documents/PageSpeed Insights.pdf`, pages 1-4. Mobile run captured November 7, 2026 at 11:21 PM IST, Lighthouse 13.6.0, emulated Moto G Power, Slow 4G.

| Measurement | Supplied result | Implication |
| --- | --- | --- |
| Performance | 47 | Investigate the measured failures rather than every diagnostic warning. |
| First Contentful Paint | 1.9 seconds | Initial paint can improve, but it is not the largest failure. |
| Largest Contentful Paint | 5.0 seconds | Main content is late. |
| Total Blocking Time | 20 ms | Main-thread blocking is a lower priority in this particular mobile run. This does not establish good real-user INP or desktop performance. |
| Cumulative Layout Shift | 2.386 | Severe instability during initial loading. |
| Speed Index | 8.3 seconds | The visible page takes too long to settle. |
| Accessibility / Best Practices / SEO | 98 / 100 / 100 | Preserve these while fixing loading. |

The report contains no real-user field data. Its collapsed insights list 266 KiB estimated image savings, 190 ms render-blocking savings, and 65 KiB unused JavaScript savings. They do not identify the individual affected resources in this PDF. These savings are estimates, not measurements of an implemented fix.

## Confirmed primary cause: loader geometry animation

`src/components/styles/Loading.css:44` sets an unrestricted transition on `.loading-wrap`. Its `.loading-clicked` state changes `min-width` to `calc(100vw + 5000px)` and `min-height` to `calc(100vh + 500px)`. The loader repeatedly changes layout while its black shape expands.

A read-only browser experiment against the live site reproduced this failure. A second visit injected a temporary CSS override that kept the minimum dimensions unchanged, restricted the wrapper transition to transform/opacity, and scaled the shape instead. Neither visit changed the deployed site or repository application files.

| Browser experiment | CLS | Loader removed at | JavaScript page errors |
| --- | --- | --- | --- |
| Existing live CSS | 2.463800 | 5.384 seconds | 0 |
| Temporary transform override | 0.000887 | 4.897 seconds | 0 |

Method: installed Google Chrome, headless, new mobile browser context per run, 412 x 823 CSS pixels, device scale factor 1.75, touch/mobile enabled, browser cache disabled, 150 ms network latency, 200,000 bytes/s download, 90,000 bytes/s upload, 4x CPU slowdown, and 14 seconds observation after DOMContentLoaded. CLS is the maximum layout-shift session window, excluding entries with recent input. The experiment uses browser network throttling; it is not equivalent to Lighthouse's simulated test environment. Browser/runtime and network timing can differ between visits.

In the baseline, layout-shift entries naming `.loading-wrap.loading-clicked` totaled approximately 2.402. Individual entries can name several affected elements, so source attribution totals must not be added together as independent contributions. This identifies the loader as the dominant culprit; it does not prove that every smaller shift has the same cause.

No canvas was mounted in either mobile visit. `src/components/MainContainer.tsx` gates character rendering to widths above 1024 px. The mobile result does not justify removing the character or its dependencies. The network did include a small chunk named `react-three`; no-canvas is not a claim that every related byte is absent.

Temporary evidence is saved under `/tmp/myportfolio-pagespeed/`: `audit.cjs`, `live-audit.json`, `transform-audit.json`, `live-mobile.png`, and `transform-mobile.png`. This folder is scratch space and may be removed by the operating system.

## Fix order

### 1. Repair the loader's layout shifts

Modify `src/components/styles/Loading.css` and, if a separate expanding background layer is needed, `src/components/Loading.tsx`.

- Keep the existing loading screen and provider. Give the expanding background stable layout dimensions and animate its transform. Keep text and controls in a separate, unscaled layer so their size remains legible.
- Remove animated `min-width` and `min-height` changes and replace the unrestricted transition with explicitly named properties.
- Size the covering shape for the actual viewport. The experiment's hardcoded scale of 40 demonstrates the cause; it is not a production sizing rule for all screen sizes.
- Ensure remaining progress/button effects do not move other elements. Respect reduced motion with an immediate or short fade.
- Check the whole transition visually: a final screenshot alone cannot establish visual equivalence.

Expected outcome: a substantial CLS reduction. No particular production score is promised.

### 2. Remove avoidable waiting before revealing content

Modify `src/components/Loading.tsx`, `src/context/LoadingProvider.tsx`, `src/components/utils/initialFX.ts`, and the relevant reveal rules in `src/index.css`.

- `Loading.tsx:13` schedules timers during render. Once progress reaches 100%, the sequence waits 600 ms, another 1000 ms, then another 900 ms before calling `initialFX()` and removing the loader. That is 2.5 seconds of scheduled waits after completion, before accounting for scheduling delays or subsequent fades.
- Move transition scheduling into an effect with cancellation and a single completion path. Avoid duplicate scheduled callbacks on re-render and state updates after unmount.
- Replace random progress as a content-readiness gate with actual readiness and a bounded failure path. Preserve desktop character startup and allow readable content when model loading fails.
- Reveal the useful hero as soon as required content is ready. Preserve the intended visual design without forcing the user to wait for a decorative sequence to finish.
- `initialFX()` adds `.main-active`; that class resets main opacity to zero and starts a one-second fade. Avoid hiding already visible content again during startup. Keep nonessential motion from determining when the primary content becomes visible.

Expected outcome: earlier useful content and better visual completion. The browser experiment changed CSS only and therefore does not validate this phase's LCP improvement. The experiment's observed LCP candidates were loader text; use a fresh Lighthouse trace and its LCP breakdown to validate the final hero rather than treating those candidates as a replacement for the report's 5.0-second LCP.

### 3. Improve portrait delivery and font discovery

Potential modifications: `src/components/Landing.tsx`, `index.html`, `src/index.css`, plus generated portrait variants under `public/images/`. Confirm the LCP resource before choosing exact variants and preloads.

- The local portrait is already WebP, 1200 x 1659 pixels, approximately 370 KiB. Conversion to WebP alone is not a fix. Generate smaller, visually checked responsive alternatives and use `srcSet`/`sizes` that account for the image's actual CSS width, crop, and device pixel ratio.
- Keep explicit intrinsic dimensions and eager loading. If confirmed as the LCP image, give it high fetch priority and consider a matching responsive preload restricted to the portrait's mobile/tablet breakpoint, so desktop character views do not download an unused priority image.
- Do not equate the report's 266 KiB image estimate with this portrait: the PDF omits the resource breakdown.
- Public CSS currently loads Geist through a Google Fonts CSS `@import`. Inspect the request chain before changing it. If replacing it with self-hosted font assets, preserve the public typography, include only required subsets/weights, choose appropriate fallback metrics, and verify the resulting font-related shifts. The existing admin font package is not a reason to import admin CSS into the public entry.

The 190 ms render-blocking estimate makes this a smaller initial opportunity than the loader. Do not add numerous speculative preloads that compete with the hero.

### 4. Reassess lower-priority findings

- Re-run coverage and the network audit after the first three phases before acting on 65 KiB unused JavaScript. Do not remove routes or libraries solely because they are unused during a homepage snapshot.
- The mobile visit requested numerous technology icons during startup. `TechStackNew.tsx` already uses lazy loading and explicit icon dimensions, so adding those attributes again is not a solution. If bandwidth contention persists, investigate why the browser considers those images close enough to fetch and consider delaying that section's media until it approaches the viewport.
- Fix the reported heading-order issue while preserving visible styling; do not confuse heading rank with font size.
- The experimental Agentic Browsing warnings are separate work. Addressing them is not a substitute for fixing the measured CLS/LCP failures.

## Verification and rollback

Make the loader geometry repair an isolated change first. Measure it before changing timing, images, fonts, or bundles, so gains and regressions remain attributable. Each later phase should also be independently reversible through its own commit or patch. Preserve unrelated work and the MIT license; do not push to upstream.

For application implementation, run lint, TypeScript checks, tests, and the complete production build. Record existing failures separately. Test at 360, 768, 1024, and 1440 px, both themes, reduced motion, keyboard navigation, visible focus, Escape behavior, resize across the character breakpoint, failed/slow asset loads, and navigation away during loading. Confirm the desktop character, `/play`, and content workflows remain usable. If a proposed fix expands into CMS or data access behavior, first apply the additional admin/Supabase instructions and verification; the initial loader repair does not require such changes.

Run at least three comparable cold-cache mobile Lighthouse measurements before and after and report the median and range, with the same device, throttling, browser version, URL, and build. Inspect layout-shift sources, LCP element/subparts, the filmstrip, and initial network requests. Repeat on the deployed build before claiming a production result.

Targets are CLS at or below 0.1 and LCP at or below 2.5 seconds. Production p75 success requires real-user measurements; passing laboratory runs does not establish it. The supplied report currently has no field data.

No lint/test/build run was required for this documentation-only diagnosis; application code was not changed. No deployed fix or 90+ PageSpeed result has been verified.

## Proposed EGM review configuration

- TargetFile: `docs/performance/2026-11-07-pagespeed-resolution.md`.
- SemanticTarget: full file; resolve current line bounds immediately before dispatch.
- Reviewers: `codebase_details` and `implementation_readiness`, each in a fresh conversation context with read-only instructions.
- Standards: both reviewers use the bundled `resources/document_standards/implementation-readiness-standard.md`, with the project `AGENTS.md` as the repository constraint source.
- GoldfishContext: `AGENTS.md`, `src/components/styles/Loading.css`, `src/components/Loading.tsx`, `src/context/LoadingProvider.tsx`, `src/components/utils/initialFX.ts`, `src/index.css`, `src/components/MainContainer.tsx`, `src/components/Landing.tsx`, `src/components/styles/Landing.css`, `src/components/TechStackNew.tsx`, `src/App.tsx`, `vite.config.ts`, `index.html`, and the temporary measurement JSON files listed above. Resolve all paths to absolute paths for dispatch. No parent conversation or memory is provided.
- Review objective: challenge attribution and proposed fix order, identify missing implementation decisions, and prevent unsupported performance claims. Later phases remain proposals rather than a finalized implementation specification.
- Review status: not run. The EGM review-loop skill requires confirmation of target/reviewer/standard configuration before dispatch.

## External technical references

- [Google: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls) describes layout stability, measurement, and common causes.
- [Google: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp) describes resource discovery, render delay, and the distinction between laboratory and real-user data.
- [Chrome: Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) explains why diagnostic savings do not directly translate into score points. Its published weight tables are version-labelled; do not assume an older table is an exact specification for the report's Lighthouse version.
