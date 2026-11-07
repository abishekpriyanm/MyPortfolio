# MyPortfolio Admin CMS Implementation Plan

**Date:** 2026-09-10

**Design:** `docs/superpowers/specs/2026-09-10-portfolio-admin-cms-design.md`

**Status:** Ready for implementation after user review

## Outcome

Deliver a single-administrator CMS for the existing portfolio using Supabase directly. The administrator can edit About content, career entries, projects, case studies, project images, and one active resume; preview a working draft; publish or roll back atomically; and keep the public site useful during a temporary data outage. The public production p75 LCP target is below 2.0 seconds.

## Execution constraints

- Preserve the current dirty working tree. Inspect `git status --short` before and after every task and stage only files intentionally changed for that task.
- Read `AGENTS.md`, `DESIGN.md`, the public redesign specification, and the admin CMS specification before implementation.
- Use the `supabase` skill for every database, Auth, Storage, migration, RPC, or policy change.
- Use the `vercel:shadcn` skill for shadcn initialization and admin UI work.
- Do not add Prisma, a content backend, a service-role key, public signup, or multi-admin abstractions.
- Do not apply Tailwind preflight or admin theme variables to the existing public entry point.
- Use tests before or alongside each behavior change. Do not postpone RLS or browser verification until the end.
- Work locally until the user explicitly supplies or authorizes access to a remote Supabase project and production Vercel environment.

## Target structure

```text
admin.html
src/
  admin/
    main.tsx
    AdminApp.tsx
    styles/admin.css
    auth/
    layout/
    pages/
    features/
      overview/
      about/
      career/
      projects/
      media/
      resume/
      publishing/
    components/ui/
  features/
    portfolio-content/
      schema.ts
      types.ts
      fallback.ts
      cache.ts
      repository.ts
      supabaseRepository.ts
      PortfolioProvider.tsx
  lib/
    supabase/
      client.ts
      database.types.ts
      environment.ts
  pages/
    ProjectCaseStudy.tsx
    Resume.tsx
    DraftPreview.tsx
supabase/
  config.toml
  migrations/<generated>_portfolio_cms_foundation.sql
  seed.sql
  tests/database/portfolio_cms.test.sql
api/cron/supabase-keepalive.js
tests/e2e/
```

The exact migration filename must be created by the Supabase CLI; do not invent a timestamp manually.

## Task 0: Protect the baseline

**Inspect:**

- `git status --short`
- `package.json`
- `vite.config.ts`
- `vercel.json`
- `src/config.ts`
- `src/App.tsx`
- `src/components/MainContainer.tsx`
- `src/components/About.tsx`
- `src/components/Career.tsx`
- `src/components/Work.tsx`
- `src/pages/MyWorks.tsx`

**Steps:**

1. Record the current modified, deleted, and untracked files. Treat them as user-owned.
2. Run the existing checks before installing anything:

   ```bash
   npm run lint
   npm run build
   ```

3. Record actual failures without reverting generated or user-edited files.
4. Confirm the current public site in a browser at desktop and mobile widths so later regressions are distinguishable from existing behavior.

**Exit:** Baseline status, lint/build results, and visual state are recorded; no source file has been changed.

## Task 1: Add the content contract and test harness

**Create:**

- `vitest.config.ts`
- `src/test/setup.ts`
- `src/features/portfolio-content/schema.ts`
- `src/features/portfolio-content/types.ts`
- `src/features/portfolio-content/fallback.ts`
- `src/features/portfolio-content/schema.test.ts`

**Modify:**

- `package.json`
- `package-lock.json`
- `eslint.config.js`

**Steps:**

1. Add pinned runtime dependencies for `@supabase/supabase-js` and `zod`.
2. Add pinned development dependencies for Vitest, jsdom, React Testing Library, user-event, Playwright, and Node type definitions.
3. Add scripts for `test`, `test:watch`, `test:e2e`, and `test:db` without changing the existing `dev`, `lint`, `build`, or `preview` behavior.
4. Give browser source, Node-based Vercel functions, configuration files, and test files the correct ESLint globals instead of applying browser globals everywhere.
5. Define a versioned `PortfolioSnapshotSchema` containing:
   - `schemaVersion`
   - About identity, biography, roles, location, contact, and social links
   - Ordered career entries
   - Ordered project summaries and full case-study fields
   - Stable project IDs and unique slugs
   - Cover and gallery asset references
   - Link and client-side metadata fields
6. Accept plain text and structured lists only. Do not accept arbitrary HTML from the CMS.
7. Validate URLs, slugs, required alt text, gallery ordering, and reasonable field lengths.
8. Convert the current supported content in `src/config.ts` into a valid fallback snapshot without inventing missing evidence or links.
9. Test valid parsing, malformed payload rejection, duplicate slugs, unsafe URLs, missing alt text, and forward schema-version rejection.

**Verify:**

```bash
npm test -- src/features/portfolio-content/schema.test.ts
npm run lint
npm run build
```

**Exit:** The site has one shared, tested content contract and a repository-grounded fallback snapshot.

## Task 2: Initialize local Supabase and create the schema

**Create:**

- `supabase/config.toml`
- CLI-generated `supabase/migrations/<timestamp>_portfolio_cms_foundation.sql`
- `supabase/seed.sql`
- `supabase/tests/database/portfolio_cms.test.sql`

**Steps:**

1. Inspect CLI commands instead of guessing:

   ```bash
   supabase --version
   supabase --help
   supabase migration --help
   supabase test --help
   ```

2. Initialize local Supabase if `supabase/config.toml` does not exist.
3. Create the migration with `supabase migration new portfolio_cms_foundation`.
4. Add constrained state types and these tables:
   - `portfolio_admins`: singleton boolean primary key, unique Auth user ID, creation timestamp
   - `portfolio_versions`: identity/version, state, content JSONB, creator, timestamps
   - `media_assets`: immutable path, kind, MIME, bytes, dimensions, alt text, caption, published flag, creator, timestamp
   - `resume_versions`: identity/version, immutable PDF path, source name, MIME, bytes, checksum, active flag, creator, timestamps
5. Add partial unique indexes allowing at most one draft portfolio, one published portfolio, and one active resume.
6. Add indexes for public state lookup, project media publication lookup, and resume activation lookup.
7. Create private Storage buckets for project media and resumes with explicit MIME and byte limits.
8. Explicitly grant only the Data API privileges required by `anon` and `authenticated`; do not assume newly created tables are automatically exposed.
9. Enable RLS on every table and `storage.objects` path used by the application.
10. Add policies:
    - `anon`: select the published portfolio, published media metadata, and active resume metadata only
    - allowlisted admin with an `aal2` session: select all CMS records and perform allowed writes
    - other authenticated users: no draft, archive, upload, or mutation access
    - Storage reads: published project assets or active resume only for anonymous callers; all owned CMS assets for the allowlisted admin
11. Add transactional functions:
    - `publish_portfolio(draft_id, expected_updated_at)`
    - `rollback_portfolio(version_id)`
    - `activate_resume(resume_id)`
12. Make repeated successful calls safe. Reject stale draft timestamps, invalid states, non-admin callers, and attempts that would leave two active rows.
13. During portfolio publication, derive active asset IDs from the validated snapshot and update `media_assets.is_published` in the same transaction.
14. Revoke default function execution from `PUBLIC`; grant only the minimum required role.
15. Seed a local Auth user, the one-row admin allowlist, the first published snapshot, and a working draft copied from it.

**Database tests:**

- Anonymous caller can read exactly one published portfolio and no draft.
- Authorized administrator can read and update the draft.
- A different authenticated user cannot insert a self-owned draft or media row.
- Publish archives the previous version, promotes the draft, and creates the next draft.
- A stale publish fails without changing the current public version.
- Rollback is transactional and replay-safe.
- Exactly one resume becomes active; previous files remain recorded.
- Storage rejects wrong MIME types, oversized files, unauthorized uploads, draft reads, and archived-resume reads.

**Verify:**

```bash
supabase start
supabase db reset
supabase test db
supabase migration list --local
```

Run the Supabase security and performance advisors when the installed CLI supports them. If the command is unavailable, use the current documented MCP or dashboard equivalent during remote verification.

**Exit:** A clean local reset reproduces the schema, seeds, RLS, Storage rules, and passing database tests.

## Task 3: Build the Supabase and repository modules

**Create:**

- `src/lib/supabase/environment.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/database.types.ts`
- `src/features/portfolio-content/repository.ts`
- `src/features/portfolio-content/supabaseRepository.ts`
- `src/features/portfolio-content/cache.ts`
- matching unit tests

**Steps:**

1. Validate `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` once at startup.
2. Export one browser Supabase client. Never accept or reference a service-role key.
3. Define a small repository interface:
   - `getPublished()`
   - `getDraft()`
   - `saveDraft(content, expectedUpdatedAt)`
   - `publish(draftId, expectedUpdatedAt)`
   - `listHistory()`
   - `rollback(versionId)`
4. Keep query details, generated database types, validation, and error translation inside the Supabase adapter.
5. Implement a versioned local cache that stores only the last schema-valid published snapshot.
6. Prevent an older response from overwriting a newer cached version.
7. Return typed error results for unavailable service, unauthorized caller, validation failure, stale edit, and unexpected failure.
8. When public Supabase configuration is absent, render the build-time fallback; when admin configuration is absent, show a blocking configuration error.

**Verify:**

```bash
npm test -- src/features/portfolio-content
npm run lint
npm run build
```

**Exit:** Public and admin callers use one tested content interface without knowing Supabase query details.

## Task 4: Create an isolated shadcn admin entry

**Create:**

- `admin.html`
- `components.json`
- `src/admin/main.tsx`
- `src/admin/AdminApp.tsx`
- `src/admin/styles/admin.css`
- `src/admin/components/ui/*` generated source
- `src/lib/utils.ts`

**Modify:**

- `vite.config.ts`
- `tsconfig.app.json`
- `package.json`
- `package-lock.json`
- `vercel.json`

**Steps:**

1. Run the non-interactive shadcn initializer using the Vite-compatible Radix base. Review every generated change before retaining it:

   ```bash
   npx shadcn@latest init -d --base radix
   ```

2. Configure `new-york` style, TypeScript, CSS variables, and aliases targeting `src/admin/components/ui`.
3. Add only the approved components:

   ```bash
   npx shadcn@latest add button input textarea form card table tabs badge dialog alert-dialog sheet dropdown-menu tooltip skeleton alert select sonner
   ```

4. Use a separate `admin.html` and `src/admin/main.tsx` entry. Import Tailwind and admin tokens only from the admin entry.
5. Restore any initializer changes that inject Tailwind preflight or admin variables into the public `src/index.css`.
6. Map `DESIGN.md` tokens to semantic shadcn variables. Use the near-black canvas, charcoal surface ladder, hairlines, restrained lavender accent, 8–12 px controls/cards, and accessible focus rings.
7. Use Inter or Geist as a legal cross-platform replacement for proprietary Linear fonts.
8. Configure Vite multi-page inputs for `index.html` and `admin.html`.
9. Add Vercel rewrites for `/admin` and `/admin/(.*)` to `admin.html` before the public SPA fallback.
10. Verify that admin CSS is absent from the public entry chunk and that public styles are unchanged after visiting or directly loading `/`.

**Verify:**

```bash
npm run lint
npm run build
```

Run browser smoke checks on `/`, `/admin`, and a deep admin URL after a clean reload.

**Exit:** The admin has an isolated, accessible shadcn shell and cannot visually or materially inflate the public entry point.

## Task 5: Implement single-admin authentication

**Create:**

- `src/admin/auth/AuthProvider.tsx`
- `src/admin/auth/RequireAdmin.tsx`
- `src/admin/auth/authRepository.ts`
- `src/admin/pages/LoginPage.tsx`
- `src/admin/pages/MfaPage.tsx`
- tests for session and authorization states

**Steps:**

1. Implement email/password sign-in, session restoration, sign-out, TOTP enrollment, challenge, and verification using current Supabase Auth documentation.
2. After authentication, verify the user's immutable ID exists in `portfolio_admins` before rendering any admin route.
3. Require an `aal2` session before requesting drafts or performing any privileged database or Storage operation; keep the same requirement in RLS and Storage policies.
4. Immediately sign out or deny access to authenticated but non-allowlisted users.
5. Represent loading, invalid credentials, unverified MFA, expired session, network failure, and unauthorized account as distinct states.
6. Return the user to the intended admin URL after successful authentication.
7. Configure public signup as disabled in local and remote Supabase Auth settings. Create the production admin account manually; never ship a signup screen.

**Verify:**

- Unit-test session state transitions.
- Browser-test login, refresh, MFA, logout, expired session, bad password, and wrong-user denial.
- Re-run the database tests to prove the UI guard is not the only protection.

**Exit:** Only the allowlisted, MFA-verified administrator reaches the CMS.

## Task 6: Build the admin shell and draft state

**Create:**

- `src/admin/layout/AdminLayout.tsx`
- `src/admin/layout/AdminNavigation.tsx`
- `src/admin/features/publishing/DraftProvider.tsx`
- `src/admin/features/publishing/useUnsavedChanges.ts`
- `src/admin/features/overview/OverviewPage.tsx`
- matching tests

**Steps:**

1. Build desktop sidebar and mobile Sheet navigation for Overview, About, Career, Projects, Resume, Preview, and Logout.
2. Load the complete draft once into a provider and expose focused section update methods rather than raw JSON mutations.
3. Track clean, dirty, saving, saved, stale, and failed states.
4. Save with `expectedUpdatedAt`; show a conflict when another tab has changed the draft.
5. Warn before browser navigation, route navigation, or logout with unsaved edits.
6. Calculate completeness warnings without blocking valid partial drafts from being saved.
7. Reserve blocking validation for publication.

**Exit:** The admin has a stable editing session, honest state feedback, and stale-write protection.

## Task 7: Implement About and career editors

**Create:**

- `src/admin/features/about/AboutEditorPage.tsx`
- `src/admin/features/career/CareerEditorPage.tsx`
- `src/admin/features/career/CareerEntryForm.tsx`
- editor tests

**Steps:**

1. Map every supported About field to labeled inputs with inline validation and character guidance.
2. Keep biographies as plain text with preserved paragraphs; do not add a rich-text HTML editor.
3. Build career add, edit, hide, delete, and reorder flows.
4. Require a stable ID, period, role, organization, summary, and explicit visibility for each career entry.
5. Provide pointer reordering plus keyboard-visible Move up/Move down actions.
6. Use `AlertDialog` for destructive removal and preserve focus after completion.
7. Test successful edits, invalid fields, cancellation, ordering, keyboard controls, and unsaved-change warnings.

**Exit:** About and career content can move from the seeded draft through a validated saved draft without affecting public data.

## Task 8: Implement project and case-study editing

**Create:**

- `src/admin/features/projects/ProjectsPage.tsx`
- `src/admin/features/projects/ProjectEditorPage.tsx`
- `src/admin/features/projects/ProjectBasicsForm.tsx`
- `src/admin/features/projects/CaseStudyForm.tsx`
- `src/admin/features/projects/ProjectLinksForm.tsx`
- project tests

**Steps:**

1. Build project creation, editing, duplication, hiding, deletion, featured state, and ordering.
2. Generate a slug from the title once, allow deliberate edits, and reject duplicates.
3. Capture category, summary, technology list, problem, constraints, system built, personal role, engineering decisions, verified outcome, current status, and known limitations.
4. Validate repository, live product, and evidence links. Never fabricate a missing link or outcome.
5. Show completeness warnings for case-study sections and block publication only when required public fields are invalid.
6. Reuse accessible reorder and destructive-confirmation patterns from the career editor.
7. Test slugs, duplicates, link validation, ordering, visibility, incomplete drafts, and complete publishable projects.

**Exit:** A project can be authored once and drive both its homepage summary and dedicated case study.

## Task 9: Implement project media

**Create:**

- `src/admin/features/media/imageProcessor.ts`
- `src/admin/features/media/mediaRepository.ts`
- `src/admin/features/media/ImageUploader.tsx`
- `src/admin/features/media/GalleryEditor.tsx`
- media tests and small image fixtures

**Steps:**

1. Accept JPEG, PNG, and WebP source images within the configured source byte limit.
2. Use browser image APIs to create bounded WebP variants for card, case-study, and large-display use. Do not add a heavyweight image editor.
3. Require useful alt text before an asset can be referenced by publishable content.
4. Upload variants to immutable UUID-based paths, then insert `media_assets` metadata.
5. If metadata insertion fails, attempt scoped cleanup of only the newly uploaded paths and report any orphan clearly.
6. Generate batched signed URLs for authorized draft previews and public assets permitted by Storage RLS.
7. Support one cover and an optional ordered gallery with captions.
8. In the first release, removing an asset removes its reference but does not physically delete version-referenced files.
9. Test wrong MIME, oversized input, failed conversion, partial upload, retry, ordering, alt text, and signed URL expiry.

**Exit:** Project media is optimized, accessible, version-safe, and governed by Storage policy.

## Task 10: Implement resume versioning

**Create:**

- `src/admin/features/resume/resumeRepository.ts`
- `src/admin/features/resume/ResumePage.tsx`
- `src/admin/features/resume/ResumeUploader.tsx`
- resume tests and a minimal PDF fixture

**Steps:**

1. Accept only PDF files within the bucket byte limit and validate both declared MIME and PDF file signature.
2. Preview the selected local PDF with an object URL before upload; revoke object URLs on replacement and unmount.
3. Upload to an immutable version path and create an inactive `resume_versions` record.
4. Require explicit activation through `activate_resume`.
5. List current and historical versions with upload date, source filename, byte size, view, download, and restore actions.
6. Use `AlertDialog` before activation or rollback.
7. Do not physically delete historical PDFs in the first release.
8. Test invalid MIME, renamed non-PDF files, oversize, upload failure, activation, replay, rollback, and unauthorized reads.

**Exit:** One active resume is public, all previous versions are private and restorable, and activation cannot create an empty public state.

## Task 11: Implement preview, publish, and rollback

**Create:**

- `src/admin/features/publishing/PublishDialog.tsx`
- `src/admin/features/publishing/HistoryPage.tsx`
- `src/admin/pages/PreviewPage.tsx`
- `src/pages/DraftPreview.tsx`
- publishing tests

**Modify:**

- `src/App.tsx`

**Steps:**

1. Add a protected `/preview` route to the public entry that reads the authenticated draft and renders the same presentation modules as the live site.
2. Render `/preview` inside an iframe on `/admin/preview` so public CSS and admin CSS remain isolated.
3. Reject non-admin preview requests and avoid indexing the route.
4. Generate a field-level change summary between draft and published snapshots.
5. Block publish when schema validation, duplicate slugs, required alt text, or required case-study fields fail.
6. Call `publish_portfolio` with the draft ID and expected timestamp.
7. After success, update admin state, clear stale caches, and verify the public query returns the new version.
8. Add history and rollback with explicit confirmation and the same preview path.
9. Test successful publish, stale conflict, double submission, network loss, database error, invalid draft, and rollback.

**Exit:** Preview matches public rendering and publishing is atomic, explicit, and recoverable.

## Task 12: Keep the admin implementation isolated from the public portfolio

**Do not modify:**

- `src/main.tsx`
- `src/App.tsx`
- the existing public components and routes
- the Three.js character, loading screen/provider, `/play` chess route, or their assets and dependencies

**Steps:**

1. Keep CMS contracts and repository modules independent of the public entry point.
2. Confirm `/admin` loads through its separate HTML and TypeScript entry.
3. Confirm Tailwind, shadcn, editor validation, and admin data-loading code are absent from the public initial bundle.
4. Leave project case-study and resume public routes for a separately approved public-site change.
5. Record any proposed public content integration as follow-up work without implementing it in this admin-only scope.

**Exit:** The admin CMS is usable without changing the existing public portfolio behavior or routes.

## Task 13: Add the daily keep-alive job

**Create:**

- `api/cron/supabase-keepalive.js`
- `api/cron/supabase-keepalive.test.ts`

**Modify:**

- `vercel.json`
- environment documentation

**Steps:**

1. Add one daily production cron entry targeting `/api/cron/supabase-keepalive`.
2. Accept GET only and compare the inbound bearer token with `CRON_SECRET` using the Vercel Cron convention.
3. Query only the active portfolio ID and version using the Supabase publishable key and public RLS path.
4. Return small JSON responses for success, unauthorized, missing configuration, and upstream failure.
5. Do not mutate content, create heartbeat rows, expose environment values, or use the service role.
6. Test method rejection, missing/wrong secret, successful read, and Supabase failure.
7. Verify the deployed production invocation in Vercel logs. Preview deployment behavior is not evidence because Vercel Cron runs only in production.

**Required production variables:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `CRON_SECRET`

**Exit:** A protected daily production request performs one bounded database read and failures are visible without leaking secrets.

## Task 14: Verify admin isolation and preserve the public runtime

**Preserve:**

- the Character/Three.js implementation
- the loading screen and its provider
- the `/play` chess route, modules, workers, and assets
- their runtime dependencies and existing public styles

**Inspect:**

- `vite.config.ts`
- `package.json`
- `package-lock.json`
- admin entry points and generated chunks

**Steps:**

1. Confirm the Three.js character, loader/provider, and `/play` chess route remain connected to the public application.
2. Confirm Three.js, React Three Fiber, Drei, physics, post-processing, and chess dependencies remain installed.
3. Confirm admin chunks are not requested by `/` and public-only chunks are not required by `/admin`.
4. Verify the existing loader, GSAP behavior, portrait, and desktop/mobile presentation have not changed.
5. Treat any public performance optimization or asset removal as a separate change requiring explicit user approval.

**Verify:**

```bash
npm run lint
npm test
npm run build
```

Inspect output chunks and browser network requests for `/`, `/play`, and `/admin`.

**Exit:** The public portfolio retains its existing 3D, loader, and chess experience, while the public initial route contains no admin editor runtime.

## Task 15: End-to-end and production acceptance

**Create or modify:**

- `playwright.config.ts`
- `tests/e2e/admin-auth.spec.ts`
- `tests/e2e/content-publishing.spec.ts`
- `tests/e2e/media-resume.spec.ts`
- `tests/e2e/public-fallback.spec.ts`
- `tests/e2e/accessibility-navigation.spec.ts`
- deployment and environment documentation

**Local verification:**

1. Reset local Supabase and seed the administrator and initial content.
2. Run database, unit, lint, type, and production-build checks.
3. Start the production preview and run Playwright through:
   - correct and incorrect login
   - MFA and session refresh
   - About edit, save, preview, publish, and rollback
   - career create, edit, reorder, hide, and delete
   - project create, case-study completion, cover/gallery upload, preview, and publish
   - resume upload, preview, activation, download, history, and rollback
   - rejected unauthorized user
   - failed data request, failed upload, stale draft, and failed publish
4. Test keyboard navigation, visible focus, dialog focus traps, Escape, unsaved-change warnings, and reduced motion.
5. Check public routes at 360, 768, 1024, and 1440 px in both public themes.

**Remote rollout:**

1. Create or select the Supabase project only with user authorization.
2. Create the production Auth user manually, record its immutable ID, and populate the one-row allowlist through a controlled operation.
3. Apply reviewed migrations through the project's chosen Supabase deployment workflow.
4. Run security and performance advisors and correct all applicable findings.
5. Configure private buckets, Auth URL allowlists, disabled signup, MFA, and Vercel environment variables.
6. Deploy a preview, run non-destructive public and admin smoke tests, then deploy production.
7. Publish the seeded snapshot only after comparing it with the current public content.
8. Confirm the daily cron in production logs after its first scheduled execution.

**Performance acceptance:**

- Measure production p75 LCP through Vercel Speed Insights.
- Run throttled mobile Lighthouse against `/`, a representative project case study, and `/resume`.
- Confirm the homepage LCP does not wait on Supabase or an animation loader.
- Confirm CLS stays below 0.1 and image dimensions are reserved.
- Do not claim the sub-two-second target until production p75 LCP is below 2.0 seconds.

**Release gate:**

- Anonymous callers cannot retrieve drafts, archive history, inactive resumes, or unpublished media.
- A non-allowlisted authenticated user cannot create or mutate CMS data.
- Failed publish and rollback operations preserve the prior live state.
- Exactly one portfolio and one resume version are active.
- The public site renders its last valid content during a recoverable Supabase failure.
- All automated checks and complete browser flows pass.
- No existing public design, keyboard, reduced-motion, or responsive behavior regresses.

## Recommended commit sequence

1. `test: add portfolio content contract and harness`
2. `feat: add Supabase CMS schema and policies`
3. `feat: add typed Supabase content repository`
4. `feat: add isolated shadcn admin shell`
5. `feat: add single-admin authentication`
6. `feat: add About and career editors`
7. `feat: add project and media editors`
8. `feat: add resume version management`
9. `feat: add preview publishing and rollback`
10. `test: verify admin isolation from public routes`
11. `chore: add protected Supabase keep-alive`
12. `test: preserve public 3d loader and chess runtime`
13. `test: verify CMS and public release flows`

Each commit must stage only its own files and preserve unrelated user changes.
