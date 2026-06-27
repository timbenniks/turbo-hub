import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { contextPacks } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { sections } from "@/lib/markdown"
import { labelize } from "@/lib/labels"
import { recordActivity } from "@/lib/services/activity"
import { listDecisions } from "@/lib/services/decisions"
import { listLearnings } from "@/lib/services/learnings"
import { findRelevantPatterns } from "@/lib/services/patterns"
import { getProjectById } from "@/lib/services/projects"
import { getSpec, specBody } from "@/lib/services/specs"
import { getTask } from "@/lib/services/tasks"
import { assertWorkspaceMember } from "@/lib/services/workspaces"

export type ContextPack = typeof contextPacks.$inferSelect

/** Rough token estimate (~4 chars/token); refine later (spec §30.2). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function bulletList(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "_None recorded._"
}

export async function listContextPacks(
  workspaceId: string,
  taskId: string
): Promise<ContextPack[]> {
  return db
    .select()
    .from(contextPacks)
    .where(
      and(
        eq(contextPacks.workspaceId, workspaceId),
        eq(contextPacks.taskId, taskId)
      )
    )
    .orderBy(desc(contextPacks.createdAt))
}

export async function getContextPack(
  workspaceId: string,
  packId: string
): Promise<ContextPack | null> {
  const [row] = await db
    .select()
    .from(contextPacks)
    .where(
      and(eq(contextPacks.workspaceId, workspaceId), eq(contextPacks.id, packId))
    )
    .limit(1)
  return row ?? null
}

/**
 * Assemble an editable context pack for a task (spec §13.7). Pure assembly — no
 * model call. Pulls in the task, its spec, accepted decisions, learnings, and
 * relevant reusable patterns. Never includes secrets (spec §26.3).
 */
export async function assembleContextPack(
  ctx: AuthContext,
  workspaceId: string,
  taskId: string,
  opts: { title?: string } = {}
): Promise<ContextPack | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const task = await getTask(workspaceId, taskId)
  if (!task) return null
  const project = await getProjectById(workspaceId, task.projectId)
  if (!project) return null

  const tagNames = project.tags.map((t) => t.name)
  const [spec, allDecisions, learnings, patterns] = await Promise.all([
    task.specId ? getSpec(workspaceId, task.specId) : Promise.resolve(null),
    listDecisions(workspaceId, project.id),
    listLearnings(workspaceId, project.id),
    findRelevantPatterns(workspaceId, {
      tags: tagNames,
      stack: project.stack,
      limit: 5,
    }),
  ])
  const decisions = allDecisions.filter((d) => d.status === "accepted")

  const body = sections(
    `## Project\n**${project.name}** — ${labelize(project.type)}${
      project.stack.length ? `\nStack: ${project.stack.join(", ")}` : ""
    }${project.description ? `\n\n${project.description}` : ""}`,
    `## Goal\n${project.goal ?? "_No project goal set._"}`,
    `## Current phase\n${labelize(project.status)}`,
    `## Task\n**${task.title}**${
      task.description ? `\n\n${task.description}` : ""
    }`,
    `## Acceptance criteria\n${task.acceptanceCriteria ?? "_None specified._"}`,
    `## Relevant spec\n${
      spec ? `### ${spec.title}\n${specBody(spec)}` : "_No spec linked._"
    }`,
    `## Repository\n${
      project.repositoryId
        ? `Linked repository: ${project.repositoryId}`
        : "_No repository linked yet._"
    }`,
    `## Commands\n_None recorded yet._`,
    `## Conventions\n${project.notes ?? "_None recorded._"}`,
    `## Relevant decisions\n${bulletList(
      decisions.map((d) => `${d.title} (${labelize(d.status)})`)
    )}`,
    `## Relevant learnings\n${bulletList(
      learnings.map((l) => `${l.title} (${labelize(l.type)})`)
    )}`,
    `## Reusable patterns\n${bulletList(
      patterns.map((p) => `${p.summary}${p.appliesTo ? ` — ${p.appliesTo}` : ""}`)
    )}`,
    `## Guardrails\n- Never include secrets, credentials, or tokens in code or output.\n- Stay within the task's acceptance criteria; flag scope changes instead of expanding silently.${
      project.constraints ? `\n- ${project.constraints}` : ""
    }`,
    `## Expected output\nA pull request (or patch) that implements the task and satisfies the acceptance criteria, with tests where applicable.`
  )

  const sourcesData = {
    specId: spec?.id ?? null,
    decisionIds: decisions.map((d) => d.id),
    learningIds: learnings.map((l) => l.id),
    patternIds: patterns.map((p) => p.id),
  }

  const [row] = await db
    .insert(contextPacks)
    .values({
      workspaceId,
      projectId: project.id,
      taskId,
      title: opts.title ?? `Context pack — ${task.title}`,
      body,
      sources: sourcesData,
      tokenEstimate: estimateTokens(body),
      status: "draft",
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId: project.id,
    taskId,
    actorId: ctx.userId,
    type: "context_pack.assembled",
    title: `Assembled context pack for "${task.title}"`,
    metadata: { contextPackId: row.id },
  })
  return row
}

export const generateContextPack = assembleContextPack

/** Edit a draft/approved pack's title or body. Sent packs are immutable. */
export async function updateContextPack(
  ctx: AuthContext,
  workspaceId: string,
  packId: string,
  input: { title?: string; body?: string }
): Promise<ContextPack | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const current = await getContextPack(workspaceId, packId)
  if (!current) return null
  if (current.status === "sent") {
    throw Object.assign(
      new Error("Context pack is frozen (sent) and cannot be edited."),
      { status: 409 }
    )
  }

  const fields: Partial<typeof contextPacks.$inferInsert> = {}
  if (input.title !== undefined) fields.title = input.title
  if (input.body !== undefined) {
    fields.body = input.body
    fields.tokenEstimate = estimateTokens(input.body)
  }
  if (Object.keys(fields).length === 0) return current

  const [row] = await db
    .update(contextPacks)
    .set(fields)
    .where(
      and(eq(contextPacks.workspaceId, workspaceId), eq(contextPacks.id, packId))
    )
    .returning()
  return row ?? null
}

export async function approveContextPack(
  ctx: AuthContext,
  workspaceId: string,
  packId: string
): Promise<ContextPack | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .update(contextPacks)
    .set({ status: "approved" })
    .where(
      and(
        eq(contextPacks.workspaceId, workspaceId),
        eq(contextPacks.id, packId),
        eq(contextPacks.status, "draft")
      )
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    taskId: row.taskId,
    actorId: ctx.userId,
    type: "context_pack.approved",
    title: `Approved context pack "${row.title}"`,
    metadata: { contextPackId: row.id },
  })
  return row
}

/** Freeze a pack: status → sent, stamp sentAt. Immutable thereafter (§28.5). */
export async function sendContextPack(
  ctx: AuthContext,
  workspaceId: string,
  packId: string
): Promise<ContextPack | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const current = await getContextPack(workspaceId, packId)
  if (!current) return null
  if (current.status === "sent") return current

  const [row] = await db
    .update(contextPacks)
    .set({ status: "sent", sentAt: new Date() })
    .where(
      and(eq(contextPacks.workspaceId, workspaceId), eq(contextPacks.id, packId))
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    taskId: row.taskId,
    actorId: ctx.userId,
    type: "context_pack.sent",
    title: `Froze context pack "${row.title}"`,
    metadata: { contextPackId: row.id },
  })
  return row
}
