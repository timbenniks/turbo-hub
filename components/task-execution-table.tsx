"use client"

import Link from "next/link"

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
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"

export type ExecutionTask = {
  id: string
  title: string
  status: string
  priority: string
  runnerPreference: string
}

export type TaskPr = {
  state: string
  url: string | null
}

// Tasks that are finished or stopped — no point offering "Start run".
const RUNNABLE_DENY = new Set(["done", "canceled"])

export function TaskExecutionTable({
  slug,
  tasks,
  prByTaskId,
}: {
  slug: string
  tasks: ExecutionTask[]
  prByTaskId?: Record<string, TaskPr>
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Runner</TableHead>
            <TableHead>PR</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const pr = prByTaskId?.[task.id]
            return (
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
                <TableCell className="text-muted-foreground">
                  {labelize(task.runnerPreference)}
                </TableCell>
                <TableCell>
                  {pr ? (
                    <StatusChip value={pr.state} />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!RUNNABLE_DENY.has(task.status) ? (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            apiSend(`/api/tasks/${task.id}/runs`, "POST", {
                              runnerType: "manual",
                            }),
                          "Run started"
                        )
                      }
                    >
                      Start run
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
