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

import { boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

import {
  ACTOR_TYPES,
  API_KEY_SCOPES,
  type ApiKeyScope,
  AGENT_PROFILE_TYPES,
  AGENT_RUN_EVENT_TYPES,
  AGENT_RUN_STATUSES,
  CONTEXT_PACK_STATUSES,
  DECISION_STATUSES,
  DECISION_TYPES,
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUSES,
  LEARNING_TYPES,
  PLAN_STATUSES,
  PULL_REQUEST_STATES,
  PROJECT_HEALTHS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  REPOSITORY_PROVIDERS,
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
export const decisionType = pgEnum("decision_type", DECISION_TYPES)
export const decisionStatus = pgEnum("decision_status", DECISION_STATUSES)
export const learningType = pgEnum("learning_type", LEARNING_TYPES)
export const contextPackStatus = pgEnum(
  "context_pack_status",
  CONTEXT_PACK_STATUSES
)
export const agentProfileType = pgEnum(
  "agent_profile_type",
  AGENT_PROFILE_TYPES
)
export const agentRunStatus = pgEnum("agent_run_status", AGENT_RUN_STATUSES)
export const agentRunEventType = pgEnum(
  "agent_run_event_type",
  AGENT_RUN_EVENT_TYPES
)
export const pullRequestState = pgEnum(
  "pull_request_state",
  PULL_REQUEST_STATES
)
export const repositoryProvider = pgEnum(
  "repository_provider",
  REPOSITORY_PROVIDERS
)
export const integrationProvider = pgEnum(
  "integration_provider",
  INTEGRATION_PROVIDERS
)
export const integrationStatus = pgEnum(
  "integration_status",
  INTEGRATION_STATUSES
)

const defaultApiKeyScopes = sql.raw(
  `'${JSON.stringify(API_KEY_SCOPES)}'::jsonb`
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

/**
 * Personal access tokens for programmatic auth (external agents, CLIs, MCP).
 * The raw token is shown once on creation; only its SHA-256 hash is stored.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hashedKey: text("hashed_key").notNull().unique(),
    // Short, non-secret identifier shown in the UI (e.g. "thub_a1b2c3d").
    prefix: text("prefix").notNull(),
    scopes: jsonb("scopes")
      .$type<ApiKeyScope[]>()
      .default(defaultApiKeyScopes)
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (k) => [index("api_keys_user_idx").on(k.userId)]
)

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
    index("workspace_members_user_workspace_idx").on(m.userId, m.workspaceId),
  ]
)

// ---------------------------------------------------------------------------
// Integrations + repositories
// ---------------------------------------------------------------------------

export const integrations = pgTable(
  "integrations",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: integrationProvider("provider").notNull(),
    name: text("name").notNull(),
    status: integrationStatus("status").notNull().default("active"),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    encryptedSecret: text("encrypted_secret"),
    secretPreview: text("secret_preview"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (i) => [
    index("integrations_workspace_idx").on(i.workspaceId),
    index("integrations_workspace_provider_idx").on(i.workspaceId, i.provider),
    uniqueIndex("integrations_workspace_provider_name_idx").on(
      i.workspaceId,
      i.provider,
      i.name
    ),
  ]
)

export const repositories = pgTable(
  "repositories",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: repositoryProvider("provider").notNull().default("github"),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    url: text("url").notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    githubInstallationId: text("github_installation_id"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (r) => [
    index("repositories_workspace_idx").on(r.workspaceId),
    index("repositories_workspace_provider_idx").on(r.workspaceId, r.provider),
    uniqueIndex("repositories_workspace_provider_full_name_idx").on(
      r.workspaceId,
      r.provider,
      r.fullName
    ),
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
    // Plans are linked below; repositories are optional per project.
    repositoryId: text("repository_id").references(() => repositories.id, {
      onDelete: "set null",
    }),
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
    index("projects_slug_idx").on(p.slug),
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
    // Optional task linkage — indexed so the task timeline doesn't scan jsonb.
    taskId: text("task_id"),
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
    index("activity_events_task_idx").on(a.taskId),
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
  (p) => [
    index("plans_project_idx").on(p.projectId),
    index("plans_workspace_project_status_idx").on(
      p.workspaceId,
      p.projectId,
      p.status
    ),
  ]
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
    index("tasks_workspace_project_status_idx").on(
      t.workspaceId,
      t.projectId,
      t.status
    ),
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
// Decisions (spec §12.15) — durable record of choices made on a project
// ---------------------------------------------------------------------------

export const decisions = pgTable(
  "decisions",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // Optional links to the task/run that produced the decision.
    taskId: text("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    // FK target (agent_runs) added in Phase 3.
    runId: text("run_id"),
    title: text("title").notNull(),
    body: text("body"),
    type: decisionType("type").notNull().default("other"),
    status: decisionStatus("status").notNull().default("proposed"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (d) => [
    index("decisions_project_idx").on(d.projectId),
    index("decisions_workspace_status_idx").on(d.workspaceId, d.status),
    index("decisions_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${d.title}, '') || ' ' || coalesce(${d.body}, ''))`
    ),
  ]
)

// ---------------------------------------------------------------------------
// Learnings (spec §12.16) — captured insights; some get promoted to patterns
// ---------------------------------------------------------------------------

export const learnings = pgTable(
  "learnings",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    // FK target (agent_runs) added in Phase 3.
    runId: text("run_id"),
    title: text("title").notNull(),
    body: text("body"),
    type: learningType("type").notNull().default("gotcha"),
    // 0-100 self-reported confidence (nullable = unspecified).
    confidence: integer("confidence"),
    tags: text("tags").array().notNull().default([]),
    stack: text("stack").array().notNull().default([]),
    // Set once a learning is promoted into a reusable pattern (spec §12.17).
    promotedToPattern: text("promoted_to_pattern"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (l) => [
    index("learnings_project_idx").on(l.projectId),
    index("learnings_workspace_type_idx").on(l.workspaceId, l.type),
    index("learnings_tags_idx").using("gin", l.tags),
    index("learnings_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${l.title}, '') || ' ' || coalesce(${l.body}, ''))`
    ),
  ]
)

// ---------------------------------------------------------------------------
// Patterns (spec §12.17) — reusable knowledge that compounds across projects
// ---------------------------------------------------------------------------

export const patterns = pgTable(
  "patterns",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    body: text("body"),
    appliesTo: text("applies_to"),
    // Free-form category (often mirrors a learning type).
    type: text("type"),
    tags: text("tags").array().notNull().default([]),
    stack: text("stack").array().notNull().default([]),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    // Provenance — where the pattern came from.
    sourceProjectId: text("source_project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    sourceTaskId: text("source_task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    sourceLearningId: text("source_learning_id"),
    // FK target (agent_runs) added in Phase 3.
    sourceRunId: text("source_run_id"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (p) => [
    index("patterns_workspace_idx").on(p.workspaceId),
    index("patterns_tags_idx").using("gin", p.tags),
    index("patterns_stack_idx").using("gin", p.stack),
    index("patterns_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${p.summary}, '') || ' ' || coalesce(${p.body}, '') || ' ' || coalesce(${p.appliesTo}, ''))`
    ),
  ]
)

// ---------------------------------------------------------------------------
// Context packs (spec §12.18, §13.7) — frozen, agent-ready task context.
// Immutable once `sent` (spec §25.3, §28.5).
// ---------------------------------------------------------------------------

export const contextPacks = pgTable(
  "context_packs",
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
    title: text("title").notNull(),
    body: text("body").notNull(),
    // What went into the pack (spec excerpts, decisions, learnings, patterns).
    sources: jsonb("sources"),
    tokenEstimate: integer("token_estimate").notNull().default(0),
    status: contextPackStatus("status").notNull().default("draft"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    // When the pack was frozen and handed to an agent (immutable thereafter).
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (c) => [
    index("context_packs_task_idx").on(c.taskId),
    index("context_packs_project_idx").on(c.projectId),
  ]
)

// ---------------------------------------------------------------------------
// Agent profiles (spec §12.10) — configured runner types
// ---------------------------------------------------------------------------

export const agentProfiles = pgTable(
  "agent_profiles",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: agentProfileType("type").notNull().default("manual"),
    description: text("description"),
    capabilities: text("capabilities").array().notNull().default([]),
    defaultModel: text("default_model"),
    configuration: jsonb("configuration"),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (p) => [index("agent_profiles_workspace_idx").on(p.workspaceId)]
)

// ---------------------------------------------------------------------------
// Agent runs (spec §12.11) — a single execution attempt against a task
// ---------------------------------------------------------------------------

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    profileId: text("profile_id").references(() => agentProfiles.id, {
      onDelete: "set null",
    }),
    runnerType: text("runner_type").notNull().default("manual"),
    externalRunnerId: text("external_runner_id"),
    status: agentRunStatus("status").notNull().default("created"),
    prompt: text("prompt"),
    contextPackId: text("context_pack_id").references(() => contextPacks.id, {
      onDelete: "set null",
    }),
    branchName: text("branch_name"),
    // FK target (pull_requests) intentionally omitted to avoid a circular FK;
    // pull_requests.run_id is the linking column.
    pullRequestId: text("pull_request_id"),
    summary: text("summary"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (r) => [
    index("agent_runs_project_idx").on(r.projectId),
    index("agent_runs_task_idx").on(r.taskId),
    index("agent_runs_workspace_status_idx").on(r.workspaceId, r.status),
  ]
)

// ---------------------------------------------------------------------------
// Agent run events (spec §12.12) — append-only run timeline (no update/delete)
// ---------------------------------------------------------------------------

export const agentRunEvents = pgTable(
  "agent_run_events",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    type: agentRunEventType("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    createdAt: createdAt(),
  },
  (e) => [index("agent_run_events_run_idx").on(e.runId)]
)

// ---------------------------------------------------------------------------
// Pull requests (spec §12.13) — tracked PRs linked to project/task/run.
// Manual linking now; webhook-driven in Phase 5.
// ---------------------------------------------------------------------------

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    runId: text("run_id").references(() => agentRuns.id, {
      onDelete: "set null",
    }),
    repositoryId: text("repository_id").references(() => repositories.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull().default("github"),
    externalId: text("external_id"),
    number: integer("number"),
    title: text("title").notNull(),
    url: text("url"),
    state: pullRequestState("state").notNull().default("open"),
    author: text("author"),
    branch: text("branch"),
    baseBranch: text("base_branch"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    mergedAt: timestamp("merged_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (pr) => [
    index("pull_requests_project_idx").on(pr.projectId),
    index("pull_requests_task_idx").on(pr.taskId),
    index("pull_requests_run_idx").on(pr.runId),
    index("pull_requests_repository_idx").on(pr.repositoryId),
  ]
)
