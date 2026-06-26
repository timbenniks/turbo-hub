# Phase 7 — CLI + local Claude runner

> Spec slice 8 (§32), spec §18 + §21. Goal: a thin CLI over the API for humans
> and agents, plus a local runner that executes tasks against local repos using
> the Claude Agent SDK and reports back to the hub.

## Outcome / demo

`hub login` → `hub projects list` → `hub tasks claim <id>` →
`hub context generate <task-id>` → `hub runs start <task-id> --runner claude-local`
→ the local runner executes Claude Agent SDK against the repo, streams events to
the hub, and attaches a branch/summary/learnings.

## Prerequisites

- Phase 6 complete (API keys / MCP tokens, scoped auth, audit). The CLI is a thin
  wrapper over the same API (spec §18).

## Part A — CLI

### Tasks

- New workspace package (`cli/` or a separate repo) — Node CLI (e.g. `commander`
  + `zod`). Distributed as `hub`.
- **Auth** (spec §18.3): `hub login` (device/browser flow or paste API key),
  `hub logout`, `hub whoami`; store token in OS keychain/config; workspace
  selection.
- **Commands** (spec §18.2) — each maps to an API route:
  ```
  projects: list | create | show <id> | update <id>
  tasks:    list --project <id> | show <id> | create --project <id>
            claim <id> | status <id> <status> | complete <id>
  context:  generate <task-id> | show <context-pack-id>
  runs:     start <task-id> --runner <type> | show <id> | event <id> | complete <id> | fail <id>
  patterns: search "<q>" | create | apply <id> --task <task-id>
  auth:     login | logout | whoami
  ```
- Output: human table view + `--json` for agent consumption.

### Acceptance criteria

- [ ] `hub login` authenticates via API key / token; `hub whoami` confirms.
- [ ] Project/task/context/run/pattern commands hit the API and respect token scopes.
- [ ] `--json` output for scripting/agents.
- [ ] CLI holds no business logic — pure API wrapper (spec §18).

## Part B — Local Claude runner

> Spec §21. A runner adapter (like Cursor) but executing locally.

### Tasks

- `lib/runners/claude-local.ts` implementing the `Runner` interface (spec §15.4),
  registered in the runner registry from Phase 3.
- Runtime shape (spec §21.2): start as a CLI command (`hub runs start ... --runner
  claude-local` or a dedicated `hub-runner`); daemon/desktop later.
- **Flow** (spec §21.3):
  1. Authenticate runner with hub API key.
  2. Fetch task + **approved context pack** from the hub.
  3. Run Claude Agent SDK locally against the repo.
  4. Stream run status + events back (`POST /api/runs/[runId]/events`).
  5. Attach branch (`task/{slug}-{shortId}`), summary, learnings.
- **Constraints** (spec §21.4): ask approval before destructive ops; respect
  project-level commands; log events back; allow cancellation; **never leak
  secrets into logs**; store the exact context pack used (immutable, Phase 2).

### Dependencies

```bash
npm i @anthropic-ai/claude-agent-sdk   # in the runner package
```

Use a current Claude model id; the runner reads its Anthropic key from the local
environment, not from the hub.

### Acceptance criteria (spec §21)

- [ ] Runner authenticates with a hub API key and fetches a task + context pack.
- [ ] Runner executes Claude Agent SDK against a local repo.
- [ ] Run status and events stream back to the hub timeline.
- [ ] Branch, summary, and learnings attach to the run.
- [ ] Destructive operations prompt for approval; cancellation works; no secrets
      in logs.
- [ ] The exact context pack used is stored immutably.

## Notes

- CLI and local runner share the Phase 6 token model — scope the runner's key to
  the minimum (read context + write run status/events/PR + add learning;
  spec §15.5).
- Both are adapters over the durable API contract (spec §34.7) — the hub stays
  the system of record.
