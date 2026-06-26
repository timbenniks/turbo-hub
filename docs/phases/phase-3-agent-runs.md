# Phase 3 — Agent run layer

> Spec slice 4 (§32). Goal: track the full lifecycle of an agent attempt against
> a task — profiles, runs, append-only timeline, completion/failure, and learning
> extraction. Completes the **manual-runner** end-to-end demo (spec §33).

## Outcome / demo

From a task with an approved context pack → start a manual run → run gets a
status + timeline → append events (status updates, file change, PR opened) →
attach a PR → mark complete → extract a learning → promote to pattern. The
runner abstraction here is what Phase 4 (Cursor) and Phase 7 (local Claude) plug
into.

## Prerequisites

- Phase 2 complete (context packs attachable to runs; learnings/patterns exist).

## Tasks

### 1. Schema additions (spec §12.10–§12.13, §25.2)

- `agent_profiles` (type: cursor_cloud/claude_local/manual/custom_api; capabilities;
  default_model; configuration jsonb; is_active — §12.10).
- `agent_runs` (status: created/queued/running/waiting_for_input/
  waiting_for_review/completed/failed/canceled; runner_type; external_runner_id;
  prompt; context_pack_id; branch_name; pull_request_id; summary; error;
  started_at/completed_at — §12.11).
- `agent_run_events` — **append-only** (type per §12.12; title, body, metadata
  jsonb, created_at). No update/delete.
- `pull_requests` (provider, external_id, number, title, url, state:
  open/draft/merged/closed, branch, base_branch, links to project/task/run —
  §12.13). Manual creation now; webhook-driven in Phase 5.

Generate + migrate.

### 2. Runner abstraction (`lib/runners/`)

Define the interface every runner implements (spec §15.4):

```ts
type Runner = {
  type: string;
  createRun(input: CreateRunInput): Promise<CreateRunResult>;
  getRunStatus(externalId: string): Promise<RunStatusResult>;
  cancelRun(externalId: string): Promise<void>;
};
```

- `lib/runners/types.ts` — the interface + normalized event types (map to
  `agent_run_events` types).
- `lib/runners/manual.ts` — the first runner: `createRun` just creates the hub
  run record; status/events are driven by user/API calls. No external system.
- `lib/runners/registry.ts` — resolve a runner by type. Cursor (Phase 4) and
  Claude local (Phase 7) register here later.

### 3. Services

- `runs.ts` — `createRun`, `startRun`, `updateRunStatus`, `appendEvent`
  (append-only), `attachPullRequest`, `attachArtifact`, `completeRun`, `failRun`,
  `cancelRun`. Every event also writes an `activity_events` row (spec §27.1).
- `pullRequests.ts` — create/link/update PR; manual linking now.
- `runs.ts#extractLearning(runId)` — AI-assisted (reuse `lib/ai/`): asks the §11.9
  questions (what worked/failed/repeat/avoid/reusable/conventions) and drafts a
  `learnings` row for human approval.

### 4. API routes (spec §17.2)

```
GET    /api/projects/[projectId]/runs
POST   /api/tasks/[taskId]/runs
GET    /api/runs/[runId]
PATCH  /api/runs/[runId]
POST   /api/runs/[runId]/events       # append-only
POST   /api/runs/[runId]/complete
POST   /api/runs/[runId]/fail
GET    /api/projects/[projectId]/pull-requests
POST   /api/runs/[runId]/pull-requests
PATCH  /api/pull-requests/[pullRequestId]
```

These write endpoints are the same ones MCP tools (Phase 6) and the CLI/local
runner (Phase 7) will call — design them agent-friendly: idempotency keys on
writes (spec §17.1, §26.2), clear errors.

### 5. UI

- **Run page** (`/runs/[runId]`, spec §23.6, §13.6): status header, runner
  details, task link, context pack link, **timeline**, PR card, summary, error
  state, learning-extraction panel.
- **Task page: dispatch panel + run timeline** (spec §23.5): "Start run" picks a
  runner (manual only this phase) using the approved context pack; lists runs.
- **Runs (top-level nav)**: list active/recent runs across projects (dashboard
  "active runs" card, spec §23.3 — wire it up now).
- Task status reflects run lifecycle (running → in review → done).

## Acceptance criteria (spec §28.6)

- [ ] Start a manual run from a task with an approved context pack.
- [ ] Run has a status and an append-only timeline of events.
- [ ] Append events via API; events cannot be edited/deleted.
- [ ] Attach a PR to a run (manual link).
- [ ] Complete or fail a run; status + task status update accordingly.
- [ ] Extract a learning from a completed run (AI draft, human-approved) and
      promote it to a pattern.
- [ ] Run mutations create activity events.
- [ ] typecheck + lint clean; migrations apply.

## Notes

- Get the runner interface right — it is the seam for all future runners
  (spec §15.1: don't build around one vendor; §30.2 mitigation).
- Idempotency on `/events` and status writes matters once real agents retry.
- **End of this phase = the §33 demo works with the manual runner.**
