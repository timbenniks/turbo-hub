import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { specVersions, specs } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { generateSpec, generateTasks } from "@/lib/ai/generate"
import { bullets, sections } from "@/lib/markdown"
import { recordActivity } from "@/lib/services/activity"
import { getActivePlan, getPlan } from "@/lib/services/plans"
import { createTasksFromGenerated } from "@/lib/services/tasks"
import type { SpecCreateInput, SpecUpdateInput } from "@/lib/validation/specs"

export type Spec = typeof specs.$inferSelect

const EDITABLE_FIELDS = [
  "title",
  "summary",
  "problem",
  "goal",
  "scope",
  "nonGoals",
  "userStories",
  "uxRequirements",
  "dataRequirements",
  "apiRequirements",
  "acceptanceCriteria",
  "risks",
  "implementationNotes",
] as const

/** Assemble a spec's stored fields into one Markdown body for prompts/display. */
export function specBody(spec: Spec): string {
  return sections(
    spec.problem && `## Problem\n${spec.problem}`,
    spec.goal && `## Goal\n${spec.goal}`,
    spec.scope && `## Scope\n${spec.scope}`,
    spec.nonGoals && `## Non-goals\n${spec.nonGoals}`,
    spec.userStories && `## User stories\n${spec.userStories}`,
    spec.uxRequirements && `## UX requirements\n${spec.uxRequirements}`,
    spec.dataRequirements && `## Data requirements\n${spec.dataRequirements}`,
    spec.apiRequirements && `## API requirements\n${spec.apiRequirements}`,
    spec.acceptanceCriteria &&
      `## Acceptance criteria\n${spec.acceptanceCriteria}`,
    spec.risks && `## Risks\n${spec.risks}`,
    spec.implementationNotes &&
      `## Implementation notes\n${spec.implementationNotes}`
  )
}

export async function listSpecs(
  workspaceId: string,
  projectId: string
): Promise<Spec[]> {
  return db
    .select()
    .from(specs)
    .where(
      and(eq(specs.workspaceId, workspaceId), eq(specs.projectId, projectId))
    )
    .orderBy(desc(specs.updatedAt))
}

export async function getSpec(
  workspaceId: string,
  specId: string
): Promise<Spec | null> {
  const [row] = await db
    .select()
    .from(specs)
    .where(and(eq(specs.workspaceId, workspaceId), eq(specs.id, specId)))
    .limit(1)
  return row ?? null
}

export async function createSpec(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: SpecCreateInput
): Promise<Spec> {
  const [row] = await db
    .insert(specs)
    .values({
      workspaceId,
      projectId,
      planId: input.planId ?? null,
      title: input.title,
      summary: input.summary ?? null,
      problem: input.problem ?? null,
      goal: input.goal ?? null,
      scope: input.scope ?? null,
      nonGoals: input.nonGoals ?? null,
      userStories: input.userStories ?? null,
      uxRequirements: input.uxRequirements ?? null,
      dataRequirements: input.dataRequirements ?? null,
      apiRequirements: input.apiRequirements ?? null,
      acceptanceCriteria: input.acceptanceCriteria ?? null,
      risks: input.risks ?? null,
      implementationNotes: input.implementationNotes ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "spec.created",
    title: `Created spec "${row.title}"`,
  })
  return row
}

/**
 * Edit a spec. Snapshots the current state into spec_versions (immutable) and
 * bumps the version (spec §11.3, §25.3).
 */
export async function updateSpec(
  ctx: AuthContext,
  workspaceId: string,
  specId: string,
  input: SpecUpdateInput
): Promise<Spec | null> {
  const current = await getSpec(workspaceId, specId)
  if (!current) return null

  const fields: Partial<typeof specs.$inferInsert> = {}
  for (const key of EDITABLE_FIELDS) {
    if (input[key] !== undefined) fields[key] = input[key] ?? null
  }
  if (input.planId !== undefined) fields.planId = input.planId ?? null
  if (Object.keys(fields).length === 0) return current

  // Snapshot the pre-edit state, then bump version.
  await db.insert(specVersions).values({
    workspaceId,
    specId,
    version: current.version,
    snapshot: current,
    createdBy: ctx.userId,
  })

  const [row] = await db
    .update(specs)
    .set({ ...fields, version: current.version + 1 })
    .where(and(eq(specs.workspaceId, workspaceId), eq(specs.id, specId)))
    .returning()

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "spec.updated",
    title: `Updated spec "${row.title}" (v${row.version})`,
  })
  return row
}

export async function markSpecReady(
  ctx: AuthContext,
  workspaceId: string,
  specId: string
): Promise<Spec | null> {
  const [row] = await db
    .update(specs)
    .set({ status: "ready" })
    .where(and(eq(specs.workspaceId, workspaceId), eq(specs.id, specId)))
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "spec.ready",
    title: `Marked spec "${row.title}" ready`,
  })
  return row
}

type ProjectContext = {
  id: string
  name: string
  description: string | null
  type: string
  stack: string[]
  goal: string | null
  constraints: string | null
}

/** Generate a draft spec from the active plan (or a focus instruction). */
export async function generateSpecForProject(
  ctx: AuthContext,
  workspaceId: string,
  project: ProjectContext,
  instruction: string,
  planId?: string
): Promise<Spec> {
  const plan = planId
    ? await getPlan(workspaceId, planId)
    : await getActivePlan(workspaceId, project.id)

  const gen = await generateSpec(project, plan?.summary ?? null, instruction)

  return createSpec(ctx, workspaceId, project.id, {
    title: gen.title,
    planId: plan?.id,
    summary: gen.summary,
    problem: gen.problem,
    goal: gen.goal,
    scope: gen.scope,
    nonGoals: bullets(gen.nonGoals),
    userStories: bullets(gen.userStories),
    uxRequirements: bullets(gen.uxRequirements),
    dataRequirements: bullets(gen.dataRequirements),
    apiRequirements: bullets(gen.apiRequirements),
    acceptanceCriteria: bullets(gen.acceptanceCriteria),
    risks: bullets(gen.risks),
    implementationNotes: gen.implementationNotes,
  })
}

/**
 * Generate agent-executable tasks from a spec (spec §11.4). Tasks land as
 * Backlog drafts for human review (agents suggest, humans approve).
 */
export async function generateTasksFromSpec(
  ctx: AuthContext,
  workspaceId: string,
  project: ProjectContext,
  spec: Spec
) {
  const gen = await generateTasks(project, {
    title: spec.title,
    summary: spec.summary,
    body: specBody(spec),
  })

  const created = await createTasksFromGenerated(
    ctx,
    workspaceId,
    project.id,
    spec.id,
    gen.tasks
  )

  await recordActivity({
    workspaceId,
    projectId: project.id,
    actorId: ctx.userId,
    type: "spec.tasks_generated",
    title: `Generated ${created.length} tasks from spec "${spec.title}"`,
  })
  return created
}
