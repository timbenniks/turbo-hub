# Phase 2 — Context + memory layer

> Spec slice 3 (§32). Goal: assemble editable context packs for tasks, and stand
> up the durable memory primitives (decisions, learnings, patterns) that make the
> hub compound. This is the product's differentiator (spec §10.3, §5).

## Outcome / demo

On a task → assemble a context pack → preview → edit → approve (frozen
immutable). Create decisions and learnings; promote a learning to a pattern;
search patterns; see relevant patterns surfaced in a new context pack.

> **Status:** this phase is **largely built** — schema (decisions, learnings,
> patterns, context_packs + FTS), services, MCP tools, REST routes, decisions/
> learnings project tabs, top-level Patterns page, project overview memory
> surfacing, and task context-pack panel all exist. Context packs assemble
> **deterministically** (no model).
>
> **No in-app AI** — see the [README](./README.md) note. `assembleContextPack`
> is pure assembly; learnings/decisions/patterns are hand-filled or written by a
> local model via MCP.

## Prerequisites

- Phase 1 complete (plans, specs, tasks).

## Tasks

### 1. Schema additions (spec §12.15–§12.18, §25.2)

- `decisions` (type, status: proposed/accepted/rejected/superseded; links to
  project/task/run).
- `learnings` (type: success/failure/gotcha/reusable_idea/convention/anti_pattern;
  confidence; `promoted_to_pattern`; links).
- `patterns` (summary, body, applies_to, stack, tags, `usage_count`,
  `last_used_at`, source project/task/run, `archived_at`).
- `context_packs` (title, body, `sources` jsonb, `token_estimate`, status:
  draft/approved/sent/archived). **Immutable once `sent`** (spec §25.3, §28.5).
- Full-text search: add `tsvector` columns + GIN indexes on specs, tasks,
  decisions, learnings, patterns (spec §22.4 — relational + FTS first, embeddings
  later).

Generate + migrate.

### 2. Services

- `contextPacks.ts` — `assembleContextPack(taskId)` assembles the 14-section
  structure (spec §13.7): project, goal, current phase, task, acceptance
  criteria, relevant spec excerpts, repo details, commands, conventions, relevant
  decisions, **relevant learnings**, **reusable patterns**, guardrails, expected
  output format. `approveContextPack`, `freeze` (snapshot immutable + status
  `sent`), `attachToRun` (Phase 3). **Never include secrets** (spec §26.3).
- `decisions.ts` — CRUD + status transitions.
- `learnings.ts` — CRUD, `generateFromRunSummary` (Phase 3 hook),
  `promoteToPattern(learningId)`.
- `patterns.ts` — CRUD, `searchPatterns(query, {tags, stack, type, sourceProject})`,
  `recordUsage(patternId)` (bumps `usage_count`/`last_used_at`),
  `findRelevantPatterns(taskOrProject)` for context-pack injection.

### 3. Relevance / search

- `lib/services/search.ts` — Postgres FTS + relational filters across memory
  objects. Rank patterns/learnings/decisions for a given task by tag/stack/type
  overlap (spec §11.10, §13.7). Keep the ranking function isolated so embeddings
  can slot in later (§22.4, §31 Q7).

### 4. API routes (spec §17.2)

```
POST   /api/tasks/[taskId]/context-packs
GET    /api/projects/[projectId]/decisions   POST ...   PATCH /api/decisions/[id]
GET    /api/projects/[projectId]/learnings   POST ...   PATCH /api/learnings/[id]
POST   /api/learnings/[learningId]/promote
GET    /api/patterns   POST /api/patterns   GET /api/patterns/[id]   PATCH ...
POST   /api/patterns/search
```

### 5. UI

- **Task page: context pack section** (spec §23.5, §13.7) — Assemble → Markdown
  preview with sections → edit → Approve. Show token estimate. Once sent, render
  read-only with a "frozen" badge.
- **Decisions tab** (§13.10) + project Decisions list; create/link/status.
- **Learnings tab** (§13.9) + "Promote to pattern" action (human-approved per
  §26.4).
- **Patterns page** (top-level, §13.8, §23.7) — search, tag/stack filters,
  pattern cards, source links, usage count, "Apply to task" action.
- Surface "recent decisions/learnings" on project Overview (§23.4).

## Acceptance criteria (spec §28.5, §28.7)

- [x] Assemble, preview, and edit a context pack from a task.
- [x] Context pack is stored immutably once sent; cannot be overwritten.
- [x] Context pack includes relevant patterns and learnings.
- [x] Create a learning; promote it to a pattern (human-confirmed).
- [x] Search patterns by query + filter by tag/stack/project type.
- [x] Create decisions linked to project/spec/task; set status.
- [ ] No secrets ever appear in an assembled context pack.
- [x] typecheck + lint clean; migrations apply.

## Notes

- The pattern-reuse loop (create pattern in project A → suggested in project B)
  is the thesis demo (spec §33 step 13). Make `findRelevantPatterns` good enough
  to surface an obviously-relevant pattern.
- Token estimate can be a simple char/4 heuristic now; refine later (§30.2).
