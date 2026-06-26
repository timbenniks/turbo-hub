# Product requirements document: Agent-native project hub

## 1. Working title

**Agent-native project hub**

Potential product names:

- Turbo Foundry
- Build Relay
- Agent Foundry
- Project OS
- Workcell
- Runbook
- Assembly
- Forgeboard

For now, the product will be referred to as **the hub**.

---

## 2. One-line description

The hub is a project operating system for people building software with AI agents. It stores project intent, specs, tasks, agent runs, pull requests, decisions, learnings, and reusable patterns in one durable system.

---

## 3. External positioning

### 3.1 Short pitch

Building software with AI agents creates a new coordination problem. Work no longer happens only in tickets, meetings, and pull requests. It happens across local agents, cloud agents, chats, specs, branches, logs, reviews, and repeated experiments.

The hub gives every project a shared memory and execution layer. Humans define intent. Agents read the right context, execute scoped work, update status, attach pull requests, and write down what was learned. The next project gets smarter because the last one left a trail.

### 3.2 Plain-English pitch

Most project tools were built for teams of humans. They track tasks, owners, deadlines, and status.

But AI-assisted software work is different. Agents need specs, context, constraints, repo instructions, prior decisions, reusable patterns, and a safe way to report progress. Humans need to see what the agents did, why they did it, where the pull request is, and whether anything useful should be reused later.

The hub is a project workspace designed for that new way of building.

### 3.3 Opinionated pitch

Task trackers are not enough anymore.

When agents write code, the important questions change:

- What context did the agent receive?
- What task was it actually asked to do?
- Which files changed?
- Which pull request came out?
- Was the work accepted?
- What failed?
- What did we learn?
- What should future agents reuse?

The hub turns those questions into product primitives.

### 3.4 Tagline options

- The project hub for agent-built software.
- Where humans plan and agents build.
- A shared memory layer for software projects and coding agents.
- Project management for the agentic software era.
- Turn specs, tasks, agent runs, and PRs into durable project memory.
- Not another task board. A build memory system.
- Your projects should get smarter every time agents work on them.

### 3.5 Homepage hero draft

**Build software with agents without losing the plot.**

The hub gives every project a living plan, structured specs, executable tasks, agent run history, pull request tracking, decisions, learnings, and reusable patterns.

Send work to local or cloud agents, watch progress come back, and capture what each build teaches the next one.

### 3.6 Homepage subcopy draft

AI agents are changing how software gets built, but most teams still coordinate that work through scattered chats, tickets, branches, and PRs.

The hub brings the whole loop together:

- Plan the project.
- Generate specs.
- Break work into tasks.
- Dispatch work to agents.
- Track runs and pull requests.
- Review outcomes.
- Capture learnings.
- Reuse patterns across projects.

### 3.7 Developer-focused pitch

The hub gives coding agents a structured interface into your project system.

Agents can read project plans, specs, tasks, constraints, repo instructions, and prior learnings. They can claim tasks, create run records, update status, attach pull requests, and contribute post-run summaries. Humans stay in control, but agents get the context they need to do useful work.

Expose the hub through the web app, API, MCP server, and CLI.

### 3.8 Why now

Software work is shifting from “write every line yourself” to “define intent, scope work, supervise agents, and review outputs.”

That shift creates a new layer of work:

- Project memory
- Agent context
- Run tracking
- Human approval
- Reusable build knowledge
- Cross-project learning

Classic issue trackers were not designed for this. They assume humans carry the context in their heads. Agent-native work needs context to be explicit, structured, retrievable, and auditable.

---

## 4. Problem statement

People who build many projects with AI agents quickly run into coordination chaos.

Project plans live in one place. Specs live somewhere else. Agent prompts are lost in chat history. Pull requests exist in GitHub. Local agent work stays on one machine. Cloud agent runs have their own interface. Decisions are forgotten. Useful fixes are rediscovered over and over.

This creates several problems:

1. Agents do not have consistent project context.
2. Humans cannot easily see what agents are working on.
3. Pull requests are disconnected from the original project intent.
4. Successful patterns are not captured for reuse.
5. Failed attempts do not become future guidance.
6. Project knowledge stays scattered across tools.
7. Starting a new project repeats too much setup and decision-making.
8. Existing task tools track status but not agent execution memory.

The hub solves this by becoming the system of record for project intent, execution, and learning.

---

## 5. Product thesis

The future project management layer for software builders will not be a better kanban board.

It will be a durable coordination layer between humans, agents, code, plans, and outcomes.

The hub should make every project more useful after every run. The more projects a user builds, the more valuable the system becomes.

---

## 6. Target users

### 6.1 Primary user

Solo technical builder, founder, product engineer, developer experience lead, or product-minded engineer who builds many projects with AI coding tools.

This person:

- Uses GitHub.
- Uses Cursor, Claude Code, Codex-style tools, or local agents.
- Writes specs and prompts.
- Builds multiple side projects, prototypes, internal tools, demos, or product ideas.
- Wants agents to do more implementation work.
- Needs a durable memory layer across projects.

### 6.2 Secondary user

Small technical team working with cloud coding agents.

This group:

- Has multiple projects or repos.
- Wants tasks to be agent-executable.
- Needs humans to approve important work.
- Wants visibility into agent runs and PRs.
- Wants to standardize reusable build patterns.

### 6.3 Future user

Platform, developer experience, or engineering productivity team managing agent workflows across many internal projects.

This team:

- Wants governance and audit logs.
- Needs scoped access tokens.
- Wants project-level and workspace-level policies.
- Needs integration with GitHub, Jira, Slack, Linear, CI, and internal docs.
- Wants to measure agent usefulness over time.

---

## 7. User goals

Users want to:

1. Store all projects in one place.
2. Track project state, tasks, specs, and progress.
3. Use AI to turn ideas into plans, specs, and executable tasks.
4. Dispatch tasks to cloud or local agents.
5. See which agent is working on what.
6. Attach branches, commits, and pull requests to tasks.
7. Review completed work.
8. Capture decisions and learnings.
9. Reuse patterns from prior projects.
10. Query project memory before starting new work.
11. Keep humans in control of important actions.
12. Avoid rebuilding the same setup logic across projects.

---

## 8. Product goals

### 8.1 Functional goals

The product should:

- Provide GitHub login through Auth.js.
- Store users, workspaces, projects, specs, tasks, runs, and learnings in Neon Postgres.
- Let users create and manage projects.
- Let users create structured specs and task lists.
- Let users generate execution-ready context packs for agents.
- Let users dispatch tasks to a cloud agent.
- Let local or cloud agents update run status.
- Link pull requests to tasks and runs.
- Capture decisions, learnings, and reusable patterns.
- Expose agent-facing capabilities through MCP.
- Expose deterministic operations through an API and later a CLI.

### 8.2 Experience goals

The product should feel:

- Fast
- Clear
- Technical but not messy
- More like mission control than a ticket tracker
- Useful with one project
- Much more useful with many projects
- Safe enough to let agents write to it
- Structured enough for agents
- Comfortable enough for humans

### 8.3 Strategic goals

The product should become:

- A durable memory system for software builds.
- A coordination layer between humans and coding agents.
- A personal or team knowledge base of reusable build patterns.
- A project system that gets smarter as more work happens inside it.

---

## 9. Non-goals

The first version should not try to be:

- A full Linear replacement.
- A full Jira replacement.
- A general knowledge base.
- A full CI/CD platform.
- A GitHub replacement.
- A code review tool.
- A chat-only agent wrapper.
- A generic multi-agent research platform.
- An enterprise governance product from day one.
- A drag-and-drop workflow builder.

The first version should focus on project memory, task dispatch, run tracking, and reusable learnings.

---

## 10. Core concept

The hub has three layers:

### 10.1 Human planning layer

Humans define:

- Projects
- Goals
- Constraints
- Specs
- Tasks
- Priorities
- Acceptance criteria
- Review decisions

### 10.2 Agent execution layer

Agents can:

- Read project context
- Read task context
- Claim or start work
- Create run records
- Update status
- Attach artifacts
- Attach pull requests
- Write summaries
- Add learnings

### 10.3 Memory layer

The system captures:

- Decisions
- Learnings
- Reusable patterns
- Failed attempts
- Successful approaches
- References to prior projects
- Repo and stack conventions

This memory layer is the product’s long-term differentiator.

---

## 11. Core user journey

### 11.1 Create a project

The user creates a project with:

- Name
- Description
- Status
- Tags
- Stack
- Repository
- Goal
- Constraints
- Notes

The system creates a default project overview and optionally prompts the user to generate a plan.

### 11.2 Generate a plan

The user describes what they want to build.

The assistant generates:

- Product summary
- Goals
- Non-goals
- User journeys
- Technical assumptions
- Suggested milestones
- Open questions
- Initial task candidates

The user can edit and approve the plan.

### 11.3 Create specs

The user creates one or more specs.

A spec contains:

- Problem
- Goal
- Scope
- User stories
- Data requirements
- UX requirements
- API requirements
- Acceptance criteria
- Risks
- Implementation notes

Specs can be versioned.

### 11.4 Break specs into tasks

The user or assistant creates tasks from a spec.

Each task has:

- Title
- Description
- Status
- Priority
- Acceptance criteria
- Dependencies
- Related spec
- Suggested runner
- Context requirements

### 11.5 Generate a context pack

Before sending a task to an agent, the hub creates a context pack.

The context pack contains:

- Project summary
- Current project status
- Relevant plan sections
- Relevant spec sections
- Task description
- Acceptance criteria
- Repo information
- Commands to run
- Coding conventions
- Related decisions
- Related learnings
- Reusable patterns
- Guardrails
- Expected update format

The user can review and edit the context pack before dispatch.

### 11.6 Dispatch to an agent

The user sends the task to a runner.

Supported runner types:

- Cursor Cloud Agent
- Local Claude Agent SDK runner
- Manual runner
- Future custom runner

The hub creates an agent run record.

### 11.7 Track run progress

The run has a timeline.

Events can include:

- Run created
- Context pack generated
- Agent started
- Status updated
- Files changed
- Branch created
- Pull request opened
- Checks running
- Checks passed
- Checks failed
- Agent blocked
- Human input requested
- Run completed
- Run failed
- Learning extracted

### 11.8 Review output

The user reviews:

- Summary
- PR link
- Changed files
- Agent notes
- Acceptance criteria status
- Open questions
- Risks
- Suggested follow-up tasks

The user can mark the task as:

- Accepted
- Needs changes
- Blocked
- Superseded
- Done manually

### 11.9 Extract learnings

After a run, the system asks:

- What worked?
- What failed?
- What should be repeated?
- What should be avoided?
- Did this create a reusable pattern?
- Should this update project conventions?

The user can promote a learning to a pattern.

### 11.10 Reuse patterns

When a future project or task is created, the hub suggests relevant patterns based on:

- Tags
- Stack
- Project type
- Task type
- Prior usage
- Similar specs
- Similar failures
- Manual selection

---

## 12. Product objects

### 12.1 User

A person using the app.

Fields:

- ID
- Name
- Email
- Image
- GitHub identity
- Created at
- Updated at

### 12.2 Workspace

A workspace groups users, projects, integrations, API keys, and policies.

Fields:

- ID
- Name
- Slug
- Owner ID
- Created at
- Updated at

### 12.3 Workspace member

Connects users to workspaces.

Fields:

- ID
- Workspace ID
- User ID
- Role
- Created at
- Updated at

Roles:

- Owner
- Admin
- Member
- Viewer

### 12.4 Project

A software project, product idea, prototype, internal tool, or repo-centered initiative.

Fields:

- ID
- Workspace ID
- Name
- Slug
- Description
- Status
- Health
- Priority
- Type
- Stack
- Repository ID
- Current plan ID
- Created by
- Created at
- Updated at
- Archived at

Statuses:

- Idea
- Scoping
- Planned
- Building
- Review
- Shipped
- Paused
- Blocked
- Archived

Health values:

- Unknown
- Good
- At risk
- Blocked

Priorities:

- Low
- Medium
- High
- Urgent

Types:

- App
- Website
- CLI
- SDK
- MCP server
- Internal tool
- Automation
- Experiment
- Library
- Content project
- Other

### 12.5 Tag

A reusable taxonomy item.

Fields:

- ID
- Workspace ID
- Name
- Slug
- Color
- Created at
- Updated at

Examples:

- Next.js
- Drizzle
- Neon
- AI
- MCP
- CLI
- Contentstack
- Internal
- Demo
- Production
- Prototype
- Mobile
- Agent-built

### 12.6 Plan

A structured description of what the project is and how it should be approached.

Fields:

- ID
- Project ID
- Title
- Summary
- Goals
- Non-goals
- Constraints
- Milestones
- Open questions
- Status
- Version
- Created by
- Created at
- Updated at

Statuses:

- Draft
- Active
- Superseded
- Archived

### 12.7 Spec

A detailed implementation or feature specification.

Fields:

- ID
- Project ID
- Plan ID
- Title
- Summary
- Problem
- Goal
- Scope
- Non-goals
- User stories
- UX requirements
- Data requirements
- API requirements
- Acceptance criteria
- Risks
- Implementation notes
- Status
- Version
- Created by
- Created at
- Updated at

Statuses:

- Draft
- Ready
- In progress
- Implemented
- Superseded
- Archived

### 12.8 Task

An executable unit of work.

Fields:

- ID
- Project ID
- Spec ID
- Parent task ID
- Title
- Description
- Status
- Priority
- Assignee type
- Assignee ID
- Runner preference
- Acceptance criteria
- Context notes
- Branch name
- Pull request ID
- Created by
- Created at
- Updated at
- Completed at

Statuses:

- Backlog
- Ready
- Claimed
- Running
- In review
- Needs changes
- Done
- Blocked
- Canceled

Assignee types:

- Human
- Agent
- Unassigned

Runner preferences:

- Manual
- Cursor cloud
- Claude local
- Custom

### 12.9 Task dependency

Represents ordering between tasks.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Depends on task ID
- Created at

Dependency types:

- Blocks
- Related
- Duplicates
- Supersedes

### 12.10 Agent profile

A configured agent or runner type.

Fields:

- ID
- Workspace ID
- Name
- Type
- Description
- Capabilities
- Default model
- Configuration
- Is active
- Created at
- Updated at

Types:

- Cursor cloud
- Claude local
- Manual
- Custom API
- Future runner

Capabilities:

- Read project context
- Write project status
- Create branch
- Create PR
- Edit files
- Run commands
- Add learnings
- Request human approval

### 12.11 Agent run

A single execution attempt against a task.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Agent profile ID
- Runner type
- External runner ID
- Status
- Prompt
- Context pack ID
- Branch name
- Pull request ID
- Summary
- Error
- Started at
- Completed at
- Created by
- Created at
- Updated at

Statuses:

- Created
- Queued
- Running
- Waiting for input
- Waiting for review
- Completed
- Failed
- Canceled

### 12.12 Agent run event

Append-only event log for a run.

Fields:

- ID
- Run ID
- Type
- Title
- Body
- Metadata
- Created at

Event types:

- Run created
- Agent started
- Status update
- Tool call
- File change
- Branch created
- PR opened
- PR updated
- Check passed
- Check failed
- Human input requested
- Error
- Completed
- Learning added

### 12.13 Pull request

A tracked pull request linked to a project, task, or run.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Run ID
- Repository ID
- Provider
- External ID
- Number
- Title
- URL
- State
- Author
- Branch
- Base branch
- Created at
- Updated at
- Merged at
- Closed at

States:

- Open
- Draft
- Merged
- Closed

### 12.14 Repository

A connected code repository.

Fields:

- ID
- Workspace ID
- Provider
- Owner
- Name
- Full name
- URL
- Default branch
- GitHub installation ID
- Created at
- Updated at

### 12.15 Decision

A durable explanation of why something was chosen.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Run ID
- Title
- Body
- Decision type
- Status
- Created by
- Created at
- Updated at

Decision types:

- Architecture
- Product
- UX
- Technical
- Tooling
- Scope
- Security
- Other

Statuses:

- Proposed
- Accepted
- Rejected
- Superseded

### 12.16 Learning

A lesson captured from a project, task, or run.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Run ID
- Type
- Title
- Body
- Confidence
- Promoted to pattern
- Created by
- Created at
- Updated at

Types:

- Success
- Failure
- Gotcha
- Reusable idea
- Convention
- Anti-pattern

### 12.17 Pattern

A reusable approach that can be applied to future projects or tasks.

Fields:

- ID
- Workspace ID
- Source project ID
- Source task ID
- Source run ID
- Title
- Summary
- Body
- Applies to
- Stack
- Tags
- Usage count
- Last used at
- Created by
- Created at
- Updated at
- Archived at

Examples:

- Next.js app setup with Drizzle and Neon
- Cursor task brief format
- GitHub PR metadata convention
- MCP server route structure
- Auth.js workspace bootstrap pattern
- shadcn/ui layout convention

### 12.18 Context pack

A generated execution brief for an agent.

Fields:

- ID
- Workspace ID
- Project ID
- Task ID
- Spec ID
- Title
- Body
- Sources
- Token estimate
- Status
- Created by
- Created at
- Updated at

Statuses:

- Draft
- Approved
- Sent
- Archived

### 12.19 Activity event

General workspace and project activity feed.

Fields:

- ID
- Workspace ID
- Project ID
- Actor type
- Actor ID
- Type
- Title
- Body
- Metadata
- Created at

Actor types:

- User
- Agent
- System

### 12.20 API key

Scoped token for CLI, MCP, or agent access.

Fields:

- ID
- Workspace ID
- Name
- Token hash
- Scopes
- Last used at
- Expires at
- Created by
- Created at
- Revoked at

Example scopes:

- projects:read
- projects:write
- tasks:read
- tasks:write
- runs:read
- runs:write
- patterns:read
- patterns:write
- admin:integrations

### 12.21 MCP token

Agent-facing token used by MCP clients.

Fields:

- ID
- Workspace ID
- Name
- Token hash
- Allowed project IDs
- Allowed tool names
- Read only
- Last used at
- Expires at
- Created by
- Created at
- Revoked at

---

## 13. Key product areas

### 13.1 Dashboard

Purpose:

Give the user an overview of their projects and active agent work.

Must show:

- Active projects
- Recently updated projects
- Active agent runs
- Open pull requests
- Blocked tasks
- Recent learnings
- Suggested next actions

Primary actions:

- Create project
- Search projects
- Open active run
- Review PR
- Create new spec
- Dispatch next task

### 13.2 Projects

Purpose:

A structured home for each software project.

Must support:

- Create project
- Edit project
- Archive project
- Add tags
- Link repository
- View status and health
- View project activity
- View related specs, tasks, runs, PRs, decisions, learnings, and patterns

Project page tabs:

- Overview
- Plan
- Specs
- Tasks
- Runs
- Pull requests
- Decisions
- Learnings
- Patterns
- Settings

### 13.3 Plan editor

Purpose:

Store the current strategic intent for the project.

Must support:

- Create plan manually
- Generate plan from idea prompt
- Edit plan
- Mark plan active
- Supersede plan
- Link specs to plan

Nice-to-have:

- Show open questions
- Show assumptions
- Generate next suggested specs

### 13.4 Specs

Purpose:

Turn project intent into implementable descriptions.

Must support:

- Create spec
- Generate spec from project plan
- Edit spec
- Version spec
- Mark spec ready
- Generate tasks from spec
- Link spec to tasks
- Link spec to decisions

Spec template:

- Summary
- Problem
- Goal
- Scope
- Non-goals
- User stories
- UX requirements
- Data requirements
- API requirements
- Technical notes
- Acceptance criteria
- Risks
- Open questions

### 13.5 Tasks

Purpose:

Represent executable units of work for humans or agents.

Must support:

- Create task
- Edit task
- Create subtasks
- Add dependencies
- Assign to human or agent
- Set runner preference
- Generate context pack
- Dispatch to agent
- Link pull request
- Mark status
- Capture completion notes

Task page sections:

- Task summary
- Acceptance criteria
- Context
- Related spec
- Dependencies
- Context pack
- Agent runs
- Pull requests
- Learnings
- Activity

### 13.6 Agent runs

Purpose:

Track the lifecycle of a single agent attempt.

Must support:

- Create run
- Start run
- Update run status
- Append events
- Attach PR
- Attach artifacts
- Mark completed
- Mark failed
- Extract learning

Run page sections:

- Run status
- Runner details
- Task
- Context pack
- Timeline
- Pull request
- Summary
- Errors
- Learnings

### 13.7 Context packs

Purpose:

Give agents exactly the context they need to perform a task.

Must support:

- Generate from task
- Include relevant project/spec/task/pattern data
- Preview before sending
- Edit before dispatch
- Store exact version sent to agent
- Attach to run

Context pack structure:

1. Project
2. Goal
3. Current phase
4. Task
5. Acceptance criteria
6. Relevant spec excerpts
7. Repo details
8. Commands
9. Coding conventions
10. Relevant decisions
11. Relevant learnings
12. Reusable patterns
13. Guardrails
14. Expected output format

### 13.8 Patterns

Purpose:

Make prior project knowledge reusable.

Must support:

- Create pattern manually
- Promote learning to pattern
- Search patterns
- Filter by tag, stack, project type, and source project
- Attach pattern to project or task
- Track usage

Pattern page sections:

- Summary
- Applies to
- Instructions
- Source project
- Source run
- Related tags
- Usage history

### 13.9 Learnings

Purpose:

Capture lessons from project work and agent runs.

Must support:

- Create learning manually
- Generate learning from run summary
- Mark type
- Promote to pattern
- Link to project, task, and run

Learning types:

- Success
- Failure
- Gotcha
- Reusable idea
- Convention
- Anti-pattern

### 13.10 Decisions

Purpose:

Record important project choices and their rationale.

Must support:

- Create decision
- Link decision to project, spec, task, or run
- Mark accepted, rejected, proposed, or superseded
- Search decisions
- Include decisions in context packs

### 13.11 Integrations

Initial integrations:

- GitHub login through Auth.js
- GitHub repository and pull request tracking later
- Cursor Cloud Agent dispatch
- Local Claude Agent SDK runner
- MCP server
- CLI

Future integrations:

- Jira
- Linear
- Slack
- Vercel
- CI providers
- Local filesystem watchers
- Browser extension
- Content and docs systems

---

## 14. Auth and identity

### 14.1 Authentication approach

Use Auth.js with GitHub login.

GitHub login should be used for identity only at first.

The product should not request broad repository access during initial sign-in. Repository access should be handled later through a dedicated GitHub App or explicit integration setup.

### 14.2 User creation flow

When a user signs in for the first time:

1. Create user.
2. Create personal workspace.
3. Add user as workspace owner.
4. Redirect to onboarding or empty dashboard.

### 14.3 Session model

Use database sessions.

Session user object should include:

- User ID
- Name
- Email
- Image

### 14.4 Authorization model

Every project belongs to a workspace.

Every workspace has members.

Access checks should verify:

- User belongs to workspace.
- User role permits action.
- Resource belongs to workspace.
- Agent token scope permits action.

---

## 15. Agent-facing architecture

### 15.1 Principle

The core product should not be built around one agent vendor.

The app should have its own domain model and API. Agent integrations should be adapters.

### 15.2 Layers

Architecture:

- Web UI
- Domain services
- Database
- API routes
- MCP server
- CLI
- Agent runners

The MCP server, CLI, and UI should all use the same underlying domain services.

### 15.3 Agent runners

Initial runner types:

1. Manual
2. Cursor Cloud Agent
3. Local Claude Agent SDK

Future runner types:

- Codex-style cloud agent
- GitHub Copilot-style agent
- Custom webhook runner
- Local shell runner
- Team-specific internal agent

### 15.4 Runner abstraction

A runner should implement:

- Create run
- Send task
- Get status
- Cancel run
- Attach result
- Attach PR
- Normalize events

Runner interface concept:

```ts
type Runner = {
  type: string;
  createRun(input: CreateRunInput): Promise<CreateRunResult>;
  getRunStatus(externalId: string): Promise<RunStatusResult>;
  cancelRun(externalId: string): Promise<void>;
};
```

### 15.5 Agent permissions

Agents should never have unrestricted write access by default.

Agent tokens should be scoped by:

- Workspace
- Project
- Allowed tools
- Read/write mode
- Expiration
- Runner type

Examples:

- Read project and task context.
- Write run status.
- Add run events.
- Attach PR.
- Add learning.
- Cannot delete projects.
- Cannot edit billing.
- Cannot modify workspace members.

---

## 16. MCP server specification

### 16.1 MCP purpose

The MCP server gives agents a structured way to read project context and perform scoped actions.

MCP is the agent-facing adapter, not the core application architecture.

### 16.2 MCP resources

Resources should include:

```txt
project://{projectId}/overview
project://{projectId}/plan
project://{projectId}/specs
project://{projectId}/tasks
project://{projectId}/decisions
project://{projectId}/learnings
project://{projectId}/patterns
task://{taskId}/execution-brief
task://{taskId}/context-pack
run://{runId}/status
workspace://{workspaceId}/patterns
```

### 16.3 MCP tools

Tools should include:

```txt
list_projects
get_project
create_project
update_project_status

list_specs
get_spec
create_spec
update_spec

list_tasks
get_task
create_task
update_task_status
claim_task
complete_task

generate_context_pack
approve_context_pack

start_agent_run
update_agent_run_status
append_agent_run_event
attach_pull_request_to_run
complete_agent_run
fail_agent_run

create_decision
create_learning
promote_learning_to_pattern
search_patterns
find_related_projects
```

### 16.4 MCP safety rules

MCP tools must enforce:

- Authentication
- Token scopes
- Workspace access
- Project access
- Idempotency for repeated writes
- Audit logging
- Input validation
- Rate limits
- Clear error responses

### 16.5 MCP read-only mode

The system should support a read-only MCP token.

Read-only mode allows:

- List projects
- Read project
- Read specs
- Read tasks
- Read decisions
- Read learnings
- Search patterns
- Generate context preview

Read-only mode denies:

- Create project
- Update task
- Start run
- Add learning
- Attach PR
- Delete/archive operations

---

## 17. API specification

### 17.1 General rules

All API routes should:

- Require authentication or scoped API token.
- Validate input with Zod.
- Enforce workspace access.
- Return typed JSON.
- Write activity events for important mutations.
- Use idempotency keys for agent writes where appropriate.

### 17.2 Initial REST routes

Projects:

```txt
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
```

Tags:

```txt
GET    /api/tags
POST   /api/tags
PATCH  /api/tags/:tagId
DELETE /api/tags/:tagId
```

Plans:

```txt
GET    /api/projects/:projectId/plans
POST   /api/projects/:projectId/plans
GET    /api/plans/:planId
PATCH  /api/plans/:planId
```

Specs:

```txt
GET    /api/projects/:projectId/specs
POST   /api/projects/:projectId/specs
GET    /api/specs/:specId
PATCH  /api/specs/:specId
POST   /api/specs/:specId/generate-tasks
```

Tasks:

```txt
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
POST   /api/tasks/:taskId/generate-context-pack
POST   /api/tasks/:taskId/dispatch
```

Agent runs:

```txt
GET    /api/projects/:projectId/runs
POST   /api/tasks/:taskId/runs
GET    /api/runs/:runId
PATCH  /api/runs/:runId
POST   /api/runs/:runId/events
POST   /api/runs/:runId/complete
POST   /api/runs/:runId/fail
```

Pull requests:

```txt
GET    /api/projects/:projectId/pull-requests
POST   /api/runs/:runId/pull-requests
PATCH  /api/pull-requests/:pullRequestId
```

Learnings:

```txt
GET    /api/projects/:projectId/learnings
POST   /api/projects/:projectId/learnings
PATCH  /api/learnings/:learningId
POST   /api/learnings/:learningId/promote
```

Patterns:

```txt
GET    /api/patterns
POST   /api/patterns
GET    /api/patterns/:patternId
PATCH  /api/patterns/:patternId
POST   /api/patterns/search
```

Decisions:

```txt
GET    /api/projects/:projectId/decisions
POST   /api/projects/:projectId/decisions
PATCH  /api/decisions/:decisionId
```

Integrations:

```txt
GET    /api/integrations
POST   /api/integrations/cursor
POST   /api/integrations/github
DELETE /api/integrations/:integrationId
```

Webhooks:

```txt
POST   /api/webhooks/github
POST   /api/webhooks/cursor
```

API keys:

```txt
GET    /api/api-keys
POST   /api/api-keys
DELETE /api/api-keys/:apiKeyId
```

MCP tokens:

```txt
GET    /api/mcp-tokens
POST   /api/mcp-tokens
DELETE /api/mcp-tokens/:tokenId
```

---

## 18. CLI specification

The CLI should be a thin wrapper over the API.

### 18.1 CLI goals

The CLI should let humans and agents interact with the hub from local development environments.

### 18.2 Example commands

Projects:

```bash
hub projects list
hub projects create
hub projects show <project-id>
hub projects update <project-id>
```

Tasks:

```bash
hub tasks list --project <project-id>
hub tasks show <task-id>
hub tasks create --project <project-id>
hub tasks claim <task-id>
hub tasks status <task-id> running
hub tasks complete <task-id>
```

Context:

```bash
hub context generate <task-id>
hub context show <context-pack-id>
```

Runs:

```bash
hub runs start <task-id> --runner cursor
hub runs show <run-id>
hub runs event <run-id>
hub runs complete <run-id>
hub runs fail <run-id>
```

Patterns:

```bash
hub patterns search "next drizzle neon"
hub patterns create
hub patterns apply <pattern-id> --task <task-id>
```

Auth:

```bash
hub login
hub logout
hub whoami
```

### 18.3 CLI auth

The CLI should support:

- User login
- API key
- MCP token where appropriate
- Workspace selection

---

## 19. GitHub integration

### 19.1 Initial auth

Use GitHub OAuth only for login.

Do not request broad repo scopes during login.

### 19.2 Repository integration

Repository integration should eventually use a GitHub App.

The GitHub App should allow:

- Selecting repositories
- Reading repository metadata
- Reading pull requests
- Receiving webhooks
- Commenting on PRs if permitted
- Creating branches or PRs only if explicitly allowed

### 19.3 Pull request tracking

PRs should be linked to tasks and runs through:

- Branch naming convention
- PR body metadata
- GitHub webhook events
- Manual linking fallback

Branch naming convention:

```txt
task/{taskSlug}-{shortTaskId}
```

PR metadata convention:

```html
<!-- hub_task_id: TASK_ID -->
<!-- hub_run_id: RUN_ID -->
<!-- hub_project_id: PROJECT_ID -->
```

### 19.4 GitHub events to handle

Events:

- Pull request opened
- Pull request synchronized
- Pull request closed
- Pull request merged
- Check run completed
- Check suite completed
- Issue comment created

---

## 20. Cursor cloud integration

### 20.1 Purpose

Cursor Cloud Agent should be the first cloud runner.

### 20.2 User setup

The user adds a Cursor API key in integration settings.

The key should be encrypted at rest.

### 20.3 Dispatch flow

When a user dispatches a task to Cursor:

1. Generate context pack.
2. User reviews context pack.
3. Create agent run in the hub.
4. Send prompt and repo configuration to Cursor.
5. Store external Cursor run ID.
6. Mark run queued or running.
7. Poll or receive updates where available.
8. Attach PR when created.
9. Update task status.
10. Extract learning after completion.

### 20.4 Cursor prompt structure

Prompt should include:

- Task title
- Task description
- Project summary
- Spec excerpt
- Acceptance criteria
- Repo setup
- Commands to run
- Relevant patterns
- Guardrails
- Expected PR format
- Expected update format

### 20.5 Cursor result handling

The hub should store:

- External run ID
- Status
- Branch name
- PR URL
- Summary
- Errors
- Completion notes
- Follow-up tasks
- Learnings

---

## 21. Local Claude runner

### 21.1 Purpose

The local Claude runner allows users to run agent tasks against local repos.

### 21.2 Runtime shape

A local runner can be:

- A CLI command
- A local daemon
- A desktop helper later
- A script using Claude Agent SDK

### 21.3 Flow

1. User installs local runner.
2. User authenticates runner with hub API key.
3. Runner fetches available tasks or receives a task ID.
4. Runner fetches context pack.
5. Runner runs Claude Agent SDK locally.
6. Runner updates hub with run status and events.
7. Runner attaches branch, summary, and learnings.

### 21.4 Local runner constraints

The local runner should:

- Ask for approval before destructive operations.
- Respect project-level commands.
- Log events back to the hub.
- Allow cancellation.
- Avoid leaking secrets into run logs.
- Store exact context pack used.

---

## 22. AI features

### 22.1 Chat with project

A project-level assistant should help users:

- Clarify project idea
- Create plan
- Create spec
- Create tasks
- Summarize status
- Find blockers
- Find related patterns
- Prepare agent context
- Review run output

### 22.2 Structured generation

The app should use structured generation for:

- Project plans
- Specs
- Task lists
- Context packs
- Run summaries
- Learning extraction
- Pattern suggestions

### 22.3 Suggested prompts

Project prompts:

```txt
Help me turn this idea into a project plan.
What should v1 include?
What should I cut from scope?
What are the biggest risks?
Create a spec for the first milestone.
Break this spec into agent-executable tasks.
```

Task prompts:

```txt
Generate a context pack for this task.
Find patterns that apply to this task.
Make this task smaller.
Write acceptance criteria.
Send this to Cursor.
```

Review prompts:

```txt
Summarize what changed in this PR.
Does this run satisfy the task?
Extract learnings from this run.
Create follow-up tasks.
Promote this learning to a reusable pattern.
```

### 22.4 Memory search

Initial search can use relational filters and full-text search.

Later search can add embeddings for semantic matching across:

- Specs
- Tasks
- Decisions
- Learnings
- Patterns
- Context packs
- Run summaries

---

## 23. UI requirements

### 23.1 Design principles

The UI should be:

- Dense but readable
- Fast to scan
- Useful on desktop first
- Comfortable for technical users
- Calm, not gamified
- Built around projects and runs, not generic tasks
- Clear about what humans approved and what agents did

### 23.2 Navigation

Primary nav:

- Dashboard
- Projects
- Runs
- Patterns
- Decisions
- Agents
- Integrations
- Settings

Secondary project nav:

- Overview
- Plan
- Specs
- Tasks
- Runs
- PRs
- Decisions
- Learnings
- Patterns
- Settings

### 23.3 Dashboard components

Components:

- Project grid/list
- Active runs card
- Open PRs card
- Blocked tasks card
- Recent learnings card
- Suggested next actions
- Search

### 23.4 Project overview components

Components:

- Project header
- Status and health
- Tags
- Current goal
- Active plan
- Current phase
- Open tasks
- Active runs
- Open PRs
- Recent decisions
- Recent learnings
- Suggested actions

### 23.5 Task page components

Components:

- Task header
- Status
- Acceptance criteria
- Related spec
- Dependencies
- Context pack preview
- Dispatch panel
- Agent run timeline
- Pull request card
- Learnings panel
- Activity feed

### 23.6 Run page components

Components:

- Run status header
- Runner details
- Task link
- Context pack link
- Timeline
- PR link
- Summary
- Error state
- Learning extraction panel

### 23.7 Patterns page components

Components:

- Pattern search
- Tag filters
- Stack filters
- Pattern cards
- Source project links
- Usage count
- Apply-to-task action

---

## 24. Technical stack

### 24.1 Application

- Next.js 16.x
- TypeScript
- Tailwind CSS
- shadcn/ui primitives
- Vercel AI SDK for chat and structured generation
- Auth.js for authentication
- Drizzle ORM
- Neon Postgres
- Vercel deployment

### 24.2 Integrations

- GitHub OAuth login
- GitHub App later for repo and PR integration
- Cursor Cloud Agent API
- Claude Agent SDK for local runner
- MCP server
- CLI

### 24.3 Suggested libraries

- Zod for validation
- Drizzle Kit for migrations
- Octokit for GitHub integration
- React Hook Form for complex forms
- TanStack Table for data tables
- date-fns for dates
- Recharts for lightweight charts if needed

---

## 25. Database outline

### 25.1 Auth tables

- users
- accounts
- sessions
- verification_tokens

### 25.2 App tables

- workspaces
- workspace_members
- projects
- tags
- project_tags
- repositories
- plans
- specs
- spec_versions
- tasks
- task_dependencies
- agent_profiles
- agent_runs
- agent_run_events
- pull_requests
- decisions
- learnings
- patterns
- context_packs
- activity_events
- api_keys
- mcp_tokens
- integrations

### 25.3 Data design rules

- Every app table should include workspace_id where relevant.
- Most project-level tables should include project_id.
- Agent run events should be append-only.
- Important generated content should be versioned or stored as immutable snapshots.
- Context packs sent to agents should never be overwritten.
- Mutations from agents should create activity events.
- Deletions should usually be soft deletes or archive operations.

---

## 26. Security requirements

### 26.1 User security

- GitHub login through Auth.js.
- Database-backed sessions.
- Workspace-based authorization.
- Role checks for workspace actions.

### 26.2 Agent security

- Scoped API keys.
- Scoped MCP tokens.
- Read-only token support.
- Expiring tokens.
- Token hashing.
- Encrypted integration secrets.
- Audit logs for all agent writes.
- Idempotency keys for write operations.
- Rate limits for API and MCP tools.

### 26.3 Integration security

- Store external API keys encrypted.
- Never expose provider tokens in client components.
- Never include secrets in context packs.
- Redact logs before storing.
- Require explicit user approval before dispatching agent work to external services.
- Validate webhook signatures where supported.

### 26.4 Human control

Important actions should require human approval:

- Dispatching a task to an external agent
- Connecting a repo
- Creating a GitHub App installation
- Sending broad project context to a cloud runner
- Promoting generated learnings to patterns
- Archiving projects
- Creating write-capable tokens

---

## 27. Observability and audit

### 27.1 Activity feed

The product should maintain an activity feed for:

- Project changes
- Spec changes
- Task status changes
- Run events
- PR events
- Learning creation
- Pattern promotion
- Integration changes

### 27.2 Run timeline

Agent runs need a dedicated timeline because users need to understand what happened.

Timeline entries should be human-readable and machine-readable.

### 27.3 Audit log

Audit log should include:

- Actor
- Action
- Resource
- Timestamp
- Metadata
- IP/user agent where relevant
- Token ID where relevant

---

## 28. Acceptance criteria

### 28.1 Authentication

- User can sign in with GitHub.
- First sign-in creates a personal workspace.
- User can sign out.
- Protected pages require authentication.
- Session includes user ID.

### 28.2 Projects

- User can create a project.
- User can edit a project.
- User can archive a project.
- User can tag a project.
- User can view project overview.
- User can search/filter projects.

### 28.3 Specs

- User can create a spec.
- User can edit a spec.
- User can link spec to project.
- User can mark spec as ready.
- User can generate tasks from a spec.

### 28.4 Tasks

- User can create task.
- User can create subtasks.
- User can update task status.
- User can link task to spec.
- User can add acceptance criteria.
- User can generate context pack from task.

### 28.5 Context packs

- User can generate context pack.
- User can preview context pack.
- User can edit context pack before dispatch.
- Context pack is stored immutably once sent to agent.
- Context pack includes relevant patterns and learnings.

### 28.6 Agent runs

- User can start manual run.
- User can start Cursor run once integration is configured.
- Run has status.
- Run has timeline.
- Run can attach PR.
- Run can complete or fail.
- Run can produce learning.

### 28.7 Patterns and learnings

- User can create learning.
- User can promote learning to pattern.
- User can search patterns.
- Context pack generation can include relevant patterns.

### 28.8 MCP

- MCP server can expose project resources.
- MCP server can expose task resources.
- MCP server can expose read-only tools.
- MCP server can expose scoped write tools.
- MCP writes create audit events.

### 28.9 API

- API validates input.
- API enforces workspace access.
- API supports scoped tokens for agents.
- API returns useful errors.

---

## 29. Success metrics

### 29.1 Product usage

- Number of projects created.
- Number of specs created.
- Number of tasks created.
- Number of context packs generated.
- Number of agent runs started.
- Number of PRs attached.
- Number of learnings created.
- Number of patterns promoted.
- Number of patterns reused.

### 29.2 Quality metrics

- Percentage of dispatched tasks that result in PRs.
- Percentage of PRs accepted or merged.
- Percentage of tasks requiring rework.
- Number of repeated failures reduced over time.
- Average time from task creation to PR.
- Average time from idea to first executable task.

### 29.3 Memory value metrics

- Number of learnings reused in future context packs.
- Number of patterns reused across projects.
- Number of new projects that reuse prior project knowledge.
- Number of agent runs that cite prior patterns.

---

## 30. Risks

### 30.1 Product risks

Risk: The product becomes a generic task tracker.

Mitigation: Keep the focus on context packs, agent runs, learnings, and reusable patterns.

Risk: The UI becomes too complex.

Mitigation: Start with a simple project page and make advanced objects progressively visible.

Risk: Users do not trust agents to write back to the hub.

Mitigation: Use scoped tokens, read-only mode, audit logs, and human approval.

Risk: The memory layer feels like extra admin work.

Mitigation: Extract learnings automatically from run summaries and let users approve/promote.

### 30.2 Technical risks

Risk: Agent integrations change quickly.

Mitigation: Use runner abstraction and keep provider-specific logic isolated.

Risk: MCP writes become unsafe.

Mitigation: Use scoped tools, idempotency, audit logs, and read-only default mode.

Risk: Context packs become too large.

Mitigation: Use relevance ranking, explicit sections, and token estimates.

Risk: GitHub integration gets complicated.

Mitigation: Start with manual PR linking or simple webhooks, then add GitHub App.

Risk: Generated specs/tasks are low quality.

Mitigation: Use structured templates, editable drafts, and human approval.

---

## 31. Open questions

1. Should the product be personal-first or workspace-first?
2. Should every project require a repository?
3. Should plans and specs be Markdown-first or structured form-first?
4. Should context packs be editable Markdown or generated structured documents?
5. Should Cursor dispatch be v1 or v1.5?
6. Should local Claude runner be a CLI, daemon, or desktop helper?
7. Should project memory use embeddings in v1 or later?
8. Should the hub support multiple workspaces in the first version?
9. Should patterns be global across workspace or manually attached to projects?
10. Should agents be allowed to create tasks, or only suggest them?
11. Should generated tasks require approval before appearing in the task list?
12. Should task status mirror GitHub PR state automatically?
13. Should GitHub App be required before Cursor dispatch?
14. Should there be a public API from v1, or private API first?
15. Should the CLI ship before MCP, or MCP before CLI?

---

## 32. Suggested implementation slicing

This document is intentionally larger than the first build. It can be sliced into phases.

Suggested slicing:

### Slice 1: foundation

- Next.js app
- Auth.js with GitHub login
- Drizzle and Neon
- Workspace bootstrap
- Project CRUD
- Tags
- Basic dashboard

### Slice 2: planning layer

- Plans
- Specs
- Tasks
- Project overview
- Spec-to-task generation
- Task pages

### Slice 3: context layer

- Context pack generator
- Decisions
- Learnings
- Patterns
- Pattern search
- Include patterns in context packs

### Slice 4: agent run layer

- Agent profiles
- Manual runs
- Run timeline
- Run events
- Run completion
- Learning extraction

### Slice 5: Cursor cloud dispatch

- Cursor integration settings
- Dispatch task to Cursor
- Store external run ID
- Track status
- Attach PR manually or automatically

### Slice 6: GitHub integration

- GitHub App setup
- Repository connection
- Pull request tracking
- Webhooks
- PR-to-task linking

### Slice 7: MCP server

- Read-only MCP resources
- Read-only tools
- Scoped write tools
- MCP token management
- Audit logging

### Slice 8: CLI and local runner

- CLI auth
- Project/task commands
- Context pack commands
- Run commands
- Local Claude runner integration

---

## 33. First build recommendation

The first meaningful demo should show:

1. Sign in with GitHub.
2. Create a project.
3. Generate a plan from an idea.
4. Create a spec.
5. Generate tasks.
6. Open a task.
7. Generate an agent context pack.
8. Start a manual or Cursor run.
9. Show run timeline.
10. Attach a PR.
11. Extract a learning.
12. Promote the learning to a pattern.
13. Start a second project and reuse that pattern.

That demo proves the core thesis:

The hub is not just where projects are tracked. It is where project knowledge compounds.

---

## 34. Build principles

1. Humans approve intent.
2. Agents execute scoped work.
3. Every run leaves evidence.
4. Every project can teach the next project.
5. Context should be explicit, not hidden in chat history.
6. MCP is an adapter, not the product core.
7. The API is the durable contract.
8. The database is the shared brain.
9. Pull requests are outputs, not the whole story.
10. The product should become more valuable as more projects pass through it.

---

## 35. Final product definition

The hub is an agent-native project operating system for software builders.

It combines project planning, specs, task management, agent dispatch, pull request tracking, and durable project memory into one system.

It helps humans define what should be built, gives agents the context to build it, tracks what happened, and captures what every build teaches the next one.
