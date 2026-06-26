"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/lib/enums"
import { labelize } from "@/lib/labels"
import { cn } from "@/lib/utils"
import {
  projectCreateSchema,
  type ProjectCreateInput,
} from "@/lib/validation/projects"

// Form values use the schema's *input* type (fields with defaults are optional
// pre-parse); onSubmit receives the parsed *output* type.
type FormValues = z.input<typeof projectCreateSchema>

type TagOption = { id: string; name: string; color: string | null }

type ExistingProject = {
  id: string
  name: string
  description: string | null
  status: (typeof PROJECT_STATUSES)[number]
  priority: (typeof PROJECT_PRIORITIES)[number]
  type: (typeof PROJECT_TYPES)[number]
  stack: string[]
  goal: string | null
  constraints: string | null
  notes: string | null
  tags: TagOption[]
}

type Props = {
  tags?: TagOption[]
  project?: ExistingProject
  trigger: React.ReactNode
}

const EMPTY_TAGS: TagOption[] = []

export function ProjectFormDialog({ tags = EMPTY_TAGS, project, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [fetchedTags, setFetchedTags] = React.useState<TagOption[] | null>(null)
  const isEdit = Boolean(project)
  const availableTags = fetchedTags ?? tags
  const tagsLoaded = fetchedTags !== null || tags.length > 0

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValues, unknown, ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: project
      ? {
          name: project.name,
          description: project.description ?? undefined,
          status: project.status,
          priority: project.priority,
          type: project.type,
          stack: project.stack,
          goal: project.goal ?? undefined,
          constraints: project.constraints ?? undefined,
          notes: project.notes ?? undefined,
          tagIds: project.tags.map((t) => t.id),
        }
      : {
          status: "idea",
          priority: "medium",
          type: "app",
          stack: [],
          tagIds: [],
        },
  })

  const selectedTagIds = useWatch({ control, name: "tagIds" }) ?? []

  React.useEffect(() => {
    if (!open || !isEdit || tagsLoaded) return

    let active = true
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then((nextTags: TagOption[]) => {
        if (!active) return
        setFetchedTags(nextTags)
      })
      .catch(() => {
        if (active) setFetchedTags([])
      })

    return () => {
      active = false
    }
  }, [isEdit, open, tagsLoaded])

  function toggleTag(id: string) {
    const next = selectedTagIds.includes(id)
      ? selectedTagIds.filter((t) => t !== id)
      : [...selectedTagIds, id]
    setValue("tagIds", next, { shouldDirty: true })
  }

  async function onSubmit(values: ProjectCreateInput) {
    const url = isEdit ? `/api/projects/${project!.id}` : "/api/projects"
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? "Something went wrong")
      return
    }
    toast.success(isEdit ? "Project updated" : "Project created")
    setOpen(false)
    if (!isEdit) reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project details."
              : "Create a project to start planning and dispatching work."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="project-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} autoFocus />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <NativeSelect
                    id="status"
                    className="w-full"
                    {...register("status")}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {labelize(s)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <NativeSelect
                    id="priority"
                    className="w-full"
                    {...register("priority")}
                  >
                    {PROJECT_PRIORITIES.map((s) => (
                      <option key={s} value={s}>
                        {labelize(s)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <NativeSelect
                    id="type"
                    className="w-full"
                    {...register("type")}
                  >
                    {PROJECT_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {labelize(s)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stack">Stack (comma separated)</Label>
                <Input
                  id="stack"
                  defaultValue={project?.stack.join(", ")}
                  onChange={(e) =>
                    setValue(
                      "stack",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal">Goal</Label>
                <Input id="goal" {...register("goal")} />
              </div>

              {availableTags.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((t) => {
                      const on = selectedTagIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.id)}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-xs transition-colors",
                            on
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
