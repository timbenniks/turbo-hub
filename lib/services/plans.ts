import { and, desc, eq, ne } from "drizzle-orm"

import { db } from "@/db"
import { plans, projects } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import { recordActivity } from "@/lib/services/activity"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type { PlanCreateInput, PlanUpdateInput } from "@/lib/validation/plans"

export type Plan = typeof plans.$inferSelect

export async function listPlans(
  workspaceId: string,
  projectId: string
): Promise<Plan[]> {
  return db
    .select()
    .from(plans)
    .where(
      and(eq(plans.workspaceId, workspaceId), eq(plans.projectId, projectId))
    )
    .orderBy(desc(plans.version))
}

export async function getPlan(
  workspaceId: string,
  planId: string
): Promise<Plan | null> {
  const [row] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.workspaceId, workspaceId), eq(plans.id, planId)))
    .limit(1)
  return row ?? null
}

export async function getActivePlan(
  workspaceId: string,
  projectId: string
): Promise<Plan | null> {
  // Not cached: the row carries Date fields, and the Data Cache round-trips
  // values through serialization (see lib/cache.ts). It's a single indexed
  // lookup, so the cache wasn't buying much anyway.
  const [row] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.workspaceId, workspaceId),
        eq(plans.projectId, projectId),
        eq(plans.status, "active")
      )
    )
    .limit(1)
  return row ?? null
}

export async function createPlan(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: PlanCreateInput
): Promise<Plan> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .insert(plans)
    .values({
      workspaceId,
      projectId,
      title: input.title,
      body: input.body ?? null,
      summary: input.summary ?? null,
      goals: input.goals ?? null,
      nonGoals: input.nonGoals ?? null,
      constraints: input.constraints ?? null,
      milestones: input.milestones ?? null,
      openQuestions: input.openQuestions ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "plan.created",
    title: `Created plan "${row.title}"`,
  })
  invalidateTags(cacheTags.project(workspaceId, projectId))
  return row
}

export async function updatePlan(
  ctx: AuthContext,
  workspaceId: string,
  planId: string,
  input: PlanUpdateInput
): Promise<Plan | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof plans.$inferInsert> = {}
  for (const key of [
    "title",
    "body",
    "summary",
    "goals",
    "nonGoals",
    "constraints",
    "milestones",
    "openQuestions",
  ] as const) {
    if (input[key] !== undefined) fields[key] = input[key] ?? null
  }
  if (Object.keys(fields).length === 0) return getPlan(workspaceId, planId)

  const [row] = await db
    .update(plans)
    .set(fields)
    .where(and(eq(plans.workspaceId, workspaceId), eq(plans.id, planId)))
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "plan.updated",
    title: `Updated plan "${row.title}"`,
  })
  invalidateTags(cacheTags.project(workspaceId, row.projectId))
  return row
}

/**
 * Mark a plan active: supersede any other active plan in the project and point
 * the project at this plan (spec §13.3).
 */
export async function markPlanActive(
  ctx: AuthContext,
  workspaceId: string,
  planId: string
): Promise<Plan | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const plan = await getPlan(workspaceId, planId)
  if (!plan) return null

  await db
    .update(plans)
    .set({ status: "superseded" })
    .where(
      and(
        eq(plans.workspaceId, workspaceId),
        eq(plans.projectId, plan.projectId),
        eq(plans.status, "active"),
        ne(plans.id, planId)
      )
    )

  const [row] = await db
    .update(plans)
    .set({ status: "active" })
    .where(and(eq(plans.workspaceId, workspaceId), eq(plans.id, planId)))
    .returning()

  await db
    .update(projects)
    .set({ currentPlanId: planId })
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.id, plan.projectId)
      )
    )

  await recordActivity({
    workspaceId,
    projectId: plan.projectId,
    actorId: ctx.userId,
    type: "plan.activated",
    title: `Activated plan "${plan.title}"`,
  })
  invalidateTags(cacheTags.project(workspaceId, plan.projectId))
  return row
}

/**
 * Hard-delete a plan. Plans are child records with no soft-delete status, so
 * removal is permanent. Clears the project's `currentPlanId` pointer if it
 * referenced this plan.
 */
export async function deletePlan(
  ctx: AuthContext,
  workspaceId: string,
  planId: string
): Promise<Plan | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const plan = await getPlan(workspaceId, planId)
  if (!plan) return null

  await db
    .update(projects)
    .set({ currentPlanId: null })
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.id, plan.projectId),
        eq(projects.currentPlanId, planId)
      )
    )

  await db
    .delete(plans)
    .where(and(eq(plans.workspaceId, workspaceId), eq(plans.id, planId)))

  await recordActivity({
    workspaceId,
    projectId: plan.projectId,
    actorId: ctx.userId,
    type: "plan.deleted",
    title: `Deleted plan "${plan.title}"`,
  })
  invalidateTags(cacheTags.project(workspaceId, plan.projectId))
  return plan
}
