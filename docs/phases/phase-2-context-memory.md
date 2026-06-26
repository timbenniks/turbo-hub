# Phase 2 — Context + memory layer

> Spec slice 3 (§32). Goal: generate editable context packs for tasks, and stand
> up the durable memory primitives (decisions, learnings, patterns) that make the
> hub compound. This is the product's differentiator (spec §10.3, §5).

## Outcome / demo

On a task → generate a context pack → preview → edit → approve (frozen
immutable). Create decisions and learnings; promote a learning to a pattern;
search patterns; see relevant patterns surfaced in a new context pack.

## Prerequisites

- Phase 1 complete (plans, specs, tasks, AI generation helpers).

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

- `contextPacks.ts` — `generateContextPack(taskId)` assembles the 14-section
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
POST   /api/tasks/[taskId]/generate-context-pack
GET    /api/projects/[projectId]/decisions   POST ...   PATCH /api/decisions/[id]
GET    /api/projects/[projectId]/learnings   POST ...   PATCH /api/learnings/[id]
POST   /api/learnings/[learningId]/promote
GET    /api/patterns   POST /api/patterns   GET /api/patterns/[id]   PATCH ...
POST   /api/patterns/search
```

### 5. UI

- **Task page: context pack section** (spec §23.5, §13.7) — Generate → Markdown
  preview with sections → edit → Approve. Show token estimate. Once sent, render
  read-only with a "frozen" badge.
- **Decisions tab** (§13.10) + project Decisions list; create/link/status.
- **Learnings tab** (§13.9) + "Promote to pattern" action (human-approved per
  §26.4).
- **Patterns page** (top-level, §13.8, §23.7) — search, tag/stack filters,
  pattern cards, source links, usage count, "Apply to task" action.
- Surface "recent decisions/learnings" on project Overview (§23.4).

## Acceptance criteria (spec §28.5, §28.7)

- [ ] Generate, preview, and edit a context pack from a task.
- [ ] Context pack is stored immutably once sent; cannot be overwritten.
- [ ] Context pack includes relevant patterns and learnings.
- [ ] Create a learning; promote it to a pattern (human-confirmed).
- [ ] Search patterns by query + filter by tag/stack/project type.
- [ ] Create decisions linked to project/spec/task; set status.
- [ ] No secrets ever appear in a generated context pack.
- [ ] typecheck + lint clean; migrations apply.

## Notes

- The pattern-reuse loop (create pattern in project A → suggested in project B)
  is the thesis demo (spec §33 step 13). Make `findRelevantPatterns` good enough
  to surface an obviously-relevant pattern.
- Token estimate can be a simple char/4 heuristic now; refine later (§30.2).
