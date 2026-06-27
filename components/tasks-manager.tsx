"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Task } from "@/lib/services/tasks"

export function TasksManager({
  slug,
  projectId,
  tasks,
  specs,
}: {
  slug: string
  projectId: string
  tasks: Task[]
  specs: { id: string; title: string }[]
}) {
  const { busy, run } = useAsyncAction()
  const specTitleById = new Map(specs.map((spec) => [spec.id, spec.title]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Tasks</h2>
        <TaskFormDialog
          title="New task"
          specs={specs}
          trigger={
            <Button>
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
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No tasks yet. Create one, or have your agent add tasks via MCP.
        </p>
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
                    <Badge variant="secondary">{labelize(task.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{labelize(task.priority)}</Badge>
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
