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

## Current repo status

Built as foundation:

- `integrations` table + settings UI store provider secrets encrypted at rest.
- `INTEGRATION_SECRET_KEY` is required when saving a secret.
- Projects can link a GitHub repository, and context packs include repo URL +
  default branch.

Built as foundation (also confirm before starting):

- **Runner interface + registry already exist**: `lib/runners/types.ts`
  (`Runner` with `createRun` / `getRunStatus` / `cancelRun`),
  `lib/runners/registry.ts`, and `lib/runners/manual.ts`. `lib/services/runs.ts`
  already calls `runner.createRun()` and stores `runnerType` +
  `external_runner_id`. So the Cursor adapter slots into an existing seam.
- `lib/crypto.ts` (AES-256-GCM) + `lib/services/integrations.ts` store the Cursor
  API key encrypted at rest; `agent_profiles` supports `cursor_cloud`.

Still to build for this phase:

- Cursor API client/runner adapter.
- Dispatch endpoint and task UI that require an approved context pack.
- Polling/webhook normalization into run events and PR attachment.

## Start here (tomorrow)

1. **`lib/runners/cursor.ts`** implementing the `Runner` interface, registered in
   `lib/runners/registry.ts`. `createRun` reads the Cursor key via
   `lib/services/integrations.ts` + `lib/crypto.ts` (decrypt server-side only),
   builds the prompt from the **approved context pack** body (already assembled
   deterministically in Phase 2), calls the Cursor API, and returns the external
   run id + initial status.
2. **Dispatch endpoint** — `POST /api/tasks/[taskId]/dispatch` with
   `{ runner: "cursor", contextPackId }`. Enforce the §20.3 order: pack must be
   **approved**, human-confirmed, then create the hub run and hand off to the
   runner. Reuse `createRun` in `lib/services/runs.ts`.
3. **Status normalization** — `getRunStatus` maps Cursor states → hub
   `agent_run_events` (status, branch, PR url, summary, errors). Drive it from a
   **Vercel cron** (`vercel.json`) hitting active Cursor runs, or a webhook if
   available (`/api/webhooks/cursor`, verify signature).
4. **UI** — task dispatch panel: runner picker includes Cursor when configured,
   shows the pack to be sent, confirm dialog; run page shows external id + live
   status (reuses the Phase 3 timeline).
5. **PR attach** — once Phase 5 is in, PRs auto-link via branch/metadata; until
   then the manual PR-link flow (Phase 3) covers it. Have the Cursor adapter emit
   `task/{slug}-{shortId}` branches + hub metadata in the PR body so Phase 5
   linking is automatic.

Keep **all** Cursor-specific logic inside `lib/runners/cursor.ts` — the core
dispatch service calls `runner.createRun`, never the Cursor API directly.

## Tasks

### 1. Schema additions

- [x] `integrations` table (spec §25.2): provider (cursor/github/...),
      workspace_id, config, **encrypted secrets** (spec §26.3 — encrypt the
      Cursor API key at rest; never expose to client).
- Reuse `agent_profiles` (type `cursor_cloud`) and `agent_runs.external_runner_id`.

### 2. Secrets handling (`lib/crypto.ts`)

- [x] Symmetric encryption helper (key from env, e.g.
      `INTEGRATION_SECRET_KEY`) for integration secrets at rest.
- [ ] Decrypt only server-side at dispatch time once the Cursor runner exists.
- [ ] Redact secrets from runner logs/events.

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

1. Assemble context pack → 2. user reviews/approves → 3. create hub run →
2. send to Cursor → 5. store external id → 6. mark queued/running →
3. poll/receive updates → 8. attach PR → 9. update task status →
4. extract learning.

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
