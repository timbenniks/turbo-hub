# Build phases — Agent-native project hub

> **Update (2026-06-27): no in-app LLM.** All server-side AI generation was
> removed (Vercel AI Gateway/SDK, provider packages, the `lib/ai/` helpers, the
> `/generate` routes, and the old "Generate" UI buttons). Content is hand-filled,
> written by a local model through the **MCP tools**, or pasted in via the
> external-agent flow. Context packs assemble deterministically. Anywhere the
> phase docs below say "generate" / "AI-assisted", read it through that lens.
> Also note the build order diverged from the list below: **Phase 6 (MCP server +
> `thub_` API tokens) shipped early**, **Phase 2 is largely built**, and
> **Phase 3 is built in manual-runner form**. Later phases still harden and
> automate the runner/PR story.

This directory slices [`docs/spec.md`](../spec.md) into ordered, shippable phases.
Each phase doc is self-contained: goal, prerequisites, task checklist, files to
touch, and acceptance criteria. Build them in order. Each phase ends in a
demoable, deployable state.

## Where we are now

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
  tabs, manual + MCP-driven plan/spec/task authoring, editable drafts, spec versioning,
  task dependencies/subtasks, and task activity display.
- Context + memory layer: deterministic context-pack assembly, decisions,
  learnings, reusable patterns, pattern search, project memory tabs, task
  context-pack panel, and top-level Patterns page.
- Manual agent-run layer: agent profiles, task run dispatch, run timelines,
  run completion/failure/cancel flows, project/top-level run lists, manual PR
  linking, and learning capture.
- Repository/integration foundation: workspace repositories, project-to-repo
  linking, GitHub PR URL parsing, repository-aware PR lists, encrypted
  integration secret storage, and repo metadata in context packs.
- MCP adapter: `/api/mcp` exposes tools over the same domain services used by
  the UI/API. `thub_` API keys are hashed, revocable, expirable, and scoped for
  API/MCP read/write. MCP mutating tools require `mcp:write`.

Current gate: `npm run typecheck`, `npm run lint`, `npx drizzle-kit check`, and
`npm run build` must pass before moving into the next phase.

Still not present or intentionally incomplete:

- Real external runner adapters: Cursor cloud (Phase 4) and local Claude/CLI
  runner (Phase 7) are not implemented.
- Full GitHub App/webhooks (Phase 5) are not implemented. Repositories can be
  linked manually and GitHub PR URLs populate repository/PR metadata, but there
  is no App installation flow, webhook signature verification, check tracking,
  or automatic PR sync yet.
- Integration secrets can be stored encrypted with `INTEGRATION_SECRET_KEY`, but
  the Cursor and GitHub adapters that consume those secrets are not implemented.
- MCP/API token hardening is simplified compared with the full spec: there are
  coarse read/write scopes and expiry, but no per-project allowlist, per-tool
  allowlist, rate limits, idempotency keys, or dedicated audit-log table yet.
- Learning extraction is manual/human-approved. The hub stores learnings; it
  does not call an in-app model to draft them.

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

| Phase                              | Spec slice | Theme              | Outcome                                                                |
| ---------------------------------- | ---------- | ------------------ | ---------------------------------------------------------------------- |
| [0](./phase-0-foundation.md)       | Slice 1    | Foundation         | Auth, schema, workspace bootstrap, project CRUD, tags, dashboard       |
| [1](./phase-1-planning.md)         | Slice 2    | Planning layer     | Plans, specs, tasks, project overview (hand-filled / MCP / paste)      |
| [2](./phase-2-context-memory.md)   | Slice 3    | Context + memory   | Context packs, decisions, learnings, patterns, search                  |
| [3](./phase-3-agent-runs.md)       | Slice 4    | Agent runs         | Agent profiles, manual runs, timeline, events, manual learning capture |
| [4](./phase-4-cursor-dispatch.md)  | Slice 5    | Cursor cloud       | Cursor integration, dispatch, external run tracking                    |
| [5](./phase-5-github.md)           | Slice 6    | GitHub             | GitHub App, repo connect, PR tracking, webhooks                        |
| [6](./phase-6-mcp.md)              | Slice 7    | MCP server         | Read-only resources/tools, scoped writes, tokens, audit                |
| [7](./phase-7-cli-local-runner.md) | Slice 8    | CLI + local runner | CLI auth/commands, local Claude Agent SDK runner                       |

The **first meaningful demo** (spec §33) is reached at the end of Phase 3 for
manual runs, Phase 4 for Cursor — sign in → project → plan → spec → tasks →
context pack → run → PR → learning → pattern → reuse. The manual-runner version
of that path is now the current smoke-test target.

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
