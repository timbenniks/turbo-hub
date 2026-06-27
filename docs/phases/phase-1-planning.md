# Phase 1 — Planning layer

> Spec slice 2 (§32). Goal: turn a project into intent → plan → specs → tasks.
> Fills the project Overview/Plan/Specs/Tasks tabs.
>
> **No in-app AI** (see the note in [README](./README.md) and the spec banner):
> plans/specs/tasks are hand-filled in the web forms, written by a local model
> through the MCP tools, or pasted in via the external-agent flow. The hub makes
> no model calls.

## Outcome / demo

Open a project → add a plan (web form, MCP `create_plan`, or paste a model's
Markdown reply) → edit & mark active → create a spec → mark spec ready → add
tasks (form or MCP) → open a task page. (Demo steps 3–6 of spec §33.)

## Prerequisites

- Phase 0 complete (auth, services, projects, activity feed).

## Dependencies to add

```bash
npm i zod
```

No AI SDK or model provider. Markdown bodies are parsed/serialized in-app
(`lib/plan-import.ts`, `lib/markdown.ts`) — pure string handling, no model.

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

- `plans.ts` — list/get/create/update/delete, `markActive` (supersedes prior
  active plan). Markdown import via `lib/plan-import.ts` (no model).
- `specs.ts` — CRUD, `versionSpec` (snapshot into `spec_versions`), `markReady`.
- `tasks.ts` — CRUD, subtasks, `addDependency`, `setStatus`, `setAssignee`,
  `setRunnerPreference`.
- All mutations record activity events.

### 3. MCP + import (no `lib/ai/`)

There is **no generation layer**. The local model authors plans/specs/tasks by
calling the MCP tools (`create_plan`, `create_spec`, `create_task`, …), which go
through the same services. For pasted-in content, `lib/plan-import.ts` parses a
model's labeled-Markdown reply into structured fields (pure string parsing).

### 4. API routes (spec §17.2)

```
GET/POST   /api/projects/[projectId]/plans
GET/PATCH  /api/plans/[planId]
GET/POST   /api/projects/[projectId]/specs
GET/PATCH  /api/specs/[specId]
GET/POST   /api/projects/[projectId]/tasks
GET/PATCH  /api/tasks/[taskId]
```

### 5. UI

- **Project Overview tab** (spec §23.4): header, status/health, tags, current
  goal, active plan summary, open tasks, suggested actions. Wire real data.
- **Plan tab / editor** (spec §13.3): create manually or paste a model's reply
  ("Paste plan"); edit (Markdown); mark active; supersede; show open questions &
  assumptions.
- **Specs tab** (§13.4): list, create, edit, version, mark ready. Use the spec
  template fields.
- **Tasks tab** (§13.5): list/board by status; create/edit; subtasks;
  dependencies; assignee + runner preference. Use TanStack Table for the list.
- **Task page** (`/projects/[slug]/tasks/[taskId]`, spec §23.5): header, status,
  acceptance criteria, related spec, dependencies, activity. Context-pack/runs/PR
  sections are placeholders until Phase 2/3.

## Acceptance criteria (spec §28.3, §28.4)

- [ ] Create/edit a spec; link spec to project; mark spec ready.
- [ ] Add a plan via the form or by pasting a model's Markdown; edit and mark
      active (supersedes prior).
- [ ] Add tasks (form or MCP); they land as editable `Backlog` drafts.
- [ ] Create task, subtasks, dependencies; update status; link to spec; add
      acceptance criteria.
- [ ] Specs are versioned (snapshot on change).
- [ ] The same MCP tools let a local model author plans/specs/tasks end-to-end.
- [ ] typecheck + lint clean; migrations apply.

## Notes

- The hub stays model-free; the MCP tools are the authoring surface for agents,
  reused by Phase 2 (memory) and Phase 3 (runs).
- Markdown-first bodies (per README defaults) keep editing simple and diffable.
