# Goldfish Annotated Review Report

Date: 2026-11-07

Status: Round 1 completed; awaiting the author's resolution decision. No proposed edits have been applied to the target or application code.

**Target:** `docs/performance/2026-11-07-pagespeed-resolution.md`, full file, verified lines 1-114.

## Result and reviewer completion

The loader-first diagnosis is supported by both reviewers. The target does not yet pass the implementation-readiness standard. Seven Major reviewer findings consolidate into four distinct gaps. There are no reviewer Blocker or Nit findings. A separate parent verification found a portrait-dimension error, recorded below rather than attributed to either reviewer.

| Reviewer | Status | Original findings | Required reading |
| --- | --- | --- | --- |
| `egm-codebase-details` | completed | 3 Major | Persona, full standard, target, AGENTS.md, all 12 supplied source files, both measurement JSON files, and the audit script; read manifest returned. Additional Scene.tsx and report text inspected. |
| `egm-implementation-readiness` | completed | 4 Major | Persona, full standard, target, AGENTS.md, all 12 supplied source files, both measurement JSON files, and the audit script; read manifest returned. Additional package.json and Scene.tsx call sites inspected. |

Both agents ran with `fork_turns: none`, separately, and reported no edits, builds, tests, browser audits, history or memory retrieval, or additional agents. Fresh conversation context does not establish exclusion of host-injected project instructions. Both completed agents were stopped after returning their results.

The supplied standard was the bundled `resources/document_standards/implementation-readiness-standard.md`. Repository constraints came from `AGENTS.md`.

## Prioritized findings and proposed resolutions

### R1: The first repair leaves its core design undecided

- **Stable finding IDs:** `codebase_details-1-1`, `implementation_readiness-1-1`.
- **Severity:** Major for both original findings.
- **Affected scope:** Target lines 48-54, first repair phase.
- **Discrepancy descriptions, copied from reviewers:** "The first repair still requires an architectural choice." / "The first implementation phase still requires design decisions."
- **Rationale:** The proposed separate layer, viewport coverage calculation, transform origin, resize behavior, and reduced-motion outcome are unresolved. These are necessary to implement the initial patch without inventing behavior.
- **Checkable evidence:** `src/components/Loading.tsx:69` places all displayed text inside the expanding `.loading-wrap`. `src/components/styles/Loading.css:44` combines its layout and black background. `/tmp/myportfolio-pagespeed/audit.cjs:13` scales that whole wrapper, so the successful experiment is not a production design for keeping text unscaled.
- **AI suggestion:** PROPOSE FIX.
- **Justification:** The issue is valid. The plan should offer an exact first patch while preserving existing loading timing for a separately measurable change.
- **Proposed edit:** Replace the first repair phase with this explicit boundary and behavior:

  > Phase 1 changes only loader geometry, not readiness or completion timing. Modify `src/components/Loading.tsx` and `src/components/styles/Loading.css`. Insert an `aria-hidden="true"` element with class `.loading-reveal` as the first child of `.loading-screen`. Add `.loading-screen--exiting` to that screen when the existing `clicked` state becomes true. Keep progress and welcome content in `.loading-wrap`, outside the reveal element.
  >
  > Make `.loading-screen` a fixed viewport overlay with `inset: 0`, `width: 100%`, `height: 100%`, `overflow: hidden`, and an isolated stacking context. Center the absolutely positioned circular `.loading-reveal` with `left/top: 50%`, stable width and height of `200vmax`, black background, and `transform-origin: center`. Animate only its transform from `translate(-50%, -50%) scale(0)` to `translate(-50%, -50%) scale(1)` over 800 ms using the current exit curve `cubic-bezier(0.33, 0.11, 1, 0.72)`, without a transition delay. Its diameter exceeds the viewport diagonal; viewport-relative dimensions update on resize without a JavaScript sizing listener.
  >
  > Put the marquee at layer 1, reveal at layer 2, and stable `.loading-wrap` content at layer 3 within the screen. Remove the wrapper's animated minimum dimensions and expanding border-radius changes. Keep its normal pill dimensions; retain existing welcome-content exit behavior. Restrict transitions to explicitly required properties. The reveal covers the marquee while progress/welcome content remains unscaled.
  >
  > Under reduced motion, disable animations and transitions within the loading screen and loading header, including the marquee; switch the reveal to its final state immediately. Keep the provider's completion behavior unchanged in this phase. Do not change `.main-active`, GSAP hero effects, or model startup here. Their timing and reduced-motion behavior belong to the later readiness design.

  This is a proposed implementation choice for author approval, not a claim that it has been coded or visually validated. Confirm full viewport coverage and the intervening animation frames before accepting the patch.

### R2: The replacement readiness contract is undefined

- **Stable finding IDs:** `codebase_details-1-2`, `implementation_readiness-1-2`.
- **Severity:** Major for both original findings.
- **Affected scope:** Target lines 60-66, readiness phase.
- **Discrepancy descriptions, copied from reviewers:** "Readiness replacement omits the existing desktop completion contract and its consumer." / "'Actual readiness' has no defined contract or failure semantics."
- **Rationale:** The plan does not define which assets/content must be ready, deadline and fallback behavior, promise semantics, duplicate completion, late success, rejected imports, or scroll restoration. Changing these without accounting for character startup can desynchronize the introduction.
- **Checkable evidence:** `LoadingProvider.tsx:34` resolves `completeLoading()` when its progress ramp finishes. The five-second desktop fallback already exists at line 91. `src/components/Character/Scene.tsx:108` consumes that promise and then waits 2500 ms before lighting and intro. `Loading.tsx:22` removes the loader through a dynamic-import continuation without a failure path.
- **AI suggestion:** PROPOSE FIX.
- **Justification:** The issue is valid, but those decisions need not delay the isolated geometry repair. They must be an explicit later design task rather than implicit instructions to rewrite readiness now.
- **Proposed edit:** Rename phase 2 to "Deferred readiness design; not authorized for implementation by this plan" and replace its execution instructions with:

  > Preserve `LoadingProvider`, `initialFX`, and the Scene completion consumer during Phase 1. The existing completion promise signals progress reaching 100%, not loader removal; `Scene.tsx` schedules its lights/intro another 2500 ms later. Removing the loader's waits must account for that consumer.
  >
  > Before a timing patch, document and approve required versus optional readiness signals for mobile and desktop, their owning components, completion deadlines, model failure and late success, portrait/font/content failure policy, import/initialization failure handling, idempotent and concurrent promise resolution, cancellation on navigation, and scroll restoration. Decide whether `Scene.tsx` must change and include it in that patch's exact file boundary. No timing or provider rewrite is included in the first patch.

### R3: Later proposals are not executable phases with exact boundaries

- **Stable finding IDs:** `codebase_details-1-3`, `implementation_readiness-1-3`.
- **Severity:** Major for both original findings.
- **Affected scope:** Target lines 72-85 and 90.
- **Discrepancy descriptions, copied from reviewers:** "Later phases lack enforceable file boundaries and predetermined implementation choices." / "Later phases lack an enforceable implementation boundary and decision checkpoints."
- **Rationale:** Asset filenames and responsive sizes, preload conditions, font delivery, heading owner, and the trigger for delaying section media remain open. The target acknowledges these as proposals at line 107; they should not be presented as implementation-ready work.
- **Checkable evidence:** `Landing.tsx:182` supplies a single portrait source, while `src/components/styles/Landing.css` supplies breakpoint-dependent frame sizing and a 140% image width. `src/index.css:1` supplies the font import. Those details constrain any later asset/preload implementation.
- **AI suggestion:** PROPOSE FIX.
- **Justification:** Keep the measured fix actionable and make later investigations produce evidence and a separate exact patch specification.
- **Proposed edit:** Replace the introduction to phases 3-4 with:

  > These are deferred investigations, outside the Phase 1 write boundary. Deliver the actual LCP element and its request/render breakdown; the image audit's resource-level savings; a responsive-image candidate comparison with actual rendered widths, device pixel ratios, sizes, quality, and bytes; the font dependency chain and measured shifts; and exact heading-error elements/files. If icon contention is measured, record the startup requests and why native lazy loading fetched them. Approve a separate Create/Modify/Delete file list and final behavior before implementation. Do not remove routes or dependencies or change font/media loading in Phase 1.

  Add a Phase 1 file boundary: **Modify** `src/components/Loading.tsx`, `src/components/styles/Loading.css`, and the resolution document; **Create** `scripts/audit-loading.mjs` as the narrowly scoped browser verification harness described in R4. No deletion, dependency addition, build/config change, CMS/data-access change, or other application-source edit is included.

### R4: Verification needs observable assertions and phase-specific pass criteria

- **Stable finding ID:** `implementation_readiness-1-4`.
- **Severity:** Major.
- **Affected scope:** Target lines 92-96.
- **Discrepancy description, copied from reviewer:** "Verification enumerates scenarios without specifying the implementation assertions needed for the loader rewrite."
- **Rationale:** Scenario names alone do not define what must happen, by when, or which files verify it. In particular, a future timer/readiness rewrite needs concurrent-completion, unmount, import-failure, and scroll-restoration assertions.
- **Checkable evidence:** `Loading.tsx:13` schedules timers during render; `LoadingProvider.tsx:34` maintains mutable interval completion state; `Loading.tsx:22` has an asynchronous continuation. These are behavior changes requiring targeted verification when rewritten, rather than assertions that mirror CSS declarations.
- **AI suggestion:** PROPOSE FIX.
- **Justification:** Establish useful Phase 1 browser assertions now and explicitly require lifecycle tests in the later timing design. A DOM-only unit test cannot validate CLS or viewport coverage.
- **Proposed edit:** Add the following verification contract:

  > Create `scripts/audit-loading.mjs`, a standalone browser measurement script using the already installed Playwright tooling, accepting a target URL and an output directory without embedding credentials or machine-specific library paths. Install layout-shift observation before navigation; compute maximum-session CLS excluding recent input; record the browser version, viewport, throttling, loader lifecycle, page errors, filmstrip samples, and final overlay absence. Preserve the baseline settings from the diagnostic experiment for comparable runs, and explicitly report missing measurements rather than treating them as passes.
  >
  > Phase 1 passes when three comparable cold mobile runs each have CLS at or below 0.1; the covering layer reaches all viewport corners before removal; final loader absence leaves readable, scrollable content; resize during expansion leaves no uncovered viewport area or new large shift; and no text scales with the reveal. Inspect normal and reduced-motion transitions at 360, 768, 1024, and 1440 px and both available public themes. Reduced motion must show no loader movement. Check 1024/1025 px crossing and desktop model failure against baseline behavior. Observe through the full transition; final screenshots alone are insufficient. Record failures and full metric results. Do not claim Phase 1 meets the LCP target merely because CLS passes.
  >
  > Run `npm run lint`, `npx tsc -b`, `npm test`, and `npm run build`, retaining the repository's required browser/workflow checks. Record baseline failures separately. Repeat comparable deployed Lighthouse runs before claiming production improvement; this remains separate from field p75 validation.
  >
  > A later readiness patch must specify exact test paths and assert one initialization/completion, settled concurrent completion requests, no callbacks after unmount, content and scrolling restored by its approved deadline on timeout/import failure, no late callback hiding visible content, and the approved reduced-motion outcome. Those semantics and tests must be finalized in its own design before execution.

  Remove any suggestion that this plan waives `AGENTS.md` verification requirements. Scope the new harness to the loader, but preserve the repository's broader required checks for implementation signoff.

## Additional parent verification: portrait metadata correction

- **ID:** `elephant-1-1` (parent verification, not a Goldfish finding).
- **Affected scope:** Target line 74.
- **Issue:** The target says the local portrait is 1200 x 1659 pixels. Reading the actual WebP metadata with Pillow showed **1760 x 2432**, **378,668 bytes**. The 1200 x 1659 numbers are the HTML intrinsic attributes in `Landing.tsx`, not the file's actual resolution. The approximately 370 KiB size statement remains accurate.
- **AI suggestion:** PROPOSE FIX.
- **Proposed exact replacement:** "The local portrait is already WebP, 1760 x 2432 pixels, 378,668 bytes (approximately 370 KiB); its HTML width/height attributes are 1200 x 1659. Conversion to WebP alone is not a fix. Determine responsive variants from the actual rendered image width and device pixel ratio after confirming the LCP resource."
- **Verification command used:** Bundled Python/Pillow opened `public/images/abishek-priyan-profile.webp` and read `Image.size`; file size came from `Path.stat().st_size`.

## Resolution accounting

- Completed reviewers: 2 of 2. Failed or not-run reviewers: 0.
- Original findings: 7 Major, consolidated into 4 distinct gaps without changing their severity.
- Parent addendum: 1 verified factual correction.
- Categories: PROPOSE FIX for all four consolidated gaps and the parent correction; no CONTEST, ESCALATE, or DECLINE items.
- Applied fixes: 0. Application changes: 0.
- Clean rounds: 0. Round 1 is not clean and the review has not converged.
- Proposed scope on acceptance: amend the resolution document only. This report does not authorize application implementation or automatically launch another review round.

## Author decision

Reply **auto accept** to apply the proposed document revisions, **no changes** to retain the target as written, or **interactive breakdown** to discuss each item. Comments or custom instructions may approve or reject individual edits. Another fresh review round requires an explicit request after resolution.
