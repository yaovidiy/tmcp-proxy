import { definePrompt } from "tmcp/prompt";

/**
 * Quick-use prompt for communicating with the GitHub MCP server.
 *
 * Provides the agent with:
 *   - What the tool is called and how to invoke it
 *   - The most commonly used tool_name values
 *   - Argument shapes for the most frequent operations
 */
export const githubMcpPrompt = definePrompt(
  {
    name: "github_mcp_usage",
    description:
      "Quick-reference prompt that explains how to use the github_mcp_call tool " +
      "to interact with GitHub repositories, issues, pull requests, and workflows.",
    title: "GitHub MCP – Quick Usage Guide",
  },
  () => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `# GitHub MCP – Quick Usage Guide

## Tool name
\`github_mcp_call\`

## How to call it
Pass \`tool_name\` (string) and \`arguments\` (object) that match the GitHub MCP server's
tool schema.  The proxy forwards the call to \`https://api.githubcopilot.com/mcp/\`
using the \`GITHUB_TOKEN\` environment variable for authentication.

---

## Commonly used tool names and their arguments

### Context
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`get_me\` | \`{}\` | Returns the authenticated user |

### Repositories
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`search_repositories\` | \`{ "query": "tmcp language:typescript" }\` | Search repos |
| \`get_file_contents\` | \`{ "owner": "...", "repo": "...", "path": "src/index.ts" }\` | Read a file |
| \`list_branches\` | \`{ "owner": "...", "repo": "..." }\` | List branches |
| \`list_commits\` | \`{ "owner": "...", "repo": "...", "sha": "main" }\` | List commits |
| \`get_commit\` | \`{ "owner": "...", "repo": "...", "sha": "<sha>" }\` | Commit details |
| \`get_tag\` | \`{ "owner": "...", "repo": "...", "tag": "v1.0.0" }\` | Tag details |
| \`list_tags\` | \`{ "owner": "...", "repo": "..." }\` | List tags |
| \`get_latest_release\` | \`{ "owner": "...", "repo": "..." }\` | Latest release |
| \`list_releases\` | \`{ "owner": "...", "repo": "..." }\` | All releases |
| \`get_release_by_tag\` | \`{ "owner": "...", "repo": "...", "tag": "v1.0.0" }\` | Release by tag |
| \`search_code\` | \`{ "query": "defineTool repo:yaovidiy/tmcp-proxy" }\` | Search code |

### Issues
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`list_issues\` | \`{ "owner": "...", "repo": "...", "state": "open" }\` | List issues |
| \`issue_read\` | \`{ "owner": "...", "repo": "...", "issue_number": 1, "method": "get" }\` | Issue detail |
| \`search_issues\` | \`{ "query": "is:open label:bug repo:owner/repo" }\` | Search issues |

### Pull Requests
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`list_pull_requests\` | \`{ "owner": "...", "repo": "...", "state": "open" }\` | List PRs |
| \`pull_request_read\` | \`{ "owner": "...", "repo": "...", "pullNumber": 42, "method": "get" }\` | PR detail |
| \`search_pull_requests\` | \`{ "query": "is:open author:me repo:owner/repo" }\` | Search PRs |

### Users
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`search_users\` | \`{ "query": "paoloricciuti" }\` | Find a user |

### Actions / CI
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`actions_list\` | \`{ "owner": "...", "repo": "...", "method": "list_workflow_runs" }\` | Workflow runs |
| \`actions_get\` | \`{ "owner": "...", "repo": "...", "method": "get_workflow_run", "resource_id": "<run_id>" }\` | Run details |
| \`get_job_logs\` | \`{ "owner": "...", "repo": "...", "run_id": 123, "failed_only": true }\` | Failed job logs |

### Code Security
| tool_name | arguments | notes |
|-----------|-----------|-------|
| \`list_code_scanning_alerts\` | \`{ "owner": "...", "repo": "...", "state": "open" }\` | Code alerts |
| \`list_secret_scanning_alerts\` | \`{ "owner": "...", "repo": "...", "state": "open" }\` | Secret alerts |

---

## Example call (TypeScript agent pseudo-code)
\`\`\`ts
await use_mcp_tool("github_mcp_call", {
  tool_name: "list_issues",
  arguments: { owner: "yaovidiy", repo: "tmcp-proxy", state: "open" },
});
\`\`\`

## Pagination
Most list tools accept \`page\` / \`perPage\` (or \`after\` cursor for GraphQL-backed tools).
Check the individual tool schema for supported pagination parameters.
`,
        },
      },
    ],
  }),
);
