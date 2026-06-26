"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { apiSend } from "@/lib/client"
import { TASK_STATUSES } from "@/lib/enums"
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
  const groups = TASK_STATUSES.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)

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
          No tasks yet. Create one, or generate tasks from a spec.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.status} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {labelize(group.status)} ({group.items.length})
              </p>
              <div className="divide-y divide-border rounded-xl border border-border">
                {group.items.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${slug}/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="truncate text-sm">{task.title}</span>
                    <Badge variant="outline" className="shrink-0">
                      {labelize(task.priority)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
