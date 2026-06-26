# Phase 1 — Planning layer

> Spec slice 2 (§32). Goal: turn a project into intent → plan → specs → tasks,
> with AI assist for generation. Fills the project Overview/Plan/Specs/Tasks tabs.

## Outcome / demo

Open a project → generate a plan from an idea prompt → edit & mark active →
create a spec (manual or generated from plan) → mark spec ready → generate tasks
from the spec → open a task page. (Demo steps 3–6 of spec §33.)

## Prerequisites

- Phase 0 complete (auth, services, projects, activity feed).

## Dependencies to add

```bash
npm i ai @ai-sdk/react zod
# Models via Vercel AI Gateway with plain "provider/model" strings (no provider pkg).
```

AI key: set `AI_GATEWAY_API_KEY` (or rely on Vercel OIDC in deploy). Default to a
current Claude model id through the gateway for structured generation.

## Tasks

### 1. Schema additions (`db/schema.ts`)

Per spec §12.6–§12.9, §25.2:

- `plans` (status: draft/active/superseded/archived, `version`, body fields:
  summary, goals, non_goals, constraints, milestones, open_questions — Markdown
  or `jsonb`).
- `specs` + `spec_versions` (immutable version snapshots; status: draft/ready/
  in_progress/implemented/superseded/archived). Spec body fields per §12.7.
- `tasks` (status, priority, assignee_type, runner_preference, acceptance_criteria,
  context_notes, branch_name, pull_request_id, parent_task_id, spec_id — §12.8).
- `task_dependencies` (depends_on_task_id, type: blocks/related/duplicates/
  supersedes — §12.9).
- Add `current_plan_id` FK to `projects`.

Generate + migrate.

### 2. Services (`lib/services/`)

- `plans.ts` — list/get/create/update, `markActive` (supersedes prior active
  plan), `generatePlanFromIdea(projectId, prompt)`.
- `specs.ts` — CRUD, `versionSpec` (snapshot into `spec_versions`), `markReady`,
  `generateSpecFromPlan(planId)`, `generateTasksFromSpec(specId)`.
- `tasks.ts` — CRUD, subtasks, `addDependency`, `setStatus`, `setAssignee`,
  `setRunnerPreference`.
- All mutations record activity events.

### 3. AI generation (`lib/ai/`)

Use Vercel AI SDK `generateObject` with **Zod output schemas** (spec §22.2) —
structured, not freeform, so results map onto rows.

- `lib/ai/schemas.ts` — Zod schemas for Plan, Spec, TaskList (mirror §11.2,
  §11.3, §11.4).
- `lib/ai/generate.ts` — `generatePlan`, `generateSpec`, `generateTasks`.
- All generated content lands as **editable drafts requiring human approval**
  (spec §30.1 mitigation; §31 Q10/Q11 default = suggest, don't auto-commit).

### 4. API routes (spec §17.2)

```
GET/POST   /api/projects/[projectId]/plans
GET/PATCH  /api/plans/[planId]
GET/POST   /api/projects/[projectId]/specs
GET/PATCH  /api/specs/[specId]
POST       /api/specs/[specId]/generate-tasks
GET/POST   /api/projects/[projectId]/tasks
GET/PATCH  /api/tasks/[taskId]
```

Plan/spec generation can be a server action or a `POST .../plans?generate=1`
variant — keep generation behind explicit user intent.

### 5. UI

- **Project Overview tab** (spec §23.4): header, status/health, tags, current
  goal, active plan summary, open tasks, suggested actions. Wire real data.
- **Plan tab / editor** (spec §13.3): create manually or "Generate from idea"
  prompt box; edit (Markdown); mark active; supersede; show open questions &
  assumptions.
- **Specs tab** (§13.4): list, create, "Generate from plan", edit, version, mark
  ready, "Generate tasks". Use the spec template fields.
- **Tasks tab** (§13.5): list/board by status; create/edit; subtasks;
  dependencies; assignee + runner preference. Use TanStack Table for the list.
- **Task page** (`/projects/[slug]/tasks/[taskId]`, spec §23.5): header, status,
  acceptance criteria, related spec, dependencies, activity. Context-pack/runs/PR
  sections are placeholders until Phase 2/3.

## Acceptance criteria (spec §28.3, §28.4)

- [ ] Create/edit a spec; link spec to project; mark spec ready.
- [ ] Generate a plan from an idea prompt; edit and mark active (supersedes prior).
- [ ] Generate tasks from a spec; they appear as editable `Backlog` drafts.
- [ ] Create task, subtasks, dependencies; update status; link to spec; add
      acceptance criteria.
- [ ] Specs are versioned (snapshot on change).
- [ ] All generation produces editable drafts, never auto-published.
- [ ] typecheck + lint clean; migrations apply.

## Notes

- Keep generation prompts/schemas in `lib/ai/` so Phase 2 context packs and
  Phase 3 run summaries reuse the same patterns.
- Markdown-first bodies (per README defaults) keep editing simple and diffable.
