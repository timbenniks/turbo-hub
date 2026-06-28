import { Webhooks } from "@octokit/webhooks"

import { AuthError } from "@/lib/auth/context"
import type { PullRequestState } from "@/lib/enums"
import {
  syncGitHubInstallationForWebhook,
  updateGitHubInstallationLifecycle,
} from "@/lib/services/githubInstallations"
import {
  recordGitHubCheckFromWebhook,
  upsertPullRequestFromGitHubWebhook,
} from "@/lib/services/pullRequests"

type GitHubRepositoryPayload = {
  name: string
  full_name: string
  html_url: string
  default_branch?: string | null
  owner: { login: string }
}

type GitHubPullRequestPayload = {
  action: string
  installation?: { id: number }
  repository: GitHubRepositoryPayload
  pull_request: {
    id: number
    number: number
    title: string
    html_url: string
    state: string
    draft?: boolean
    merged?: boolean
    user?: { login: string } | null
    head: { ref: string }
    base: { ref: string }
    body?: string | null
  }
}

type GitHubCheckPayload = {
  action: string
  installation?: { id: number }
  repository: GitHubRepositoryPayload
  check_run?: {
    name: string
    conclusion?: string | null
    html_url?: string | null
    pull_requests?: { number: number }[]
  }
  check_suite?: {
    app?: { name?: string | null } | null
    conclusion?: string | null
    pull_requests?: { number: number }[]
  }
}

type GitHubInstallationPayload = {
  action: string
  installation?: { id: number }
}

function webhookSecret() {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("GITHUB_APP_WEBHOOK_SECRET is required")
  }
  return secret
}

export async function verifyGitHubWebhook(input: {
  payload: string
  signature?: string | null
}) {
  if (!input.signature) throw new AuthError("Missing GitHub signature", 401)

  const webhooks = new Webhooks({ secret: webhookSecret() })
  const verified = await webhooks.verify(input.payload, input.signature)
  if (!verified) throw new AuthError("Invalid GitHub signature", 401)
}

function stateFromPullRequest(
  pullRequest: GitHubPullRequestPayload["pull_request"]
): PullRequestState {
  if (pullRequest.merged) return "merged"
  if (pullRequest.state === "closed") return "closed"
  if (pullRequest.draft) return "draft"
  return "open"
}

export async function handleGitHubWebhook(input: {
  event: string
  deliveryId?: string | null
  payload: unknown
}) {
  if (
    input.event === "installation" ||
    input.event === "installation_repositories"
  ) {
    return handleGitHubInstallationWebhook(input)
  }

  if (input.event === "check_run" || input.event === "check_suite") {
    return handleGitHubCheckWebhook(input)
  }

  if (input.event !== "pull_request") {
    return { ok: true, ignored: true, reason: "unsupported_event" }
  }

  const payload = input.payload as GitHubPullRequestPayload
  const pullRequest = payload.pull_request
  if (!pullRequest || !payload.repository) {
    throw new AuthError("Invalid pull_request payload", 400)
  }

  const result = await upsertPullRequestFromGitHubWebhook({
    repository: {
      owner: payload.repository.owner.login,
      name: payload.repository.name,
      fullName: payload.repository.full_name,
      url: payload.repository.html_url,
      defaultBranch: payload.repository.default_branch ?? "main",
      githubInstallationId: payload.installation?.id
        ? String(payload.installation.id)
        : undefined,
    },
    pullRequest: {
      externalId: String(pullRequest.id),
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.html_url,
      state: stateFromPullRequest(pullRequest),
      author: pullRequest.user?.login ?? null,
      branch: pullRequest.head.ref,
      baseBranch: pullRequest.base.ref,
      body: pullRequest.body,
    },
    action: payload.action,
    deliveryId: input.deliveryId ?? null,
  })

  return {
    ok: true,
    ignored: result.length === 0,
    pullRequestIds: result.map((row) => row.id),
  }
}

async function handleGitHubCheckWebhook(input: {
  event: string
  deliveryId?: string | null
  payload: unknown
}) {
  const payload = input.payload as GitHubCheckPayload
  if (!payload.repository) {
    throw new AuthError("Invalid GitHub check payload", 400)
  }

  const check =
    input.event === "check_run" ? payload.check_run : payload.check_suite
  if (!check) throw new AuthError("Invalid GitHub check payload", 400)

  const result = await recordGitHubCheckFromWebhook({
    repository: {
      fullName: payload.repository.full_name,
      githubInstallationId: payload.installation?.id
        ? String(payload.installation.id)
        : undefined,
    },
    pullRequests: check.pull_requests ?? [],
    name:
      input.event === "check_run"
        ? (payload.check_run?.name ?? "check run")
        : (payload.check_suite?.app?.name ?? "check suite"),
    conclusion: check.conclusion,
    htmlUrl: input.event === "check_run" ? payload.check_run?.html_url : null,
    action: payload.action,
    deliveryId: input.deliveryId ?? null,
  })

  return { ok: true, ignored: result === 0, checksRecorded: result }
}

async function handleGitHubInstallationWebhook(input: {
  event: string
  deliveryId?: string | null
  payload: unknown
}) {
  const payload = input.payload as GitHubInstallationPayload
  const installationId = payload.installation?.id
    ? String(payload.installation.id)
    : null
  if (!installationId) {
    throw new AuthError("Invalid GitHub installation payload", 400)
  }

  if (input.event === "installation_repositories") {
    const synced = await syncGitHubInstallationForWebhook(installationId)
    return {
      ok: true,
      ignored: synced === 0,
      installationsSynced: synced,
      action: payload.action,
    }
  }

  if (payload.action === "deleted") {
    const updated = await updateGitHubInstallationLifecycle({
      installationId,
      status: "disabled",
      reason: "deleted",
    })
    return { ok: true, ignored: updated === 0, installationsUpdated: updated }
  }

  if (payload.action === "suspend") {
    const updated = await updateGitHubInstallationLifecycle({
      installationId,
      status: "disabled",
      reason: "suspended",
    })
    return { ok: true, ignored: updated === 0, installationsUpdated: updated }
  }

  if (payload.action === "unsuspend") {
    const updated = await updateGitHubInstallationLifecycle({
      installationId,
      status: "active",
      reason: "unsuspended",
    })
    return { ok: true, ignored: updated === 0, installationsUpdated: updated }
  }

  return { ok: true, ignored: true, reason: "unsupported_installation_action" }
}
