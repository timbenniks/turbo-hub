"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/ui/status-chip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Task } from "@/lib/services/tasks"

export function TasksManager({
  slug,
  projectName,
  projectId,
  tasks,
  specs,
}: {
  slug: string
  projectName: string
  projectId: string
  tasks: Task[]
  specs: { id: string; title: string }[]
}) {
  const { busy, run } = useAsyncAction()
  const specTitleById = new Map(specs.map((spec) => [spec.id, spec.title]))

  const createTask = (
    <TaskFormDialog
      title="New task"
      specs={specs}
      trigger={
        <Button size="sm">
          <Plus />
          New task
        </Button>
      }
      disabled={busy}
      onSubmit={(values) =>
        run(
          () => apiSend(`/api/projects/${projectId}/tasks`, "POST", values),
          "Task created"
        )
      }
    />
  )

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={projectName}
        title="Tasks"
        meta={
          <span>
            {tasks.length === 0
              ? "No tasks yet"
              : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
          </span>
        }
        actions={createTask}
      />

      {tasks.length === 0 ? (
        <HelpfulEmptyState
          title="No tasks yet"
          description="Tasks are the unit of work an agent or human picks up — each carries acceptance criteria and produces runs and PRs. Create one, or have your agent add tasks via MCP."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Runner</TableHead>
                <TableHead>Spec</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="max-w-72">
                    <Link
                      href={`/projects/${slug}/tasks/${task.id}`}
                      prefetch
                      className="block truncate font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={task.status} />
                  </TableCell>
                  <TableCell>
                    <StatusChip value={task.priority} />
                  </TableCell>
                  <TableCell>{labelize(task.assigneeType)}</TableCell>
                  <TableCell>{labelize(task.runnerPreference)}</TableCell>
                  <TableCell className="max-w-44 truncate text-muted-foreground">
                    {task.specId ? specTitleById.get(task.specId) : "None"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {task.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
