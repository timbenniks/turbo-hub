# Phase 6 — MCP server

> Spec slice 7 (§32), spec §16. Goal: expose the hub to coding agents through an
> MCP server — read-only resources and tools first, then scoped write tools with
> token auth and audit logging. MCP is an **adapter over the existing domain
> services**, never a parallel implementation (spec §15.1, §16.1, §34.6).

## Outcome / demo

An agent with a scoped MCP token can list/read projects, specs, tasks,
decisions, learnings, and search patterns; with a write-scoped token it can claim
a task, create a run, append events, attach a PR, and add a learning — every
write audited and scope-checked.

> **Status: COMPLETE (2026-06-27).** `/api/mcp` wraps the domain services for
> projects, planning, context/memory, runs, PRs, search, agent profiles,
> repositories, and integrations. `thub_` tokens are hashed, revocable,
> expirable, and carry coarse `api:*` / `mcp:*` scopes. Hardening shipped:
>
> - **Per-project + per-tool allowlists** on each token (`api_keys.allowed_project_ids`,
>   `allowed_tool_names`; null/empty = unrestricted), enforced centrally.
> - **Rate limiting** (per-token, per-minute) and **idempotency** (identical
>   repeated writes coalesced within a short TTL) in the central guard.
> - **Agent audit log**: every MCP write records an `activity_events` row with
>   `actor_type = "agent"`, the token id, tool name, and safe arg keys; surfaced
>   in Settings → Agent audit log.
>
> Design choices (deviations from the spec's literal shape, kept pragmatic):
>
> - **No separate `mcp_tokens` table** — the fields were folded into `api_keys`
>   to avoid a parallel token store. Revisit only if API and MCP tokens need to
>   diverge.
> - **Read-only mode is scope-based** (`mcp:read` without `mcp:write`) rather than
>   a dedicated `read_only` column.
> - **Audit reuses `activity_events`** (actor_type=agent) rather than a dedicated
>   `audit_log` table.
> - The rate limiter / idempotency cache are **in-memory per serverless instance**
>   — a best-effort safety net, not a distributed quota. Move to Postgres/Redis if
>   strict cross-instance limits are needed.
>
> Enforcement lives in `lib/mcp/guard.ts` (wraps `registerTool` once in
> `app/api/mcp/route.ts`), so no per-tool changes are required and new tools are
> covered automatically.

## Prerequisites

- Phases 0–3 complete (services for projects/specs/tasks/runs/context/memory).
  Phases 4–5 optional but make runs/PRs richer.

## Tasks

### 1. Schema additions (spec §12.20, §12.21, §25.2)

- [x] `api_keys` (token_hash, scopes, expires_at, last_used_at — §12.20).
- [x] MCP allowlists (§12.21): `api_keys.allowed_project_ids` +
      `allowed_tool_names` (folded into `api_keys` instead of a separate
      `mcp_tokens` table; read-only is scope-based).
- [x] Audit via `activity_events` with `actor_type=agent` + token id in metadata
      (spec §27.3) — no separate `audit_log` table.

### 2. Token services (`lib/services/tokens.ts`)

- Create/list/revoke API keys and MCP tokens. **Hash tokens** (spec §26.2); show
  the plaintext once on creation only.
- `authenticateMcpToken(raw)` → resolves token, checks expiry/revocation,
  returns scope context (workspace, allowed projects, allowed tools, read-only).
- Creating a write-capable token requires human approval (spec §26.4).

### 3. MCP server (`lib/mcp/` + route)

Expose over an MCP-compatible HTTP endpoint (e.g. `app/api/mcp/[...]/route.ts`).

**Resources** (spec §16.2):
```
project://{projectId}/overview | plan | specs | tasks | decisions | learnings | patterns
task://{taskId}/execution-brief | context-pack
run://{runId}/status
workspace://{workspaceId}/patterns
```

**Tools** (spec §16.3) — each is a thin wrapper calling the same domain service
the API uses:
```
read:  list_projects get_project list_specs get_spec list_tasks get_task
       search_patterns find_related_projects  (+ context resources)
write: create_project update_project_status create_spec update_spec
       create_task update_task_status claim_task complete_task
       assemble_context_pack approve_context_pack start_agent_run update_agent_run_status
       append_agent_run_event attach_pull_request_to_run complete_agent_run
       fail_agent_run create_decision create_learning promote_learning_to_pattern
```

### 4. Safety enforcement (spec §16.4, §16.5)

Every tool call enforces, in order: authentication → token scopes → workspace
access → project access (against `allowed_project_ids`) → input validation (Zod)
→ idempotency for repeated writes → rate limits → audit log entry → clear errors.

- **Read-only mode** (spec §16.5): read-only tokens allow all `read:` tools +
  context preview; deny every create/update/start/attach/delete. Enforce centrally
  in the tool dispatcher, not per-tool.

### 5. UI

- [x] **Settings → API keys** (spec §26.4): create/list/revoke tokens with
      per-token scopes, allowed projects (checkboxes), allowed tools (names),
      and expiry. Read-only = grant `mcp:read` without `mcp:write`.
- [x] **Audit view**: Settings → Agent audit log lists agent writes (tool,
      token, time) from `activity_events`.

## Acceptance criteria (spec §28.8)

- [x] MCP server exposes project/task tools over HTTP.
- [x] Read-only tools work under an `mcp:read` token; writes are denied without
      `mcp:write`.
- [x] Scoped write tools work under a write token.
- [x] MCP writes create activity events through the shared services.
- [x] Project/tool allowlists are enforced (central guard; null/empty = all).
- [x] Tokens are hashed, expirable, revocable, and last-used updates are
      throttled.
- [x] Idempotency honored on repeated identical writes; rate limits applied
      (in-memory, per instance).
- [x] MCP tools call the same services as the API (no duplicated DB logic).
- [x] typecheck + lint clean; migration `0010_famous_tag.sql` applies.

## Notes

- Spec §31 Q15: MCP before CLI is the chosen order — CLI (Phase 7) wraps the same
  API/token machinery.
- Default posture is **read-only**; writes are opt-in and scoped (spec §15.5, §26.2).
