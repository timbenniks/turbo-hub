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

## Prerequisites

- Phases 0–3 complete (services for projects/specs/tasks/runs/context/memory).
  Phases 4–5 optional but make runs/PRs richer.

## Tasks

### 1. Schema additions (spec §12.20, §12.21, §25.2)

- `api_keys` (token_hash, scopes, expires_at, last_used_at, revoked_at — §12.20).
- `mcp_tokens` (token_hash, allowed_project_ids, allowed_tool_names, read_only,
  expires_at, last_used_at, revoked_at — §12.21).
- `audit_log` (or reuse `activity_events` with actor_type=agent) capturing actor,
  action, resource, timestamp, metadata, token id (spec §27.3).

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
       search_patterns find_related_projects  (+ generate_context_pack preview)
write: create_project update_project_status create_spec update_spec
       create_task update_task_status claim_task complete_task
       approve_context_pack start_agent_run update_agent_run_status
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

- **Settings → Tokens** (spec §26.4): create/list/revoke API keys and MCP tokens;
  per-token scopes, allowed projects, allowed tools, read-only flag, expiry.
- **Audit view**: list agent writes (actor, action, resource, token, time).

## Acceptance criteria (spec §28.8)

- [ ] MCP server exposes project and task resources.
- [ ] Read-only tools work under a read-only token; writes are denied for it.
- [ ] Scoped write tools work under a write token and respect project scope.
- [ ] MCP writes create audit events.
- [ ] Token scope/workspace/project checks enforced centrally; tokens are hashed,
      expirable, revocable.
- [ ] Idempotency keys honored on repeated writes; rate limits applied.
- [ ] MCP tools call the same services as the API (no duplicated DB logic).
- [ ] typecheck + lint clean; migrations apply.

## Notes

- Spec §31 Q15: MCP before CLI is the chosen order — CLI (Phase 7) wraps the same
  API/token machinery.
- Default posture is **read-only**; writes are opt-in and scoped (spec §15.5, §26.2).
