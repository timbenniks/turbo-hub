export type GitHubPullRequestRef = {
  owner: string
  repo: string
  fullName: string
  number: number
  url: string
}

export function parseGitHubPullRequestUrl(
  value?: string | null
): GitHubPullRequestRef | null {
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.hostname.toLowerCase() !== "github.com") return null

  const [owner, repo, kind, numberText] = url.pathname
    .split("/")
    .filter(Boolean)
  if (!owner || !repo || kind !== "pull" || !numberText) return null

  const number = Number(numberText)
  if (!Number.isInteger(number) || number <= 0) return null

  const fullName = `${owner}/${repo}`
  return {
    owner,
    repo,
    fullName,
    number,
    url: `https://github.com/${fullName}/pull/${number}`,
  }
}
