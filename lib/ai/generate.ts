import { generateObject } from "ai"

import { FAST_MODEL, REASONING_MODEL } from "@/lib/ai/provider"
import {
  planGenSchema,
  specGenSchema,
  taskGenSchema,
  type PlanGen,
  type SpecGen,
  type TaskGen,
} from "@/lib/ai/schemas"

type ProjectContext = {
  name: string
  description?: string | null
  type: string
  stack: string[]
  goal?: string | null
  constraints?: string | null
}

function projectBlock(p: ProjectContext): string {
  return [
    `Project: ${p.name}`,
    `Type: ${p.type}`,
    p.stack.length ? `Stack: ${p.stack.join(", ")}` : null,
    p.description ? `Description: ${p.description}` : null,
    p.goal ? `Goal: ${p.goal}` : null,
    p.constraints ? `Constraints: ${p.constraints}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

export async function generatePlan(
  project: ProjectContext,
  idea: string
): Promise<PlanGen> {
  const { object } = await generateObject({
    model: FAST_MODEL,
    schema: planGenSchema,
    system:
      "You are a pragmatic technical product planner. Produce a tight, " +
      "v1-focused plan. Prefer cutting scope. Be concrete and specific.",
    prompt: `${projectBlock(project)}\n\nIdea / direction:\n${idea}\n\nGenerate a project plan.`,
  })
  return object
}

export async function generateSpec(
  project: ProjectContext,
  planContext: string | null,
  instruction: string | null
): Promise<SpecGen> {
  const { object } = await generateObject({
    model: REASONING_MODEL,
    schema: specGenSchema,
    system:
      "You are a senior engineer writing an implementation spec. Be precise " +
      "and testable. Acceptance criteria must be verifiable.",
    prompt: [
      projectBlock(project),
      planContext ? `\nProject plan:\n${planContext}` : "",
      instruction
        ? `\nSpec focus:\n${instruction}`
        : "\nScope this spec to the most important next milestone in the plan." +
          " If the plan lists milestones, pick the first one and spec it.",
      "\nGenerate a single implementation spec.",
    ].join("\n"),
  })
  return object
}

export async function generateTasks(
  project: ProjectContext,
  spec: { title: string; summary?: string | null; body: string }
): Promise<TaskGen> {
  const { object } = await generateObject({
    model: FAST_MODEL,
    schema: taskGenSchema,
    system:
      "You break specs into small, agent-executable tasks. Each task should be " +
      "independently shippable, with clear acceptance criteria. Order by dependency.",
    prompt: [
      projectBlock(project),
      `\nSpec: ${spec.title}`,
      spec.summary ? `Summary: ${spec.summary}` : "",
      `\n${spec.body}`,
      "\nBreak this spec into agent-executable tasks.",
    ].join("\n"),
  })
  return object
}
