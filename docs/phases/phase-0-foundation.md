# Phase 0 — Foundation

> Spec slice 1 (§32). Goal: a logged-in user can create, edit, archive, tag, and
> browse projects, backed by a real schema and the service layer everything else
> will reuse.

## Outcome / demo

Sign in with GitHub → land on a dashboard → create a project → edit it → tag it →
archive it → see it in a filtered project list. This is the spine; Phases 1–7
hang off it.

## Prerequisites

- Neon `DATABASE_URL` already in `.env.local` (done).
- A GitHub OAuth App (client id/secret). Identity scope only — **no repo
  scopes** at login (spec §14.1, §19.1).

## Dependencies to add

```bash
npm i next-auth@beta @auth/drizzle-adapter zod ulid
npx shadcn@latest add card input label dropdown-menu dialog badge sonner avatar table tabs
```

## Tasks

### 1. Schema (`db/schema.ts`)

Replace the placeholder. Define, with `workspace_id` tenancy throughout (spec §25):

- **Auth tables** (Auth.js Drizzle adapter shape): `users`, `accounts`,
  `sessions`, `verification_tokens` (spec §25.1, §12.1).
- **Core app tables for this phase:** `workspaces`, `workspace_members` (roles:
  owner/admin/member/viewer), `projects`, `tags`, `project_tags`.
- Use text ULID PKs (`$defaultFn(() => ulid())`), `timestamptz` `created_at` /
  `updated_at`, and `archived_at` (nullable) for soft delete.
- Project enums per spec §12.4: status, health, priority, type. Use Drizzle
  `pgEnum` or text + Zod-validated union.
- Stub the remaining tables from §25.2 as commented TODOs so later phases extend
  one file coherently.

Run `npx drizzle-kit generate && npx drizzle-kit migrate`.

### 2. DB client (`db/index.ts`)

Export a Drizzle client over `@neondatabase/serverless` using `DATABASE_URL`.
Single shared instance.

### 3. Auth.js (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`)

- GitHub provider, identity scope only.
- Drizzle adapter, **database sessions** (spec §14.3).
- Session callback adds `user.id` to the session (spec §28.1).
- **First-sign-in hook** (spec §14.2): on user creation, create a personal
  workspace + add the user as `owner`. Do it in the adapter `createUser` wrapper
  or an `events.createUser` callback so it is atomic.
- `middleware.ts` (or per-layout check) protecting all `/app` routes.

### 4. Domain services (`lib/services/`)

The contract everything else reuses. No DB access outside here.

- `lib/auth/context.ts` — `requireUser()`, `requireWorkspaceMember(workspaceId, minRole)`.
- `lib/services/workspaces.ts` — `getPersonalWorkspace(userId)`, `bootstrapWorkspace(user)`.
- `lib/services/projects.ts` — `listProjects(workspaceId, filters)`,
  `getProject`, `createProject`, `updateProject`, `archiveProject`. Every fn
  takes an auth context and enforces membership + workspace ownership of the row.
- `lib/services/tags.ts` — CRUD + `setProjectTags`.
- `lib/services/activity.ts` — `recordActivity(...)` writing `activity_events`
  (used by mutations now and every later phase).
- `lib/validation/` — Zod schemas (`projectCreateSchema`, etc.) shared by
  services + API + forms.

### 5. API routes (spec §17.2)

Thin handlers → validate with Zod → call service → typed JSON. Write activity on
mutations.

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/[projectId]
PATCH  /api/projects/[projectId]
DELETE /api/projects/[projectId]      # soft delete / archive
GET    /api/tags  POST /api/tags  PATCH/DELETE /api/tags/[tagId]
```

### 6. UI

- `app/(app)/layout.tsx` — authed shell: primary nav (Dashboard, Projects, Runs,
  Patterns, Decisions, Agents, Integrations, Settings — spec §23.2; later items
  can be stubs/disabled), user avatar menu, sign out.
- `app/(app)/dashboard/page.tsx` — project grid + "Create project"; other
  dashboard cards (active runs, open PRs, blocked tasks, recent learnings) are
  empty-state placeholders this phase (spec §23.3).
- `app/(app)/projects/page.tsx` — searchable/filterable list (status, tag).
- `app/(app)/projects/new` + edit dialog — React Hook Form + Zod; fields per
  §11.1 (name, description, status, type, priority, stack, goal, constraints,
  notes, tags).
- `app/(app)/projects/[slug]/page.tsx` — minimal overview header + the tab bar
  shell (Overview/Plan/Specs/Tasks/Runs/PRs/Decisions/Learnings/Patterns/
  Settings — spec §23.2); non-Overview tabs are placeholders filled in later
  phases.
- Replace the stub `app/page.tsx` with a marketing/landing or redirect to
  dashboard when authed.

## Acceptance criteria (spec §28.1, §28.2)

- [ ] User signs in with GitHub; first sign-in creates a personal workspace with
      the user as owner.
- [ ] Sign out works; protected pages redirect unauthenticated users.
- [ ] Session includes user ID.
- [ ] Create, edit, archive a project; archive is a soft delete (`archived_at`).
- [ ] Tag a project; tags are workspace-scoped.
- [ ] Project list supports search + status/tag filter.
- [ ] Every project mutation writes an `activity_events` row.
- [ ] `npm run typecheck` + `npm run lint` clean; migrations apply on a fresh DB.

## Notes / pitfalls

- Don't request GitHub repo scopes now — login is identity-only (deferred to
  Phase 5 GitHub App).
- Lock in the service-layer boundary here; it is the hardest thing to retrofit.
- Seed a few default tags (§12.5 examples) on workspace bootstrap for nicer UX.
