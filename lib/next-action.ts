import type { NextActionContent } from "@/components/next-action-card"

/**
 * Derives the single best "what to do next" for a project from data already
 * fetched by the overview/dashboard pages. Pure heuristic — NO AI, no I/O.
 */

type PlanLike = { status: string } | null
type SpecLike = { id: string; title: string; status: string }
type TaskLike = { id: string; title: string; status: string }
type RunLike = { status: string }
type PrLike = { state: string }

export type NextActionInput = {
  slug: string
  plan: PlanLike
  specs: SpecLike[]
  tasks: TaskLike[]
  runs: RunLike[]
  pullRequests: PrLike[]
}

export function computeNextAction({
  slug,
  plan,
  specs,
  tasks,
  runs,
  pullRequests,
}: NextActionInput): NextActionContent {
  const base = `/projects/${slug}`

  // A run is waiting for the human to review its output.
  const runNeedsReview = runs.some((r) => r.status === "waiting_for_review")
  if (runNeedsReview) {
    return {
      title: "Review run output",
      description:
        "A run finished and is waiting for review. Check what changed and approve or request changes.",
      actions: [{ label: "Open runs", href: `${base}/runs`, primary: true }],
    }
  }

  // A task came back needing changes.
  const needsChanges = tasks.find((t) => t.status === "needs_changes")
  if (needsChanges) {
    return {
      title: "Address requested changes",
      description: `“${needsChanges.title}” needs changes before it can move forward.`,
      actions: [
        {
          label: "Open task",
          href: `${base}/tasks/${needsChanges.id}`,
          primary: true,
        },
      ],
    }
  }

  // No plan at all.
  if (!plan) {
    return {
      title: "Create a plan",
      description:
        "Start by capturing what you're building and what you've agreed not to build.",
      actions: [{ label: "Open plan", href: `${base}/plan`, primary: true }],
    }
  }

  // Plan exists but isn't the current/active one.
  if (plan.status !== "active") {
    return {
      title: "Make the plan current",
      description:
        "You have a draft plan. Mark it active so specs and tasks hang off it.",
      actions: [{ label: "Open plan", href: `${base}/plan`, primary: true }],
    }
  }

  // No specs yet.
  if (specs.length === 0) {
    return {
      title: "Write the first spec",
      description:
        "Turn the plan into a concrete spec the agent can execute against.",
      actions: [{ label: "Open specs", href: `${base}/specs`, primary: true }],
    }
  }

  // A spec is still draft — get it ready.
  const draftSpec = specs.find((s) => s.status === "draft")
  if (draftSpec) {
    return {
      title: `Mark “${draftSpec.title}” ready`,
      description:
        "This spec is still a draft. Mark it ready before dispatching tasks.",
      actions: [
        {
          label: "Open spec",
          href: `${base}/specs/${draftSpec.id}`,
          primary: true,
        },
      ],
    }
  }

  // Specs are ready but no tasks exist.
  if (tasks.length === 0) {
    return {
      title: "Create tasks from the spec",
      description:
        "Break the ready spec into tasks an agent or human can pick up.",
      actions: [{ label: "Open tasks", href: `${base}/tasks`, primary: true }],
    }
  }

  // Tasks are ready to run but nothing has been dispatched.
  const readyTask = tasks.find((t) => t.status === "ready")
  if (readyTask && runs.length === 0) {
    return {
      title: `Start “${readyTask.title}”`,
      description:
        "Generate a context pack and start a run on the next ready task.",
      actions: [
        {
          label: "Open task",
          href: `${base}/tasks/${readyTask.id}`,
          primary: true,
        },
      ],
    }
  }

  // Work shipped but nothing left to flag.
  if (pullRequests.length === 0 && runs.length > 0) {
    return {
      title: "Link the resulting PR",
      description:
        "Runs have happened but no PR is linked yet. Link one to track it here.",
      actions: [{ label: "Open runs", href: `${base}/runs`, primary: true }],
    }
  }

  return {
    title: "All caught up",
    description:
      "No blocking next step right now. Keep tasks moving or capture learnings from recent runs.",
    actions: [{ label: "Open tasks", href: `${base}/tasks`, primary: true }],
  }
}
