# Build phases — Agent-native project hub

This directory slices [`docs/spec.md`](../spec.md) into ordered, shippable phases.
Each phase doc is self-contained: goal, prerequisites, task checklist, files to
touch, and acceptance criteria. Build them in order. Each phase ends in a
demoable, deployable state.

## Where we are now (Phase 1 baseline)

Already in the repo (`AGENTS.md` describes the project conventions):

- Next.js 16 App Router + TypeScript + React 19.
- Tailwind v4 + shadcn/ui primitives for the app shell, forms, cards, tables,
  dialogs, tabs, badges, dropdowns, avatar, and native select wrapper.
- Drizzle ORM + Neon serverless driver, `DATABASE_URL` wired through
  `drizzle.config.ts`.
- Auth.js GitHub identity login with database sessions and first-sign-in
  personal workspace bootstrap.
- Workspace-scoped schema and services for users, workspaces, memberships,
  projects, tags, activity events, plans, specs, spec versions, tasks, and task
  dependencies.
- Domain services in `lib/services/`; App Router pages and API routes call those
  services rather than touching Drizzle directly.
- Project dashboard/list/detail UI, project tagging/archive flow, plan/spec/task
  tabs, AI-assisted plan/spec/task generation, editable drafts, spec versioning,
  task dependencies/subtasks, and task activity display.

Current gate: `npm run typecheck`, `npm run lint`, and `npx drizzle-kit check`
must pass before moving into the next phase.

Not yet present (later phases): context packs, decisions, learnings, patterns,
agent runs, pull requests, integrations, MCP server, scoped tokens, CLI, and
local/cloud runner adapters.

## Target architecture (spec §15)

```
Web UI (App Router)  ─┐
API routes           ─┼──▶  Domain services  ──▶  Drizzle  ──▶  Neon Postgres
MCP server           ─┤        (lib/services/)
CLI                  ─┘
                          Agent runners (lib/runners/) ── adapters only
```

Rule (spec §34): **UI, API, MCP, and CLI must all call the same domain
services.** Never let a route or MCP tool talk to the DB directly. Runners are
adapters behind a common interface — no vendor logic leaks into the core.

## Phase map

| Phase | Spec slice | Theme | Outcome |
|-------|-----------|-------|---------|
| [0](./phase-0-foundation.md) | Slice 1 | Foundation | Auth, schema, workspace bootstrap, project CRUD, tags, dashboard |
| [1](./phase-1-planning.md) | Slice 2 | Planning layer | Plans, specs, tasks, project overview, AI generation |
| [2](./phase-2-context-memory.md) | Slice 3 | Context + memory | Context packs, decisions, learnings, patterns, search |
| [3](./phase-3-agent-runs.md) | Slice 4 | Agent runs | Agent profiles, manual runs, timeline, events, learning extraction |
| [4](./phase-4-cursor-dispatch.md) | Slice 5 | Cursor cloud | Cursor integration, dispatch, external run tracking |
| [5](./phase-5-github.md) | Slice 6 | GitHub | GitHub App, repo connect, PR tracking, webhooks |
| [6](./phase-6-mcp.md) | Slice 7 | MCP server | Read-only resources/tools, scoped writes, tokens, audit |
| [7](./phase-7-cli-local-runner.md) | Slice 8 | CLI + local runner | CLI auth/commands, local Claude Agent SDK runner |

The **first meaningful demo** (spec §33) is reached at the end of Phase 3 for
manual runs, Phase 4 for Cursor — sign in → project → plan → spec → tasks →
context pack → run → PR → learning → pattern → reuse.

## Conventions (apply every phase)

- **Validation:** every API route and service input validated with Zod (spec §17.1).
- **Tenancy:** every app table carries `workspace_id`; project tables also carry
  `project_id` (spec §25.3). Every access check verifies workspace membership.
- **Immutability:** context packs sent to agents are never overwritten; run
  events are append-only; prefer soft delete / archive over hard delete.
- **Audit:** important mutations write an `activity_events` row; all agent writes
  are audited (spec §27).
- **IDs:** use `ulid`/`uuid` text PKs for app tables (sortable, agent-friendly),
  not serial — agents reference IDs across systems.
- **Verify each phase:** `npm run typecheck`, `npm run lint`, `npx drizzle-kit
  generate && migrate`, and exercise the acceptance criteria before moving on.

## Open questions to resolve before/while building

Spec §31 lists 15. Recommended defaults to unblock building (revisit later):

- **Personal-first, workspace-ready** — auto-create one personal workspace per
  user (§14.2); multi-workspace UI deferred.
- **Repo optional** — projects do not require a linked repo.
- **Markdown-first plans/specs/context packs** stored as structured rows with
  Markdown body fields; render with a Markdown editor.
- **Agents suggest, humans approve** — generated tasks land as `Backlog` drafts.
- **Private API + MCP first**, public API later. MCP before CLI is fine; CLI is
  a thin API wrapper (Phase 7).
- **Embeddings deferred** — Phase 2 search uses Postgres full-text + filters.
