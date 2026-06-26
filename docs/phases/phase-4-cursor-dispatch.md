# Phase 4 — Cursor cloud dispatch

> Spec slice 5 (§32), spec §20. Goal: dispatch a task to the Cursor Cloud Agent
> as the first real cloud runner, store its external run id, track status, and
> attach the resulting PR. Proves the runner abstraction with a second adapter.

## Outcome / demo

Add a Cursor API key in integration settings → on a task, dispatch to Cursor →
hub creates a run, sends prompt + repo config, stores external Cursor run id →
status flows queued → running → completed → PR attached → learning extracted.

## Prerequisites

- Phase 3 complete (runner interface, runs, events, PR linking).
- A repo associated with the project (manual repo metadata is fine; full GitHub
  App is Phase 5).

## Tasks

### 1. Schema additions

- `integrations` table (spec §25.2): provider (cursor/github/...), workspace_id,
  config, **encrypted secrets** (spec §26.3 — encrypt the Cursor API key at rest;
  never expose to client).
- Reuse `agent_profiles` (type `cursor_cloud`) and `agent_runs.external_runner_id`.

### 2. Secrets handling (`lib/crypto.ts`)

- Symmetric encryption helper (key from env, e.g. `INTEGRATION_SECRET_KEY`) for
  integration secrets at rest. Decrypt only server-side at dispatch time. Redact
  secrets from any stored logs/events (spec §26.3).

### 3. Cursor runner (`lib/runners/cursor.ts`)

Implement the `Runner` interface (spec §15.4, §20):

- `createRun` — build the Cursor prompt from the **approved context pack** with
  the §20.4 structure (task title/description, project summary, spec excerpt,
  acceptance criteria, repo setup, commands, relevant patterns, guardrails,
  expected PR + update format). Call Cursor API, store `external_runner_id`, set
  status `queued`/`running` (spec §20.3).
- `getRunStatus` — poll Cursor; normalize into hub run events (spec §20.5: status,
  branch, PR url, summary, errors).
- `cancelRun`.
- Register in `lib/runners/registry.ts`.

### 4. Dispatch flow (services + API)

Spec §20.3 ordered flow, enforced server-side:

1. Generate context pack → 2. user reviews/approves → 3. create hub run →
4. send to Cursor → 5. store external id → 6. mark queued/running →
7. poll/receive updates → 8. attach PR → 9. update task status →
10. extract learning.

```
POST   /api/tasks/[taskId]/dispatch        # body: { runner: "cursor", contextPackId }
GET    /api/integrations   POST /api/integrations/cursor   DELETE /api/integrations/[id]
POST   /api/webhooks/cursor                # if/when Cursor supports push updates
```

- **Human approval required before dispatch** (spec §26.4) — dispatch is an
  explicit confirmed action, never automatic.
- Polling: a lightweight scheduled job / Vercel cron hitting `getRunStatus` for
  active Cursor runs (spec §20.3 step 7), or webhook if available.

### 5. UI

- **Integrations settings** (`/settings/integrations`, spec §13.11): add/remove
  Cursor API key (masked input, stored encrypted), show connection status.
- **Task dispatch panel**: runner picker now includes Cursor (when configured);
  shows the context pack that will be sent; confirm dialog before dispatch.
- **Run page**: show Cursor external id, live status, branch, PR — reuse the
  Phase 3 timeline; events come from polling/webhook normalization.

## Acceptance criteria (spec §28.6)

- [ ] User can configure a Cursor API key; it is encrypted at rest, never sent to
      the client.
- [ ] Dispatch requires the §20.3 flow: approved context pack → confirm → run.
- [ ] Hub creates a run and stores the external Cursor run id.
- [ ] Run status tracks queued/running/completed/failed.
- [ ] PR attaches to the run (manual or auto) and links to the task.
- [ ] Learning can be extracted after completion.
- [ ] Cursor-specific logic lives only in `lib/runners/cursor.ts` (no leakage
      into core services).
- [ ] typecheck + lint clean; migrations apply.

## Notes

- Keep provider logic isolated (spec §15.1, §30.2): the core dispatch service
  calls `runner.createRun`, not Cursor directly.
- Validate webhook signatures if Cursor supports them (spec §26.3).
- This is spec §31 Q5 (Cursor v1 vs v1.5) — sequenced after manual runs so the
  demo already works without it.
