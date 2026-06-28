import { App } from "octokit"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required for GitHub App integration`)
  }
  return value
}

function githubPrivateKey() {
  return requiredEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n")
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
