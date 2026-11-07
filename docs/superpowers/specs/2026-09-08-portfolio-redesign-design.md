# Abishek Priyan Portfolio Redesign — Design Specification

**Date:** 2026-09-08

**Status:** Approved direction; implementation requires a separate plan and review

**Product:** Personal portfolio for Abishek Priyan M

## 1. Purpose

Redesign the cloned portfolio into a distinctive, fast, credible personal site that presents one curated story to two audiences:

- recruiters evaluating engineering depth and judgment;
- clients evaluating whether Abishek can turn an unclear problem into a production-ready system.

The site should feel technically ambitious without becoming a graphics demo. Its signature interaction is a scroll-driven system map anchored by Abishek's real portrait. The visual treatment is 2.5D—layered depth, masking, parallax, and carefully staged motion—not a generated or modeled 3D avatar.

Primary positioning:

> **ABISHEK PRIYAN — Building Intelligence. Shipping Systems.**

Supporting roles:

> AI Engineer · Full-Stack Developer · Freelancer

## 2. Source and legal boundary

The implementation starts from the MIT-licensed repository `red1-for-hek/portfolio-website`.

- Keep the existing `LICENSE` file and original copyright notice.
- Treat the repository as a technical starting point, not a visual identity to copy.
- Reuse useful React, TypeScript, Vite, GSAP, and Lenis foundations selectively.
- Replace all visible content, branding, personal information, project data, portraits, and decorative assets associated with the original author.
- Remove routes, dependencies, and assets that do not support the final Abishek Priyan portfolio.

## 3. Experience concept

### 3.1 One curated story

The page is a single narrative rather than a collection of disconnected cards. Scrolling moves the visitor through a system diagram whose nodes correspond to chapters of Abishek's work. The connecting line progresses with the visitor, and each active node reveals the next piece of the story.

The narrative is:

1. **Identity:** who Abishek is and what he builds.
2. **Proof:** the type of engineering problems he has solved.
3. **Method:** how he moves from ambiguity to a working system.
4. **Selected work:** a small set of evidence-rich case studies.
5. **Range:** research, leadership, and independent/client delivery.
6. **Invitation:** a direct, low-friction path to start a conversation.

Recruiter and client needs are addressed within the same case studies. There will not be separate recruiter and client versions of the site.

### 3.2 Portrait direction

Use the supplied real photograph of Abishek as the human anchor of the hero. The current source asset is:

`/var/folders/rg/gc22883x4ds2jg2x7jfq25_80000gn/T/codex-clipboard-88d0d207-3fbf-4add-95d1-6ef97fb17680.png`

The implementation asset should be copied to:

`public/images/abishek-priyan-portrait.png`

Rules:

- Do not regenerate, reshape, or distort the face.
- Use a high-quality responsive crop and preserve natural skin tone.
- Create depth through CSS masks, restrained transforms, and separate background/foreground signal layers.
- Use three perceptual planes: a slow grid or field behind the portrait, the portrait with only 6–10 px of motion, and faster interface signals in front.
- Do not allow connecting lines, labels, or glow effects to cross the face.
- On touch devices and with reduced-motion enabled, render a stable portrait without pointer tracking.

### 3.3 Why 2.5D instead of full 3D

Full 3D would add loading cost and visual noise without proving Abishek's engineering ability. It would also compete with the portrait, weaken accessibility, and make mobile behavior harder to control. The chosen 2.5D treatment preserves the intended depth while keeping the site personal, legible, and performant.

Do not use Higgsfield or AI-generated video. Do not build a 3D face or character model. Three.js should remain only if a later implementation test proves that a small system-map effect cannot be delivered more effectively with DOM, SVG, and GSAP. The default is to remove the current character, physics, and post-processing stack.

## 4. Information architecture

### 4.1 Hero — Identity node

The opening viewport contains:

- name and primary positioning;
- concise supporting sentence explaining the value delivered;
- role labels that rotate or sequence with restrained kinetic type;
- portrait as the main visual anchor;
- primary action: **View selected work**;
- secondary action: **Start a conversation**;
- theme control and minimal navigation.

The hero should immediately answer who, what, and why. It must not hide essential copy behind an animation or loader.

### 4.2 Proof strip — Signal node

A compact evidence band introduces verified proof such as focus areas, shipped systems, research work, or leadership. It must use only claims that can be supported by a repository, public link, artifact, or user-provided evidence.

Unverified numbers—including previously discussed revenue, reach, user, or performance figures—must not appear until their source is supplied.

### 4.3 Journey — Timeline node

A concise scroll-linked timeline shows meaningful changes in responsibility, not a résumé dump. Each entry contains a date or stage, role/context, one sentence of responsibility, and one defensible outcome.

### 4.4 What I build — Capability node

Capabilities are grouped by problems solved:

- intelligent decision and automation systems;
- end-to-end web products;
- data, research, and evaluation tooling;
- client delivery and production hardening.

Avoid skill percentages and generic claims such as “expert” without evidence.

### 4.5 Selected work — System nodes

Show three to five projects, curated for quality and range. Every project uses the same evidence structure:

1. **Problem** — the real constraint or user need.
2. **System built** — the product or technical response.
3. **Role** — what Abishek personally owned.
4. **Engineering** — the important architecture or implementation choices.
5. **Outcome** — verified result, current status, and known limitation.

Each project may expose repository, live product, case study, or evidence links when they exist. Missing or synthetic evidence must be labeled honestly.

### 4.6 Freelance delivery — Delivery node

Present freelance work as a repeatable path:

> Client problem → product decision → system design → implementation → production handoff

This section should communicate scope, working style, and the types of engagements accepted. It must not use fake testimonials, client logos, or business metrics.

### 4.7 Lab and research — Exploration node

Show experiments and research-oriented work separately from production claims. Each item must state whether it is a concept, proof of concept, active build, research artifact, or deployed product.

### 4.8 Leadership and beyond code — Context node

Use a small number of meaningful signals—team leadership, community work, speaking, mentoring, or competitions—only where evidence or precise context exists.

### 4.9 Tech arsenal — Tooling node

Group technologies by how they are used rather than showing a logo wall:

- AI and data;
- frontend and interaction;
- backend and APIs;
- infrastructure, testing, and delivery.

### 4.10 Contact — Terminal node

End with a direct statement of availability, preferred project types, email, and relevant social links. The contact action must work without an AI chatbot. A serverless contact endpoint may be added only if spam protection, privacy, error states, and a fallback email path are defined.

## 5. Visual system

### 5.1 Light theme

- Canvas: warm white `#F7F7F3`
- Primary ink: `#101216`
- Muted ink: `#616873`
- Accent: cobalt `#2563EB`
- Secondary signal: restrained cyan `#0891B2`
- Lines/grid: low-contrast cool gray

Light mode is the default visual expression: editorial, calm, spacious, and precise.

### 5.2 Dark theme

- Canvas: near-black `#090B0F`
- Primary ink: `#F4F5F7`
- Muted ink: `#9BA3AF`
- Accent: light cobalt `#60A5FA`
- Secondary signal: cyan `#22D3EE`
- Lines/grid: low-opacity blue-gray

Dark mode uses the same hierarchy and geometry. Theme switching must not cause layout shift, replace content, or change information density.

### 5.3 Typography

- Display: Space Grotesk
- Body: Inter
- Labels and system metadata: JetBrains Mono

Type must remain readable before custom fonts load. Use responsive type sizing and avoid overly narrow line lengths.

### 5.4 Composition

- Editorial whitespace and strong alignment are the base aesthetic.
- Hairline connections and node markers form the system-map vocabulary.
- Project sections may break the grid for emphasis, but reading order remains obvious.
- Avoid generic card grids, fake terminals, floating gradient blobs, excessive glassmorphism, neon overload, and decorative dashboards.

## 6. Motion system

GSAP and ScrollTrigger drive the primary narrative. Lenis may be retained only if native scrolling, keyboard navigation, anchor navigation, and reduced-motion behavior remain reliable.

### 6.1 Motion sequence

1. A short intro resolves the wordmark and portrait; essential content is already present in the DOM.
2. Hero role labels sequence without blocking interaction.
3. The system line draws as scroll progress advances.
4. Each chapter node activates once it reaches its reading threshold.
5. Copy and evidence reveal in small groups; projects should not wait on long cinematic sequences.
6. The contact node completes the line and leaves all calls to action visible.

### 6.2 Motion constraints

- Prefer transforms and opacity; avoid layout-triggering animation.
- No scroll hijacking.
- No long mandatory loader.
- No perpetual animation behind body copy.
- Theme transition duration should be approximately 250–400 ms and must not flash.
- Pointer parallax is subtle, local to the hero, and disabled for coarse pointers.
- `prefers-reduced-motion: reduce` removes parallax, scrubbed movement, and large transitions while preserving content order and state.

## 7. Responsive behavior

- **Desktop (1024 px and above):** portrait and identity copy share the hero; the system path may alternate between left and right chapters.
- **Tablet (768–1023 px):** preserve the narrative path with reduced offsets and simplified layered effects.
- **Mobile (below 768 px):** use a single vertical story rail, stable portrait, no pointer effects, and no heavyweight canvas. Calls to action remain reachable without animation.

All layouts must be checked at 360, 768, 1024, and 1440 px widths.

## 8. Accessibility and performance

### 8.1 Accessibility

- Use semantic landmarks and a logical heading structure.
- Ensure keyboard access to navigation, theme control, project links, and contact actions.
- Provide visible focus states in both themes.
- Meet WCAG AA contrast for text and interactive controls.
- Add useful portrait alt text; decorative system lines must be hidden from assistive technology.
- Preserve readable content when JavaScript or animation initialization fails.
- Honor reduced motion and system color preference.

### 8.2 Performance

- Use responsive image formats and sizes for the portrait and project media.
- Lazy-load below-the-fold media.
- Self-host or efficiently load only the font weights in use.
- Remove unused 3D, physics, chess, and chatbot dependencies after their features are removed.
- Split non-critical motion code and avoid shipping large libraries to routes that do not need them.
- Target LCP below 2.5 seconds and CLS below 0.1 under a representative production test; report actual measurements rather than claiming them in advance.

## 9. Technical architecture

Retain React, TypeScript, and Vite. Simplify the current source rather than layering the redesign on top of the existing character demo.

### 9.1 Proposed structure

- `src/app/` — application shell and routing, if routing remains necessary.
- `src/components/` — reusable navigation, theme, portrait, section, project, and contact components.
- `src/features/portfolio/` — story sections and their section-scoped motion.
- `src/data/portfolio.ts` — typed portfolio content and evidence links.
- `src/styles/` — design tokens, theme variables, global styles, and motion fallbacks.
- `src/lib/motion/` — GSAP registration, shared utilities, and reduced-motion checks.

### 9.2 Required refactors

- Replace the current `Character` subsystem with a portrait-led hero.
- Replace the global-selector-heavy `GsapScroll.ts` approach with section-scoped refs, contexts, and cleanup.
- Centralize identity, project, experience, link, and contact content in typed data rather than scattering it across components.
- Add a theme provider backed by CSS custom properties. Initial state follows saved preference, then system preference, then light mode; persist explicit user choice in local storage.
- Remove the `/play` chess experience, Stockfish assets, and chess dependencies unless a future approved content decision explicitly restores them.
- Remove the original `/myworks` presentation in favor of the curated selected-work chapters unless a case-study route is justified in the implementation plan.
- Remove the current AI chat endpoint and interface. Contact should not depend on model availability or expose unnecessary infrastructure.
- Remove original portraits, character models, project imagery, encrypted assets, environment maps, and copy after replacements are in place.

## 10. Content and evidence rules

- Every claim must have a source or be written as a qualitative statement.
- Clearly distinguish deployed products, active builds, prototypes, research, synthetic demonstrations, and concepts.
- Do not invent clients, testimonials, usage counts, revenue, rankings, awards, or performance improvements.
- Do not expose private repositories, secrets, customer data, or confidential implementation details.
- Prefer concrete problem → decision → system → result writing over adjective-heavy marketing copy.

## 11. Validation plan

Implementation is complete only when:

- `npm run lint` passes with no errors;
- `npm run build` passes;
- the main story is usable at 360, 768, 1024, and 1440 px;
- light and dark themes render correctly and explicit preference persists;
- reduced-motion mode removes non-essential animation;
- keyboard navigation and visible focus work through the full page;
- no removed original-author route, asset, copy, or personal data is reachable;
- the portrait is sharp, undistorted, and unobstructed;
- all external links and contact actions work or show a deliberate unavailable state;
- the browser console is clean during the primary journey;
- production performance is measured and reported against the targets rather than assumed.

## 12. Implementation phases

1. **Baseline and content audit** — inventory reusable code; identify and remove original-author features and assets; preserve MIT attribution.
2. **Design foundation** — implement tokens, typography, responsive layout primitives, theme state, navigation, and accessibility foundations.
3. **Hero and portrait** — integrate the supplied portrait, 2.5D layers, hero copy, actions, and reduced-motion behavior.
4. **System-map story** — build the progress rail, chapter nodes, content sections, typed portfolio data, and section-scoped motion.
5. **Selected work and contact** — implement evidence-led case studies, honest status labels, freelance flow, and contact paths.
6. **Cleanup and optimization** — remove unused routes, assets, APIs, and dependencies; optimize media and bundles.
7. **Verification** — lint, build, responsive checks, theme persistence, reduced motion, keyboard navigation, console review, and production performance measurement.

## 13. Acceptance criteria

The redesign is accepted when a first-time visitor can understand within the opening viewport that Abishek builds AI and full-stack systems, then follow one coherent scroll narrative to verified work and a functioning contact path. The portrait must feel dimensional without behaving like a 3D avatar. Both themes must be equally intentional. Motion must explain hierarchy and progression rather than exist as decoration. The final product must be recognizably Abishek's portfolio, not a reskinned version of the source site.
