# Phase 5 — GitHub integration

> Spec slice 6 (§32), spec §19. Goal: connect repositories via a GitHub App,
> track pull requests automatically, and link PRs back to tasks and runs through
> branch/metadata conventions and webhooks.

## Outcome / demo

Install the GitHub App on selected repos → link a repo to a project → a PR opened
from a `task/...` branch (or carrying hub metadata) auto-links to its task and
run → PR state (open/merged/closed) and checks reflect in the hub.

## Prerequisites

- Phase 3 (`pull_requests`, runs) and ideally Phase 4 done.
- A registered GitHub App (separate from the Phase 0 OAuth login app).

## Dependencies to add

```bash
npm i octokit @octokit/webhooks
```

## Tasks

### 1. Schema additions (spec §12.14, §25.2)

- `repositories` (provider, owner, name, full_name, url, default_branch,
  github_installation_id, workspace_id).
- Extend `projects.repository_id`; `pull_requests` already exists (Phase 3) —
  ensure provider/external_id/installation linkage.

### 2. GitHub App (`lib/github/`)

Spec §19.2 — App, not broad OAuth scopes:

- `app.ts` — Octokit App auth (app id, private key, installation tokens from env).
- Capabilities: select repos, read repo metadata, read PRs, receive webhooks,
  comment on PRs if permitted, create branches/PRs only if explicitly allowed
  (spec §19.2). Default to **read + comment**, no write without explicit opt-in.
- `installation.ts` — handle App installation callback; persist
  `github_installation_id` + accessible repos.

### 3. PR linking (`lib/github/linking.ts`)

Resolve PR → task/run via (spec §19.3), in priority order:

1. PR body metadata:
   ```html
   <!-- hub_task_id: TASK_ID -->
   <!-- hub_run_id: RUN_ID -->
   <!-- hub_project_id: PROJECT_ID -->
   ```
2. Branch naming convention: `task/{taskSlug}-{shortTaskId}`.
3. Manual linking fallback (Phase 3 UI).

Runners (Phase 4 Cursor, Phase 7 local) should emit branches/PR bodies in these
conventions so linking is automatic.

### 4. Webhooks (`app/api/webhooks/github/route.ts`)

Spec §19.4 events: PR opened/synchronized/closed/merged, check_run completed,
check_suite completed, issue_comment created.

- **Verify webhook signatures** (spec §26.3).
- Map events → `pull_requests` state updates + `agent_run_events` (PR opened/
  updated, checks passed/failed) + `activity_events`.
- Update task status when a linked PR merges/closes if configured (spec §31 Q12 —
  make it a setting, default on for linked tasks).

```
POST /api/webhooks/github
GET  /api/integrations   POST /api/integrations/github   DELETE /api/integrations/[id]
```

### 5. UI

- **Integrations settings**: install/connect GitHub App, pick repositories.
- **Project settings**: link a repository to the project.
- **PR tab / cards** (spec §23.5 run+task PR cards): live PR state, checks,
  branch, base — driven by webhooks.

## Acceptance criteria (spec §19, §28.6)

- [ ] Login still uses identity-only OAuth; repo access is via the App only
      (spec §19.1).
- [ ] Connect a repo to a project through the App.
- [ ] PR opened with hub metadata or `task/...` branch auto-links to task + run.
- [ ] Webhook signatures verified; PR opened/synced/closed/merged update hub state.
- [ ] Check pass/fail events appear on the run timeline.
- [ ] Manual PR-linking fallback still works.
- [ ] typecheck + lint clean; migrations apply.

## Notes

- Spec §31 Q13: GitHub App is **not** required before Cursor dispatch — Phase 4
  works with manual PR linking; this phase upgrades to automatic.
- Keep write capabilities (branch/PR creation) gated behind explicit user
  approval (spec §26.4).
