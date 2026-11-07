# MyPortfolio Agent Guide

## Preserve Existing Work

- Inspect `git status` before and after making changes.
- Preserve user-owned and unrelated working-tree changes.
- Do not push to `upstream`.
- Keep the MIT `LICENSE` and its original copyright notice.

## Public Portfolio

- Read `docs/superpowers/specs/2026-09-08-portfolio-redesign-design.md` before changing the public portfolio.
- Preserve the portrait-led, scroll-driven story, equal light/dark intent, accessibility, reduced-motion behavior, and evidence-based content rules in that specification.
- Never remove or replace the Three.js character, loading screen/provider, `/play` chess route, or their assets and dependencies as part of admin CMS work.
- Public-route integration and public performance changes require separate explicit approval; an admin request does not authorize them.
- Do not apply the admin-only Linear design system to public portfolio routes.

## Admin CMS

- Read `docs/superpowers/specs/2026-09-10-portfolio-admin-cms-design.md` and `DESIGN.md` before changing `/admin` or its shared editor modules.
- `DESIGN.md` is scoped to the admin CMS. Its useful tokens, surface hierarchy, typography, density, and interaction guidance apply to `/admin`; its marketing-page patterns do not.
- Use the `vercel:shadcn` skill for shadcn initialization, components, theming, composition, or troubleshooting.
- Use shadcn's `new-york` style with Radix primitives and install only the components the admin actually uses.
- Keep Tailwind/shadcn styling isolated from the public portfolio bundle and CSS.
- Build operational editor workflows, not a generic dashboard template.

## Supabase

- Use the `supabase` skill for every Supabase Auth, Database, Storage, Data API, RPC, migration, or RLS change.
- Verify current Supabase documentation and relevant breaking changes before implementation.
- The browser may contain only the project URL and publishable key. Never expose a secret or service-role key.
- Enable RLS on every exposed table and Storage bucket. Public access is limited to published content and the active resume.
- Authorization is tied to the single configured administrator's immutable user ID, never user-editable metadata.
- Schema changes must be committed as reviewed migrations and followed by security and performance advisor checks when supported.

## Required Verification

- Run lint, TypeScript checks, tests, and the full production build.
- Exercise the live admin workflow in a real browser: login, draft editing, preview, publish, rollback, project media, and resume versioning.
- Test public pages at 360, 768, 1024, and 1440 px, both public themes, keyboard navigation, Escape behavior, visible focus, and reduced motion.
- Verify anonymous, authorized-admin, and unauthorized-user database and Storage behavior.
- Measure production performance. A passing local build is not evidence that the p75 LCP target is met.
