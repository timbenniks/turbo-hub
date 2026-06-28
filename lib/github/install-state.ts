import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import { AuthError } from "@/lib/auth/context"

type GitHubInstallState = {
  userId: string
  workspaceId: string
  ts: number
  nonce: string
}

const MAX_AGE_MS = 15 * 60 * 1000

function stateSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is required for GitHub App install state")
  }
  return secret
}

function base64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url")
}

function sign(payload: string) {
  return createHmac("sha256", stateSecret()).update(payload).digest("base64url")
}

export function createGitHubInstallState(input: {
  userId: string
  workspaceId: string
}) {
  const payload = base64Url(
    JSON.stringify({
      ...input,
      ts: Date.now(),
      nonce: randomBytes(12).toString("base64url"),
    } satisfies GitHubInstallState)
  )
  return `${payload}.${sign(payload)}`
}

export function verifyGitHubInstallState(
  state: string | null,
  expected: { userId: string; workspaceId: string }
): GitHubInstallState {
  if (!state) throw new AuthError("Missing GitHub install state", 400)

  const [payload, signature] = state.split(".")
  if (!payload || !signature) {
    throw new AuthError("Invalid GitHub install state", 400)
  }

  const expectedSignature = sign(payload)
  const valid =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  if (!valid) throw new AuthError("Invalid GitHub install state", 400)

  let parsed: GitHubInstallState
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    throw new AuthError("Invalid GitHub install state", 400)
  }

  if (
    parsed.userId !== expected.userId ||
    parsed.workspaceId !== expected.workspaceId
  ) {
    throw new AuthError("GitHub install state does not match session", 403)
  }

  if (Date.now() - parsed.ts > MAX_AGE_MS) {
    throw new AuthError("GitHub install state expired", 400)
  }

  return parsed
}
