import { App } from "octokit"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required for GitHub App integration`)
  }
  return value
}

function githubPrivateKey() {
  const raw = requiredEnv("GITHUB_APP_PRIVATE_KEY").trim()
  const unquoted =
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw

  const normalized = unquoted.replace(/\\n/g, "\n").trim()
  if (normalized.includes("-----BEGIN") && normalized.includes("PRIVATE KEY")) {
    return normalized
  }

  try {
    const decoded = Buffer.from(normalized, "base64").toString("utf8").trim()
    if (decoded.includes("-----BEGIN") && decoded.includes("PRIVATE KEY")) {
      return decoded
    }
  } catch {
    // Fall through to the clearer error below.
  }

  throw new Error(
    "GITHUB_APP_PRIVATE_KEY must be a PEM private key or base64-encoded PEM"
  )
}

export function githubApp() {
  return new App({
    appId: requiredEnv("GITHUB_APP_ID"),
    privateKey: githubPrivateKey(),
    webhooks: { secret: requiredEnv("GITHUB_APP_WEBHOOK_SECRET") },
  })
}

export async function githubInstallationOctokit(installationId: string) {
  return githubApp().getInstallationOctokit(Number(installationId))
}
