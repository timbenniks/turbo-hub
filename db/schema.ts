import { ulid } from "ulid"
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

import {
  ACTOR_TYPES,
  PLAN_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  RUNNER_PREFERENCES,
  SPEC_STATUSES,
  TASK_ASSIGNEE_TYPES,
  TASK_DEPENDENCY_TYPES,
  TASK_STATUSES,
  WORKSPACE_ROLES,
} from "@/lib/enums"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => ulid())

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull()

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const workspaceRole = pgEnum("workspace_role", WORKSPACE_ROLES)
export const projectStatus = pgEnum("project_status", PROJECT_STATUSES)
export const projectHealth = pgEnum("project_health", PROJECT_HEALTHS)
export const projectPriority = pgEnum("project_priority", PROJECT_PRIORITIES)
export const projectType = pgEnum("project_type", PROJECT_TYPES)
export const actorType = pgEnum("actor_type", ACTOR_TYPES)
export const planStatus = pgEnum("plan_status", PLAN_STATUSES)
export const specStatus = pgEnum("spec_status", SPEC_STATUSES)
export const taskStatus = pgEnum("task_status", TASK_STATUSES)
export const taskAssigneeType = pgEnum(
  "task_assignee_type",
  TASK_ASSIGNEE_TYPES
)
export const runnerPreference = pgEnum("runner_preference", RUNNER_PREFERENCES)
export const taskDependencyType = pgEnum(
  "task_dependency_type",
  TASK_DEPENDENCY_TYPES
)

// ---------------------------------------------------------------------------
// Auth.js tables (Drizzle adapter shape)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// ---------------------------------------------------------------------------
// Workspaces + membership
// ---------------------------------------------------------------------------

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRole("role").notNull().default("member"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (m) => [
    uniqueIndex("workspace_members_workspace_user_idx").on(
      m.workspaceId,
      m.userId
    ),
    index("workspace_members_user_idx").on(m.userId),
  ]
)

// ---------------------------------------------------------------------------
// Projects + tags
// ---------------------------------------------------------------------------

export const projects = pgTable(
  "projects",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: projectStatus("status").notNull().default("idea"),
    health: projectHealth("health").notNull().default("unknown"),
    priority: projectPriority("priority").notNull().default("medium"),
    type: projectType("type").notNull().default("app"),
    stack: text("stack").array().notNull().default([]),
    goal: text("goal"),
    constraints: text("constraints"),
    notes: text("notes"),
    // FK targets added in later phases (repositories, plans).
    repositoryId: text("repository_id"),
    currentPlanId: text("current_plan_id"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (p) => [
    uniqueIndex("projects_workspace_slug_idx").on(p.workspaceId, p.slug),
    index("projects_workspace_idx").on(p.workspaceId),
    index("projects_status_idx").on(p.status),
  ]
)

export const tags = pgTable(
  "tags",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("tags_workspace_slug_idx").on(t.workspaceId, t.slug)]
)

export const projectTags = pgTable(
  "project_tags",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (pt) => [
    primaryKey({ columns: [pt.projectId, pt.tagId] }),
    index("project_tags_tag_idx").on(pt.tagId),
  ]
)

// ---------------------------------------------------------------------------
// Activity feed (spec §12.19, §27.1) — append-only audit of mutations
// ---------------------------------------------------------------------------

export const activityEvents = pgTable(
  "activity_events",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    actorType: actorType("actor_type").notNull().default("user"),
    actorId: text("actor_id"),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    createdAt: createdAt(),
  },
  (a) => [
    index("activity_events_workspace_idx").on(a.workspaceId),
    index("activity_events_project_idx").on(a.projectId),
  ]
)

// ---------------------------------------------------------------------------
// Plans (spec §12.6)
// ---------------------------------------------------------------------------

export const plans = pgTable(
  "plans",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    // Free-form Markdown body — used when a whole plan is pasted in (e.g. from
    // an external chat) instead of the structured fields below.
    body: text("body"),
    // Markdown bodies (README default: markdown-first).
    goals: text("goals"),
    nonGoals: text("non_goals"),
    constraints: text("constraints"),
    milestones: text("milestones"),
    openQuestions: text("open_questions"),
    status: planStatus("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (p) => [index("plans_project_idx").on(p.projectId)]
)

// ---------------------------------------------------------------------------
// Specs + immutable version snapshots (spec §12.7)
// ---------------------------------------------------------------------------

export const specs = pgTable(
  "specs",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    planId: text("plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    summary: text("summary"),
    problem: text("problem"),
    goal: text("goal"),
    scope: text("scope"),
    nonGoals: text("non_goals"),
    userStories: text("user_stories"),
    uxRequirements: text("ux_requirements"),
    dataRequirements: text("data_requirements"),
    apiRequirements: text("api_requirements"),
    acceptanceCriteria: text("acceptance_criteria"),
    risks: text("risks"),
    implementationNotes: text("implementation_notes"),
    status: specStatus("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (s) => [index("specs_project_idx").on(s.projectId)]
)

export const specVersions = pgTable(
  "spec_versions",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    specId: text("spec_id")
      .notNull()
      .references(() => specs.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    // Immutable snapshot of the spec fields at this version (spec §25.3).
    snapshot: jsonb("snapshot").notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (sv) => [
    uniqueIndex("spec_versions_spec_version_idx").on(sv.specId, sv.version),
  ]
)

// ---------------------------------------------------------------------------
// Tasks + dependencies (spec §12.8, §12.9)
// ---------------------------------------------------------------------------

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    specId: text("spec_id").references(() => specs.id, {
      onDelete: "set null",
    }),
    parentTaskId: text("parent_task_id"),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatus("status").notNull().default("backlog"),
    priority: projectPriority("priority").notNull().default("medium"),
    assigneeType: taskAssigneeType("assignee_type")
      .notNull()
      .default("unassigned"),
    assigneeId: text("assignee_id"),
    runnerPreference: runnerPreference("runner_preference")
      .notNull()
      .default("manual"),
    acceptanceCriteria: text("acceptance_criteria"),
    contextNotes: text("context_notes"),
    branchName: text("branch_name"),
    // FK target (pull_requests) added in Phase 3.
    pullRequestId: text("pull_request_id"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("tasks_project_idx").on(t.projectId),
    index("tasks_spec_idx").on(t.specId),
    index("tasks_parent_idx").on(t.parentTaskId),
    index("tasks_status_idx").on(t.status),
  ]
)

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: text("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: taskDependencyType("type").notNull().default("blocks"),
    createdAt: createdAt(),
  },
  (d) => [
    uniqueIndex("task_dependencies_pair_idx").on(d.taskId, d.dependsOnTaskId),
    index("task_dependencies_task_idx").on(d.taskId),
  ]
)

// ---------------------------------------------------------------------------
// TODO (later phases — extend this file, keep one coherent schema):
//   Phase 2: decisions, learnings, patterns, context_packs
//   Phase 3: agent_profiles, agent_runs, agent_run_events, pull_requests
//   Phase 4: integrations
//   Phase 5: repositories
//   Phase 6: api_keys, mcp_tokens
// ---------------------------------------------------------------------------
