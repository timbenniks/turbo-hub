# Turbo Hub MCP

Turbo Hub exposes a Streamable HTTP MCP endpoint at:

```text
/api/mcp
```

Authenticate with a `thub_` API key:

```http
Authorization: Bearer thub_...
```

The key needs:

- `mcp:read` for resources and read-only tools.
- `mcp:write` for mutating tools.

## Streamable HTTP Clients

Use this shape for clients that support remote Streamable HTTP MCP servers:

```json
{
  "turbo-hub": {
    "url": "https://YOUR_APP_URL/api/mcp",
    "headers": {
      "Authorization": "Bearer thub_YOUR_TOKEN"
    }
  }
}
```

For local development:

```json
{
  "turbo-hub-local": {
    "url": "http://localhost:3000/api/mcp",
    "headers": {
      "Authorization": "Bearer thub_YOUR_TOKEN"
    }
  }
}
```

## Stdio-Only Clients

For harnesses that only support stdio MCP servers, bridge the remote endpoint
with `mcp-remote`:

```json
{
  "turbo-hub": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://YOUR_APP_URL/api/mcp",
      "--header",
      "Authorization: Bearer thub_YOUR_TOKEN"
    ]
  }
}
```

## Resources

Common resources:

- `turbo-hub://help`
- `turbo-hub://workspace/overview`
- `turbo-hub://workspace/repositories`
- `turbo-hub://workspace/integrations`
- `turbo-hub://patterns`
- `turbo-hub://project/{project}/overview`
- `turbo-hub://project/{project}/plan`
- `turbo-hub://project/{project}/specs`
- `turbo-hub://project/{project}/tasks`
- `turbo-hub://project/{project}/memory`
- `turbo-hub://project/{project}/runs`
- `turbo-hub://project/{project}/pull-requests`
- `turbo-hub://task/{taskId}/execution-brief`
- `turbo-hub://task/{taskId}/context-packs`
- `turbo-hub://context-pack/{packId}`
- `turbo-hub://run/{runId}/status`

`{project}` accepts a project id, slug, or exact project name.

## Tools

Repository and integration tools:

- `list_repositories`, `get_repository`, `get_project_repository`
- `upsert_repository`, `link_project_repository`
- `list_integrations`, `upsert_integration`, `delete_integration`

PR tools:

- `list_pull_requests`, `get_pull_request`, `link_pull_request`,
  `update_pull_request`

Secret values passed to `upsert_integration` are encrypted at rest and are never
returned by resources or read tools. Mutating tools require `mcp:write`.

## Prompts

- `work_on_task` guides an agent through task context, run tracking, PR linking,
  and learning capture.
- `review_project_status` reads the project resources and summarizes status,
  risks, blockers, memory, and next actions.

## Expected Agent Flow

1. Read `turbo-hub://workspace/overview` or call `list_projects`.
2. Read project resources for plan, specs, tasks, memory, runs, PRs, and linked
   repository state.
3. Read `turbo-hub://task/{taskId}/execution-brief`.
4. Call `assemble_context_pack` if needed, then approve/freeze the pack.
5. Call `create_run` and `start_run`.
6. Append run events while working.
7. Link a PR when available.
8. Complete or fail the run with a summary.
9. Capture learnings and promote reusable learnings to patterns.
