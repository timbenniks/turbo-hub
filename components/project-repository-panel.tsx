"use client"

import { useRouter } from "next/navigation"
import { ExternalLink, GitBranch, LinkIcon } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { apiSend } from "@/lib/client"
import type { Repository } from "@/lib/services/repositories"

export function ProjectRepositoryPanel({
  projectId,
  repository,
}: {
  projectId: string
  repository: Repository | null
}) {
  const router = useRouter()
  const { busy, run } = useAsyncAction()

  async function linkRepository(values: Record<string, string>) {
    const ok = await run(
      () =>
        apiSend(`/api/projects/${projectId}/repository`, "POST", {
          url: values.url || undefined,
          defaultBranch: values.defaultBranch || "main",
        }),
      "Repository linked"
    )
    if (ok) router.refresh()
    return ok
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
            Repository
          </h2>
          {repository ? (
            <div className="space-y-1">
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm hover:underline"
              >
                {repository.fullName}
                <ExternalLink className="size-3.5" />
              </a>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitBranch className="size-3.5" />
                {repository.defaultBranch}
              </p>
            </div>
          ) : (
            <p className="max-w-xs text-sm text-muted-foreground">
              Repo not linked. Link one to include setup commands, branch naming,
              and PR tracking in agent context packs.
            </p>
          )}
        </div>

        <FormDialog
          title={repository ? "Change repository" : "Link repository"}
          submitLabel="Link"
          trigger={
            <Button size="sm" variant={repository ? "outline" : "default"}>
              <LinkIcon />
              {repository ? "Change" : "Link repo"}
            </Button>
          }
          disabled={busy}
          onSubmit={linkRepository}
        >
          <Field label="GitHub repository URL" htmlFor="repo-url">
            <Input
              id="repo-url"
              name="url"
              type="url"
              placeholder="https://github.com/owner/repo"
              required
              autoFocus
            />
          </Field>
          <Field label="Default branch" htmlFor="repo-default-branch">
            <Input
              id="repo-default-branch"
              name="defaultBranch"
              defaultValue={repository?.defaultBranch ?? "main"}
            />
          </Field>
        </FormDialog>
      </div>
    </section>
  )
}
