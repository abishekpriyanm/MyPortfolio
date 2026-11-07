# MyPortfolio Admin CMS Design Specification

**Date:** 2026-09-10

**Status:** Approved design; implementation requires a separate reviewed plan

**Product:** Single-administrator content management system for the Abishek Priyan portfolio

## 1. Purpose

Add a secure, fast admin experience to the existing React and Vite portfolio so its owner can manage About content, career timeline entries, projects, evidence-rich case studies, project media, and the active resume without editing source files or operating a separate backend.

The CMS must preserve the public portfolio direction in `docs/superpowers/specs/2026-09-08-portfolio-redesign-design.md`. It is an operational editing surface, not a public-facing redesign.

## 2. Decisions and non-goals

### 2.1 Approved decisions

- Retain React, TypeScript, Vite, React Router, Vercel hosting, and the current public portfolio architecture.
- Use Supabase Auth, Postgres, Data API, database functions, and Storage directly.
- Do not use Prisma or create a separate content backend.
- Support one allowlisted administrator.
- Use an explicit Draft to Preview to Publish workflow.
- Give every project one cover image and an optional ordered screenshot gallery.
- Give every project a dedicated public case-study route at `/projects/:slug`.
- Support one active resume with private version history and rollback.
- Use shadcn/ui for the admin experience, guided by `DESIGN.md`.
- Run a protected external keep-alive request once per day on Vercel.

### 2.2 Non-goals

- Multiple administrators, teams, roles, invitations, or audit approval chains.
- A generic multi-tenant CMS or reusable SaaS product.
- A separate Node, Express, or Next.js backend.
- Rich-text page building, arbitrary layout blocks, comments, analytics dashboards, or content scheduling in the first release.
- Guaranteeing every page load completes within two seconds on every device or network.

## 3. System architecture

The system has four modules with narrow interfaces:

1. **Public portfolio module** renders the last valid published portfolio snapshot and never reads drafts.
2. **Admin editor module** loads and updates the authenticated administrator's working draft.
3. **Publishing module** validates and atomically promotes a draft through an authenticated Postgres function.
4. **Media module** validates, optimizes, uploads, orders, previews, and safely retires project images and resume PDFs.

All runtime data operations use `supabase-js`. The browser contains only the Supabase project URL and publishable key. Authorization is enforced by database and Storage policies, not route guards.

Public routes:

- `/` — portfolio homepage using the published snapshot
- `/projects/:slug` — published project case study
- `/resume` — viewer for the active resume, with a download action

Admin routes:

- `/admin/login` — administrator authentication
- `/admin` — overview and publishing status
- `/admin/about` — About and contact editor
- `/admin/career` — career timeline editor
- `/admin/projects` — project list and ordering
- `/admin/projects/:id` — project and case-study editor
- `/admin/resume` — resume upload, preview, activation, history, and rollback
- `/admin/preview` — authenticated preview of the complete working draft

Admin code and styling must be loaded separately from public routes. The public bundle must not pay the cost of shadcn, editor validation, upload controls, or admin-only dependencies.

## 4. Content model

### 4.1 Administrator allowlist

`portfolio_admins` contains the single permitted Supabase Auth user ID. It is populated through a controlled bootstrap migration or dashboard operation, never public signup or a browser mutation.

Required fields:

- `singleton` boolean primary key defaulting to true with a true-only check constraint
- `user_id` unique UUID referencing `auth.users`
- `created_at`

The table permits at most one row. Authenticated callers may determine only whether their own user ID is allowlisted. All draft, publishing, upload, resume-history, and rollback policies require membership in this allowlist; matching a row's `created_by` value alone is insufficient authorization.

### 4.2 Portfolio versions

`portfolio_versions` stores immutable published and archived snapshots plus one mutable working draft.

Required fields:

- `id` UUID primary key
- `version` monotonically increasing integer
- `state` constrained to `draft`, `published`, or `archived`
- `content` JSONB matching the versioned TypeScript content contract
- `created_by` referencing the administrator's auth user ID
- `created_at`, `updated_at`, and nullable `published_at`

Database constraints and partial unique indexes enforce at most one working draft and exactly one active published version after initial seeding.

The `content` document contains:

- About headline, biography, roles, location, contact details, and social links
- Ordered career entries with period, role, organization, location, summary, responsibilities, technologies, and visibility
- Ordered projects with stable ID, unique slug, category, summary, technology list, featured state, visibility, and links
- Case-study sections: problem, constraints, system built, personal role, engineering decisions, verified outcome, current status, and known limitations
- Cover and ordered gallery media references with captions and alt text
- Page-level SEO title and description fields

The application validates the document at every read and before every save or publish. A malformed remote snapshot is never rendered over the last valid cached content.

### 4.3 Media assets

`media_assets` records immutable Storage objects and their use in drafts or published content.

Required fields:

- `id` UUID primary key
- `storage_path` unique immutable path
- `kind` constrained to project cover or project gallery
- MIME type, byte size, width, and height
- alt text and optional caption
- `created_by` and `created_at`

Project images are converted to responsive WebP variants before upload. The draft references immutable paths; publishing copies those references into the published snapshot. Deletion is blocked while an asset is referenced by a draft, published snapshot, or archived version. Initial implementation may hide unused assets rather than physically deleting them.

### 4.4 Resume versions

`resume_versions` stores metadata for immutable PDF files:

- `id` UUID primary key
- `version` monotonically increasing integer
- `storage_path` unique immutable path
- `original_filename`, MIME type, byte size, and optional checksum
- `is_active` boolean
- `created_by`, `created_at`, and nullable `published_at`

A partial unique index permits one active resume. Previous versions remain private and restorable. Activating or rolling back a resume is transactional and never overwrites an existing PDF.

## 5. Authentication and authorization

- Disable public signup.
- Use email and password authentication for the single administrator and enable TOTP MFA.
- Identify the administrator by immutable Supabase Auth user ID and require its presence in `portfolio_admins` for every privileged policy.
- Require an MFA-backed `aal2` JWT assurance level for draft reads, CMS mutations, uploads, publishing, resume history, and rollback. The route guard alone is not MFA enforcement.
- Do not authorize a mutation merely because `created_by = auth.uid()`; unauthorized authenticated users must remain unable to create their first row.
- A client-side route guard improves navigation but is not a security control.
- Enable RLS on every exposed table.
- Anonymous users may select only the active published portfolio version and active resume metadata.
- The administrator may select the working draft and archived versions and perform allowed mutations.
- Unauthorized authenticated users receive no broader access than anonymous users and cannot mutate content.
- Enable RLS on Storage objects. Anonymous users may read only media referenced by published content and the active resume; the administrator may upload and read private versions.
- Restrict Storage buckets by MIME type and file size. Resume storage accepts PDF only.
- Do not authorize with `user_metadata`. Do not expose a service-role or secret key to the client.

Publishing and rollback functions run transactionally, validate the caller, and remain idempotent. Prefer security-invoker behavior. Any function requiring elevated privileges must live outside exposed schemas, set a safe search path, explicitly verify the caller, receive narrowly scoped execute grants, and be reviewed with Supabase security advisors.

## 6. Publishing behavior

### 6.1 Portfolio

1. The administrator edits and explicitly saves the working draft.
2. Validation reports blocking errors at their exact fields and reports non-blocking completeness warnings separately.
3. `/admin/preview` renders the draft through the same public presentation modules used by published content.
4. The publish confirmation shows a concise change summary.
5. A single database transaction archives the previous published version, promotes the draft, and creates the next draft as a copy of the newly published snapshot.
6. Rollback promotes a selected archived version and creates a fresh editable draft from it.

No draft mutation may affect the live site before successful publication.

### 6.2 Resume

1. The browser validates file type and size before upload.
2. The selected PDF is previewed locally before it is saved.
3. Upload creates an immutable Storage object and inactive `resume_versions` record.
4. An explicit publish action transactionally deactivates the old resume and activates the selected version.
5. `/resume` resolves the active record, displays an inline viewer where supported, and provides a download action and accessible fallback link.
6. Rollback changes the active record; it does not duplicate or re-upload the PDF.

## 7. Admin experience

The admin is a focused editor with five primary areas:

- **Overview:** working-draft state, last publication, completeness issues, and preview/publish actions
- **About:** identity, biography, roles, location, contacts, and social links
- **Career:** add, edit, hide, delete, and reorder timeline entries
- **Projects:** manage cards, full case studies, project links, covers, galleries, captions, and ordering
- **Resume:** upload, preview, publish, download, inspect history, and restore

Editors use explicit save actions and show unsaved-change warnings before navigation. Destructive actions use confirmation dialogs. Reordering supports pointer interaction and keyboard-accessible move controls. Empty, loading, validation, permission, upload, and network-error states are designed states rather than raw messages.

## 8. Admin visual system and shadcn

`DESIGN.md` is the source for the admin's visual tokens, not its marketing-page structure. The applicable direction is:

- Near-black canvas and stepped charcoal surfaces
- Lavender-blue as the single primary accent
- Hairline borders rather than heavy shadows
- Compact technical typography and a consistent spacing system
- Dark mode for the admin
- Restrained status colors used only when their semantics are necessary

Do not carry over pricing layouts, testimonial patterns, marketing calls to action, or the instruction to lead sections with product screenshots.

Initialize shadcn non-interactively for Vite with the `new-york` style and Radix primitives. Install only the required source components: Button, Input, Textarea, Form, Card, Table, Tabs, Badge, Dialog, AlertDialog, Sheet, DropdownMenu, Tooltip, Skeleton, Alert, Select, and Sonner. Compose these into domain-specific editor modules; do not expose raw database operations throughout page modules.

Tailwind base styles and admin tokens must be isolated so they cannot reset or visually alter the existing public portfolio. Admin portals, dialogs, and sheets must inherit the same scoped tokens.

## 9. Public data loading and failure behavior

- Keep the hero shell and portrait independent of the Supabase content request so first paint and LCP do not wait on the database.
- Fetch the published portfolio in one bounded query.
- Validate the response before storing or rendering it.
- Cache the last valid published snapshot and its version in the browser.
- When Supabase is unavailable, render the last valid cached snapshot. On a true first visit without a cache, retain a minimal build-time fallback for essential identity and contact information and show a controlled unavailable state for dynamic sections.
- Do not silently replace fresh content with an older response.
- Case-study galleries and non-critical media load below the fold.
- Resume failures retain a direct, accessible retry path and never claim a document is available when it is not.

## 10. Performance requirements

The measurable public target is production p75 LCP below 2.0 seconds on representative mobile traffic. This is a target, not a guarantee for every network and device.

Required measures:

- Keep shadcn, admin editors, validation, and upload dependencies out of the public initial bundle.
- Preserve the existing Three.js character, loading sequence, `/play` chess route, and their assets and dependencies. Admin work must not alter or remove them.
- Render essential hero content without waiting for animation or Supabase.
- Prefer transforms and opacity for motion and preserve reduced-motion behavior.
- Produce responsive project images, lazy-load below-the-fold media, and reserve dimensions to prevent layout shift.
- Keep the published content query small and indexed.
- Track production results with Vercel Speed Insights and validate releases with throttled Lighthouse and browser measurements.

## 11. Keep-alive scheduling

Free Supabase projects may pause after insufficient user database activity. Weekly or three-times-weekly polling is not treated as reliable prevention.

Add one production Vercel Cron job that calls `/api/cron/supabase-keepalive` daily. The function:

- accepts only requests whose bearer token matches `CRON_SECRET`;
- performs one bounded read of the active portfolio version;
- returns a small success or failure response;
- does not insert artificial records or mutate content;
- emits enough structured information for failure diagnosis without logging secrets.

This isolated infrastructure function is not a content backend. It exists only because Vercel Cron requires an HTTP function target. Cron behavior is verified through production logs because Vercel does not execute scheduled jobs on preview deployments.

Supabase Pro remains the only approved route when guaranteed inactivity protection is a business requirement.

## 12. Delivery phases

### Phase 1: Foundation

- Add isolated shadcn and Tailwind admin foundations.
- Add validated Supabase environment configuration and focused client modules.
- Add login, protected admin routing, session restoration, MFA handling, and logout.

### Phase 2: Database and security

- Add reviewed migrations for portfolio versions, media assets, resume versions, constraints, indexes, functions, grants, and RLS.
- Configure Storage buckets and policies.
- Seed the first published version and draft from `src/config.ts`.
- Generate and commit database types.

### Phase 3: Admin CMS

- Build About, career, project, media, and resume editors.
- Add validation, ordering, unsaved-change protection, upload progress, preview, publish, history, and rollback.

### Phase 4: Public integration (separate approval required)

- Do not change public routes as part of the admin-only implementation.
- After separate explicit approval, replace hard-coded About, career, and project reads with the validated published snapshot and add case-study and resume routes.
- Preserve the existing Three.js character, loading sequence, mobile portrait choreography, and `/play` route during any future integration.
- Add last-valid and build-time fallback behavior only with that separately approved public integration.

### Phase 5: Performance and infrastructure

- Keep the admin entry and its dependencies isolated from the public bundle.
- Preserve the existing 3D, loader, and chess experience; any public performance work requires separate explicit approval.
- Add and verify the protected daily keep-alive function and schedule.

### Phase 6: Verification and release

- Complete automated database, module, browser, accessibility, and performance verification.
- Deploy to a controlled production environment and confirm telemetry and scheduled execution.

## 13. Verification and acceptance

Automated verification includes:

- Content contract validation and malformed-response fallback tests
- Publishing, rollback, version ordering, and idempotency tests
- Anonymous, administrator, and unauthorized-authenticated RLS tests
- Storage read, upload, MIME restriction, file-size restriction, and reference-protection tests
- Resume activation and rollback tests
- TypeScript, lint, unit tests, and full production build

Real-browser verification includes:

- Login, MFA, session restoration, logout, and rejected-user flows
- About, career, project, media, and resume editing from draft through publication
- Preview parity with the public presentation
- Unsaved-change warning and destructive confirmation behavior
- Keyboard navigation, visible focus, Escape behavior, and screen-reader labeling
- Public routes at 360, 768, 1024, and 1440 px, both public themes, and reduced motion
- Slow network, offline cache, missing image, invalid PDF, failed upload, and failed publish states
- Project slugs, direct links, resume view/download, and browser refresh on deep routes

Release acceptance requires all of the following:

- No draft content is retrievable anonymously.
- No unauthorized account can mutate database rows or Storage objects.
- Publishing and rollback preserve exactly one active portfolio and resume version.
- A failed publish leaves the previous public version intact.
- The public site remains useful during a recoverable Supabase outage.
- Admin code does not inflate the public initial route bundle.
- Production p75 LCP is below 2.0 seconds before the performance goal is claimed as achieved.
