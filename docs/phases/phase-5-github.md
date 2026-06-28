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

Built as foundation:

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

Still to build for this phase:

- GitHub App install management polish: uninstall/suspend webhook handling,
  explicit resync, and showing which repos are currently available.
- Installation-aware repository matching everywhere. Repos now store installation
  IDs after install sync, but PR webhook matching still starts from repository
  full name and then refreshes installation ID.

## Start here (tomorrow)

Concrete first steps, smallest shippable slices first:

1. **Deps + env.** `npm i octokit @octokit/webhooks`. Add env:
   `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`,
   `GITHUB_APP_CLIENT_ID/SECRET`. Register a **GitHub App** (separate from the
   Phase 0 OAuth login app) with permissions: repo metadata (read), pull
   requests (read/write-for-comment), checks (read); subscribe to `pull_request`,
   `check_run`, `check_suite`, `issue_comment`.
2. **`lib/github/app.ts`** — Octokit App + per-installation client helpers
   (`appOctokit()`, `installationOctokit(installationId)`). No DB logic here.
3. **Webhook receiver** — `app/api/webhooks/github/route.ts` using
   `@octokit/webhooks` `verify()` against `GITHUB_APP_WEBHOOK_SECRET` (raw body;
   remember Next route handlers need `await req.text()` before parsing). Start by
   handling **`pull_request`** only: upsert the PR via the existing
   `pullRequests` service, then map state → `agent_run_events` + `activity_events`.
4. **`lib/github/linking.ts`** — resolve PR → task/run in priority order: (1) PR
   body metadata `<!-- hub_task_id: … -->` / `hub_run_id` / `hub_project_id`,
   (2) branch convention `task/{slug}-{shortId}`, (3) existing manual link.
   Reuse `lib/github/pull-request-url.ts` for owner/repo/number parsing.
5. **Installation flow** — `app/api/integrations/github/*` callback that stores
   `github_installation_id` + accessible repos on `repositories`; repo picker in
   Settings → Integrations (secret storage already exists).
6. **Checks + close/merge** — extend the webhook to `check_run`/`check_suite`
   (timeline events) and `pull_request.closed`/merged (PR state + optional task
   status update, default on for linked tasks).

Ship 1–4 first: that alone gives automatic PR linking + state sync for any
runner's output, which is the highest-leverage piece.

## Dependencies to add

```bash
npm i octokit @octokit/webhooks
```

## Tasks

### 1. Schema additions (spec §12.14, §25.2)

- [x] `repositories` (provider, owner, name, full_name, url, default_branch,
      github_installation_id, workspace_id).
- [x] Extend `projects.repository_id` and `pull_requests.repository_id`.
- [ ] Persist GitHub App installation metadata from a real installation flow.

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
