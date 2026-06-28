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

## Current repo status

Status: **complete and manually validated (2026-06-28)**.

Built:

- `repositories` table with workspace/provider/full-name uniqueness.
- `projects.repository_id` and `pull_requests.repository_id` now reference
  repositories.
- Project overview can link a GitHub repository by URL.
- Manual PR linking parses GitHub PR URLs, stores repo + PR number metadata, and
  auto-links the project to the repo if it was not already linked.
- Project PR tab displays repository-aware PR rows.
- GitHub App backend foundation exists: Octokit App helpers,
  `POST /api/webhooks/github` with `X-Hub-Signature-256` verification,
  `pull_request` webhook normalization, hub metadata/branch linking, and
  service-level PR upsert into the existing PR/run timeline model.
- GitHub App installation flow exists: Settings links to
  `/api/integrations/github/install`, callback verifies signed state, authenticates
  as the installation, syncs accessible repositories into `repositories`, and
  stores installation metadata in the GitHub integration config.
- Project repository linking can now pick from installed repositories as well as
  accept a pasted GitHub URL.
- `check_run` and `check_suite` webhooks are normalized into run timeline check
  events for linked PRs. Merged linked PRs mark their task done.
- GitHub App lifecycle hardening exists: installation delete/suspend/unsuspend
  and repository add/remove webhooks update integration status and installed repo
  availability.
- Settings shows the installed repository list and provides an explicit GitHub
  repository resync action.
- PR/check webhooks now skip repository records tied to a different GitHub App
  installation, and only backfill installation IDs on older unassigned records.

Optional future polish:

- Optional polish: issue-comment handling for bot commands/comments, explicit
  user settings for merge-to-task-done behavior, and branch/PR creation if the
  app is ever granted write permissions.

## Resume notes

Last shipped commit: `6b11c94 feat(github): harden app integration lifecycle`.

Manual validation used project `dx readme doctor` and repo
`timbenniks/dx-readme-doctor`:

- Installed the GitHub App and synced repositories.
- Linked the installed repo to the project.
- Opened PR `#2` with hub metadata:
  ```html
  <!-- hub_project_id: 01KW4B6Z026PHTZRHYCQV8KQYK -->
  <!-- hub_task_id: 01KW6MWNA8ESC385WMG6WZ4X9T -->
  <!-- hub_run_id: 01KW6MZJ1GFDSR4V6KFD4RQ1YZ -->
  ```
- Verified PR open/synchronize/merge events in the run timeline.
- Verified check webhooks reach the run timeline.
- Verified merging the linked PR marked task `01KW6MWNA8ESC385WMG6WZ4X9T` done.

Known historical artifact: one old timeline event was recorded as
`check_failed` while `conclusion` was `null`; this was fixed after the test.
Future pending/requested checks become `status_update`.

No core Phase 5 work remains. Continue with
[Phase 4 Cursor cloud](./phase-4-cursor-dispatch.md).

## Dependencies to add

```bash
npm i octokit @octokit/webhooks
```

## Tasks

### 1. Schema additions (spec §12.14, §25.2)

- [x] `repositories` (provider, owner, name, full_name, url, default_branch,
      github_installation_id, workspace_id).
- [x] Extend `projects.repository_id` and `pull_requests.repository_id`.
- [x] Persist GitHub App installation metadata from a real installation flow.

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

- **Integrations settings**: secret storage exists; install/connect GitHub App
  and repo picker remain.
- [x] **Project overview**: link a repository to the project.
- **PR tab / cards** (spec §23.5 run+task PR cards): repository-aware manual PR
  rows exist; live PR state, checks,
  branch, base — driven by webhooks.

## Acceptance criteria (spec §19, §28.6)

- [x] Login still uses identity-only OAuth; repo access is via the App only
      (spec §19.1).
- [x] Connect a repo to a project through the App.
- [x] PR opened with hub metadata or `task/...` branch auto-links to task + run.
- [x] Webhook signatures verified; PR opened/synced/closed/merged update hub state.
- [x] Check pass/fail events appear on the run timeline.
- [x] Manual PR-linking fallback still works.
- [x] typecheck + lint clean; migrations apply.

## Notes

- Spec §31 Q13: GitHub App is **not** required before Cursor dispatch — Phase 4
  works with manual PR linking; this phase upgrades to automatic.
- Keep write capabilities (branch/PR creation) gated behind explicit user
  approval (spec §26.4).
