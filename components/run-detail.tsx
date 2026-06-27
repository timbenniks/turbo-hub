"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, GitPullRequest, Plus, Sparkles } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { StatusChip } from "@/components/ui/status-chip"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { WorkLineage } from "@/components/work-lineage"
import { apiSend } from "@/lib/client"
import {
  AGENT_RUN_EVENT_TYPES,
  LEARNING_TYPES,
  type AgentRunStatus,
} from "@/lib/enums"
import { labelize } from "@/lib/labels"

const TERMINAL: AgentRunStatus[] = ["completed", "failed", "canceled"]

const LEARNING_TEMPLATE = `## What worked

## What failed

## What to repeat

## What to avoid

## Reusable ideas

## Conventions
`

export type RunEventView = {
  id: string
  type: string
  title: string
  body: string | null
  createdAt: string
}

export type RunPullRequestView = {
  id: string
  title: string
  url: string | null
  state: string
  branch: string | null
}

export function RunDetail({
  run,
  events,
  pullRequests,
  project,
  plan,
  spec,
  task,
  repository,
  contextPack,
  projectId,
  projectSlug,
}: {
  run: {
    id: string
    status: AgentRunStatus
    runnerType: string
    prompt: string | null
    branchName: string | null
    summary: string | null
    error: string | null
  }
  events: RunEventView[]
  pullRequests: RunPullRequestView[]
  project: { id: string; name: string; slug: string }
  plan: { id: string; title: string; status: string } | null
  spec: { id: string; title: string; status: string } | null
  task: {
    id: string
    title: string
    status: string
    acceptanceCriteria: string | null
  } | null
  repository: {
    id: string
    fullName: string
    url: string
    defaultBranch: string
  } | null
  contextPack: { id: string; title: string; status: string } | null
  projectId: string
  projectSlug: string
}) {
  const { busy, run: act } = useAsyncAction()
  const terminal = TERMINAL.includes(run.status)

  return (
    <div className="space-y-5">
      <Link
        href="/runs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All runs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Run</h2>
            <StatusChip value={run.status} />
            <Badge variant="outline">{labelize(run.runnerType)}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {task && (
              <Link
                href={`/projects/${projectSlug}/tasks/${task.id}`}
                className="hover:text-foreground"
              >
                Task: {task.title}
              </Link>
            )}
            {contextPack && <span>Context: {contextPack.title}</span>}
            {run.branchName && <span>Branch: {run.branchName}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!terminal && run.status === "created" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                act(() => apiSend(`/api/runs/${run.id}/start`), "Run started")
              }
            >
              Start
            </Button>
          )}
          {!terminal && (
            <>
              <CompleteDialog runId={run.id} disabled={busy} act={act} />
              <FailDialog runId={run.id} disabled={busy} act={act} />
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  act(
                    () => apiSend(`/api/runs/${run.id}/cancel`),
                    "Run canceled"
                  )
                }
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <WorkLineage
        items={[
          {
            label: "Project",
            title: project.name,
            href: `/projects/${project.slug}`,
          },
          plan
            ? {
                label: "Plan",
                title: plan.title,
                href: `/projects/${project.slug}/plan`,
                status: labelize(plan.status),
              }
            : { label: "Plan", title: "No linked plan", missing: true },
          spec
            ? {
                label: "Spec",
                title: spec.title,
                href: `/projects/${project.slug}/specs/${spec.id}`,
                status: labelize(spec.status),
              }
            : { label: "Spec", title: "No linked spec", missing: true },
          task
            ? {
                label: "Task",
                title: task.title,
                href: `/projects/${project.slug}/tasks/${task.id}`,
                status: labelize(task.status),
              }
            : { label: "Task", title: "No linked task", missing: true },
          {
            label: "Run",
            title: labelize(run.runnerType),
            status: labelize(run.status),
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Run context
          </p>
          <dl className="space-y-2 text-sm">
            <ContextRow label="Project" value={project.name} />
            <ContextRow label="Plan" value={plan?.title ?? "No linked plan"} />
            <ContextRow label="Spec" value={spec?.title ?? "No linked spec"} />
            <ContextRow label="Task" value={task?.title ?? "No linked task"} />
            <ContextRow
              label="Context pack"
              value={contextPack?.title ?? "No context pack"}
            />
          </dl>
        </div>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Execution target
          </p>
          <dl className="space-y-2 text-sm">
            <ContextRow
              label="Repository"
              value={repository?.fullName ?? "No repository linked"}
              href={repository?.url}
            />
            <ContextRow
              label="Base branch"
              value={repository?.defaultBranch ?? "Unknown"}
            />
            <ContextRow
              label="Run branch"
              value={run.branchName ?? "Not set"}
            />
            <ContextRow
              label="Pull requests"
              value={`${pullRequests.length} linked`}
            />
          </dl>
        </div>
      </div>

      {task?.acceptanceCriteria && (
        <div className="space-y-1 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Acceptance criteria
          </p>
          <p className="text-sm whitespace-pre-wrap">
            {task.acceptanceCriteria}
          </p>
        </div>
      )}

      {run.prompt && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Prompt</p>
          <p className="text-sm whitespace-pre-wrap">{run.prompt}</p>
        </div>
      )}
      {run.summary && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Summary</p>
          <Markdown>{run.summary}</Markdown>
        </div>
      )}
      {run.error && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive">Error</p>
          <p className="text-sm whitespace-pre-wrap text-destructive">
            {run.error}
          </p>
        </div>
      )}

      {/* Pull requests */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Pull requests
          </p>
          <LinkPrDialog runId={run.id} disabled={busy} act={act} />
        </div>
        {pullRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">None linked.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pullRequests.map((pr) => (
              <li
                key={pr.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <GitPullRequest className="size-4 text-muted-foreground" />
                {pr.url ? (
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {pr.title}
                  </a>
                ) : (
                  <span>{pr.title}</span>
                )}
                <StatusChip value={pr.state} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Learning extraction */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Learning extraction
          </p>
          <CaptureLearningDialog
            projectId={projectId}
            disabled={busy}
            act={act}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Capture what this run taught you, then promote it to a pattern from
          the project&apos;s Learnings tab.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Timeline</p>
          <AppendEventDialog runId={run.id} disabled={busy} act={act} />
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ol className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{labelize(e.type)}</Badge>
                    <span className="text-sm">{e.title}</span>
                  </div>
                  {e.body && (
                    <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {e.body}
                    </p>
                  )}
                </div>
                <time
                  dateTime={e.createdAt}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {new Date(e.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function ContextRow({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="block truncate hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="block truncate">{value}</span>
        )}
      </dd>
    </div>
  )
}

type Act = (fn: () => Promise<unknown>, msg: string) => Promise<boolean>

function CompleteDialog({
  runId,
  disabled,
  act,
}: {
  runId: string
  disabled?: boolean
  act: Act
}) {
  return (
    <FormDialog
      title="Complete run"
      submitLabel="Complete"
      trigger={
        <Button size="sm" variant="outline" disabled={disabled}>
          Complete
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        act(
          () => apiSend(`/api/runs/${runId}/complete`, "POST", values),
          "Run completed"
        )
      }
    >
      <Field label="Summary (Markdown)" htmlFor="run-summary">
        <Textarea id="run-summary" name="summary" rows={6} />
      </Field>
    </FormDialog>
  )
}

function FailDialog({
  runId,
  disabled,
  act,
}: {
  runId: string
  disabled?: boolean
  act: Act
}) {
  return (
    <FormDialog
      title="Fail run"
      submitLabel="Mark failed"
      trigger={
        <Button size="sm" variant="ghost" disabled={disabled}>
          Fail
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        act(
          () => apiSend(`/api/runs/${runId}/fail`, "POST", values),
          "Run failed"
        )
      }
    >
      <Field label="Error" htmlFor="run-error">
        <Textarea id="run-error" name="error" rows={5} />
      </Field>
    </FormDialog>
  )
}

function AppendEventDialog({
  runId,
  disabled,
  act,
}: {
  runId: string
  disabled?: boolean
  act: Act
}) {
  return (
    <FormDialog
      title="Append event"
      submitLabel="Append"
      trigger={
        <Button size="sm" variant="ghost" disabled={disabled}>
          <Plus />
          Add event
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        act(
          () => apiSend(`/api/runs/${runId}/events`, "POST", values),
          "Event appended"
        )
      }
    >
      <Field label="Type" htmlFor="event-type">
        <NativeSelect
          id="event-type"
          name="type"
          defaultValue="status_update"
          className="w-full"
        >
          {AGENT_RUN_EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {labelize(t)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Title" htmlFor="event-title">
        <Input id="event-title" name="title" required />
      </Field>
      <Field label="Details" htmlFor="event-body">
        <Textarea id="event-body" name="body" rows={4} />
      </Field>
    </FormDialog>
  )
}

function LinkPrDialog({
  runId,
  disabled,
  act,
}: {
  runId: string
  disabled?: boolean
  act: Act
}) {
  return (
    <FormDialog
      title="Link pull request"
      submitLabel="Link"
      trigger={
        <Button size="sm" variant="outline" disabled={disabled}>
          <GitPullRequest />
          Link PR
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        act(
          () => apiSend(`/api/runs/${runId}/pull-requests`, "POST", values),
          "Pull request linked"
        )
      }
    >
      <Field label="URL" htmlFor="pr-url">
        <Input
          id="pr-url"
          name="url"
          type="url"
          placeholder="https://github.com/owner/repo/pull/123"
          required
        />
      </Field>
      <Field label="Title" htmlFor="pr-title">
        <Input id="pr-title" name="title" />
      </Field>
      <Field label="Branch" htmlFor="pr-branch">
        <Input id="pr-branch" name="branch" />
      </Field>
    </FormDialog>
  )
}

function CaptureLearningDialog({
  projectId,
  disabled,
  act,
}: {
  projectId: string
  disabled?: boolean
  act: Act
}) {
  return (
    <FormDialog
      title="Capture learning"
      submitLabel="Save"
      trigger={
        <Button size="sm" variant="outline" disabled={disabled}>
          <Sparkles />
          Capture learning
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        act(
          () => apiSend(`/api/projects/${projectId}/learnings`, "POST", values),
          "Learning captured"
        )
      }
    >
      <Field label="Title" htmlFor="learning-title">
        <Input id="learning-title" name="title" required />
      </Field>
      <Field label="Type" htmlFor="learning-type">
        <NativeSelect
          id="learning-type"
          name="type"
          defaultValue="reusable_idea"
          className="w-full"
        >
          {LEARNING_TYPES.map((t) => (
            <option key={t} value={t}>
              {labelize(t)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Details (Markdown)" htmlFor="learning-body">
        <Textarea
          id="learning-body"
          name="body"
          rows={10}
          defaultValue={LEARNING_TEMPLATE}
        />
      </Field>
    </FormDialog>
  )
}
