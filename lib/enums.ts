// Single source of truth for domain enum values. Imported by both the Drizzle
// schema (pgEnum) and the Zod validation layer so the two can never drift.
// Pure string tuples only — safe to import from client components.

export const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"] as const

export const API_KEY_SCOPES = [
  "api:read",
  "api:write",
  "mcp:read",
  "mcp:write",
] as const

export const PROJECT_STATUSES = [
  "idea",
  "scoping",
  "planned",
  "building",
  "review",
  "shipped",
  "paused",
  "blocked",
  "archived",
] as const

export const PROJECT_HEALTHS = [
  "unknown",
  "good",
  "at_risk",
  "blocked",
] as const

export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export const PROJECT_TYPES = [
  "app",
  "website",
  "cli",
  "sdk",
  "mcp_server",
  "internal_tool",
  "automation",
  "experiment",
  "library",
  "content_project",
  "other",
] as const

export const ACTOR_TYPES = ["user", "agent", "system"] as const

// --- Phase 1: planning layer ---

export const PLAN_STATUSES = [
  "draft",
  "active",
  "superseded",
  "archived",
] as const

export const SPEC_STATUSES = [
  "draft",
  "ready",
  "in_progress",
  "implemented",
  "superseded",
  "archived",
] as const

export const TASK_STATUSES = [
  "backlog",
  "ready",
  "claimed",
  "running",
  "in_review",
  "needs_changes",
  "done",
  "blocked",
  "canceled",
] as const

export const TASK_ASSIGNEE_TYPES = ["human", "agent", "unassigned"] as const

export const RUNNER_PREFERENCES = [
  "manual",
  "cursor_cloud",
  "claude_local",
  "custom",
] as const

export const TASK_DEPENDENCY_TYPES = [
  "blocks",
  "related",
  "duplicates",
  "supersedes",
] as const

// --- Phase 2: context + memory layer ---

export const DECISION_TYPES = [
  "architecture",
  "tooling",
  "process",
  "product",
  "naming",
  "tradeoff",
  "other",
] as const

export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "rejected",
  "superseded",
] as const

export const LEARNING_TYPES = [
  "success",
  "failure",
  "gotcha",
  "reusable_idea",
  "convention",
  "anti_pattern",
] as const

export const CONTEXT_PACK_STATUSES = [
  "draft",
  "approved",
  "sent",
  "archived",
] as const

// --- Phase 3: agent runs ---

export const AGENT_PROFILE_TYPES = [
  "cursor_cloud",
  "claude_local",
  "manual",
  "custom_api",
] as const

export const AGENT_RUN_STATUSES = [
  "created",
  "queued",
  "running",
  "waiting_for_input",
  "waiting_for_review",
  "completed",
  "failed",
  "canceled",
] as const

export const AGENT_RUN_EVENT_TYPES = [
  "run_created",
  "agent_started",
  "status_update",
  "tool_call",
  "file_change",
  "branch_created",
  "pr_opened",
  "pr_updated",
  "check_passed",
  "check_failed",
  "human_input_requested",
  "error",
  "completed",
  "learning_added",
] as const

export const PULL_REQUEST_STATES = [
  "open",
  "draft",
  "merged",
  "closed",
] as const

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number]
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]
export type ProjectType = (typeof PROJECT_TYPES)[number]
export type ActorType = (typeof ACTOR_TYPES)[number]
export type PlanStatus = (typeof PLAN_STATUSES)[number]
export type SpecStatus = (typeof SPEC_STATUSES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskAssigneeType = (typeof TASK_ASSIGNEE_TYPES)[number]
export type RunnerPreference = (typeof RUNNER_PREFERENCES)[number]
export type TaskDependencyType = (typeof TASK_DEPENDENCY_TYPES)[number]
export type DecisionType = (typeof DECISION_TYPES)[number]
export type DecisionStatus = (typeof DECISION_STATUSES)[number]
export type LearningType = (typeof LEARNING_TYPES)[number]
export type ContextPackStatus = (typeof CONTEXT_PACK_STATUSES)[number]
export type AgentProfileType = (typeof AGENT_PROFILE_TYPES)[number]
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number]
export type AgentRunEventType = (typeof AGENT_RUN_EVENT_TYPES)[number]
export type PullRequestState = (typeof PULL_REQUEST_STATES)[number]
