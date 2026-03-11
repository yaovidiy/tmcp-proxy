import { defineResource } from "tmcp/resource";

/**
 * Static resource: GitHub MCP tool catalogue.
 * Lists every tool name and its required arguments so the agent can choose
 * the right tool_name when calling github_mcp_call.
 */
export const githubMcpToolCatalogueResource = defineResource(
  {
    name: "github_mcp_tool_catalogue",
    title: "GitHub MCP – Tool Catalogue",
    description:
      "Complete list of GitHub MCP tool names and their argument shapes, " +
      "grouped by toolset. Use this to discover which tool_name to pass to " +
      "the github_mcp_call proxy tool.",
    uri: "resource://github-mcp/tool-catalogue",
    mimeType: "text/plain",
  },
  (_uri) => ({
    contents: [
      {
        uri: "resource://github-mcp/tool-catalogue",
        mimeType: "text/plain",
        text: `# GitHub MCP Tool Catalogue

Remote endpoint: https://api.githubcopilot.com/mcp/
Auth: Authorization: Bearer <GITHUB_TOKEN>

## context toolset
- get_me
    args: {}

## repos toolset
- search_repositories
    args: { query: string, page?: number, perPage?: number }
- get_file_contents
    args: { owner: string, repo: string, path?: string, ref?: string, sha?: string }
- list_branches
    args: { owner: string, repo: string, page?: number, perPage?: number }
- list_commits
    args: { owner: string, repo: string, sha?: string, author?: string, page?: number, perPage?: number }
- get_commit
    args: { owner: string, repo: string, sha: string, include_diff?: boolean, page?: number, perPage?: number }
- get_tag
    args: { owner: string, repo: string, tag: string }
- list_tags
    args: { owner: string, repo: string, page?: number, perPage?: number }
- get_latest_release
    args: { owner: string, repo: string }
- list_releases
    args: { owner: string, repo: string, page?: number, perPage?: number }
- get_release_by_tag
    args: { owner: string, repo: string, tag: string }
- search_code
    args: { query: string, sort?: string, order?: "asc"|"desc", page?: number, perPage?: number }

## issues toolset
- list_issues
    args: { owner: string, repo: string, state?: "open"|"closed", labels?: string[],
            orderBy?: "CREATED_AT"|"UPDATED_AT"|"COMMENTS", direction?: "ASC"|"DESC",
            since?: string, perPage?: number, after?: string }
- issue_read
    args: { owner: string, repo: string, issue_number: number,
            method: "get"|"get_comments"|"get_sub_issues"|"get_labels",
            page?: number, perPage?: number }
- search_issues
    args: { query: string, owner?: string, repo?: string,
            sort?: string, order?: "asc"|"desc", page?: number, perPage?: number }
- list_issue_types
    args: { owner: string }

## pull_requests toolset
- list_pull_requests
    args: { owner: string, repo: string, state?: "open"|"closed"|"all",
            head?: string, base?: string, sort?: string, direction?: "asc"|"desc",
            page?: number, perPage?: number }
- pull_request_read
    args: { owner: string, repo: string, pullNumber: number,
            method: "get"|"get_diff"|"get_status"|"get_files"|"get_review_comments"|
                    "get_reviews"|"get_comments"|"get_check_runs",
            page?: number, perPage?: number }
- search_pull_requests
    args: { query: string, owner?: string, repo?: string,
            sort?: string, order?: "asc"|"desc", page?: number, perPage?: number }

## users toolset
- search_users
    args: { query: string, sort?: "followers"|"repositories"|"joined",
            order?: "asc"|"desc", page?: number, perPage?: number }

## actions toolset
- actions_list
    args: { owner: string, repo: string,
            method: "list_workflows"|"list_workflow_runs"|"list_workflow_jobs"|"list_workflow_run_artifacts",
            resource_id?: string, page?: number, perPage?: number,
            workflow_runs_filter?: { status?: string, branch?: string, event?: string, actor?: string },
            workflow_jobs_filter?: { filter?: "latest"|"all" } }
- actions_get
    args: { owner: string, repo: string,
            method: "get_workflow"|"get_workflow_run"|"get_workflow_job"|
                    "download_workflow_run_artifact"|"get_workflow_run_usage"|"get_workflow_run_logs_url",
            resource_id: string }
- get_job_logs
    args: { owner: string, repo: string, job_id?: number, run_id?: number,
            failed_only?: boolean, return_content?: boolean, tail_lines?: number }

## code_security toolset
- list_code_scanning_alerts
    args: { owner: string, repo: string, state?: "open"|"closed"|"dismissed"|"fixed",
            severity?: "critical"|"high"|"medium"|"low"|"warning"|"note"|"error",
            tool_name?: string, ref?: string }
- get_code_scanning_alert
    args: { owner: string, repo: string, alertNumber: number }
- list_secret_scanning_alerts
    args: { owner: string, repo: string, state?: "open"|"resolved",
            secret_type?: string, resolution?: string }
- get_secret_scanning_alert
    args: { owner: string, repo: string, alertNumber: number }

## labels toolset
- get_label
    args: { owner: string, repo: string, name: string }
`,
      },
    ],
  }),
);

/**
 * Static resource: GitHub MCP integration guide.
 * Step-by-step instructions and code examples for adding GitHub MCP support
 * to a new tmcp-proxy agent.
 */
export const githubMcpIntegrationGuideResource = defineResource(
  {
    name: "github_mcp_integration_guide",
    title: "GitHub MCP – Integration Guide",
    description:
      "Step-by-step guide with code examples for creating a GitHubMcpClient " +
      "and a router tool in a tmcp-proxy project, mirroring the Svelte MCP pattern.",
    uri: "resource://github-mcp/integration-guide",
    mimeType: "text/plain",
  },
  (_uri) => ({
    contents: [
      {
        uri: "resource://github-mcp/integration-guide",
        mimeType: "text/plain",
        text: `# GitHub MCP Integration Guide

## 1. Prerequisites
- A GitHub Personal Access Token (PAT) stored in the GITHUB_TOKEN environment variable.
- The token needs the scopes that match the toolsets you want to use:
  - repos:     repo (read)
  - issues:    repo (read)
  - actions:   repo (read), actions (read)
  - code_security: security_events (read)

---

## 2. Create the GitHub MCP Client (src/client/GitHubMcpClient.ts)

The McpClient base class handles the JSON-RPC session lifecycle.
Extend it, set the URL, and override extraHeaders() to inject the PAT.

\`\`\`typescript
import { McpClient } from "./McpClient";

export class GitHubMcpClient extends McpClient {
  protected readonly url = "https://api.githubcopilot.com/mcp/";

  private get token(): string {
    const t = process.env.GITHUB_TOKEN;
    if (!t) throw new Error("GITHUB_TOKEN environment variable is not set");
    return t;
  }

  protected override extraHeaders(): Record<string, string> {
    return { Authorization: \`Bearer \${this.token}\` };
  }
}

export const gitHubMcpClient = new GitHubMcpClient();
\`\`\`

---

## 3. Create the router tool (src/tools/github/router.ts)

Mirror the pattern used in src/tools/svelte/router.ts.

\`\`\`typescript
import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession } from "../../utils";
import { gitHubMcpClient } from "../../client/GitHubMcpClient";

export const githubMcpCallTool = defineTool(
  {
    name: "github_mcp_call",
    description: "Call any tool on the remote GitHub MCP server.",
    schema: v.object({
      tool_name: v.string(),
      arguments: v.optional(v.record(v.string(), v.unknown()), {}),
    }),
    enabled: () =>
      isToolAllowedForAgent(
        (server.ctx.custom?.agent_id as string) || "unknown",
        "github_mcp_call",
      ),
  },
  async ({ tool_name, arguments: args }) => {
    try {
      const result = await gitHubMcpClient.call(tool_name, args ?? {});
      const text = typeof result === "string"
        ? result : JSON.stringify(result, null, 2);

      await logAgentSession({
        name: "github_mcp_call",
        tool: tool_name,
        request: JSON.stringify(args),
        response: text,
        agent_id: (server.ctx.custom?.agent_id as string) || "unknown",
      });

      return tool.text(text);
    } catch (err) {
      return tool.error(
        \`github_mcp_call failed: \${err instanceof Error ? err.message : String(err)}\`,
      );
    }
  },
);
\`\`\`

---

## 4. Register the tool (src/tools/index.ts)

\`\`\`typescript
import { githubMcpCallTool } from "./github/router";

export const tools = [
  // ...existing tools...
  githubMcpCallTool,
];
\`\`\`

---

## 5. Grant the tool to an agent (src/utils/index.ts)

Add "github_mcp_call" to the agent's allowed tools list:

\`\`\`typescript
const AGENT_TOOLS_PERMISSIONS: Record<string, string[]> = {
  "my-agent": ["github_mcp_call", ...OTHER_TOOLS],
};
\`\`\`

---

## 6. Register prompts and resources (src/config/server.ts)

\`\`\`typescript
import { githubMcpPrompt } from "../prompts/github";
import {
  githubMcpToolCatalogueResource,
  githubMcpIntegrationGuideResource,
} from "../resources/github";

server.prompts([githubMcpPrompt]);
server.resources([
  githubMcpToolCatalogueResource,
  githubMcpIntegrationGuideResource,
]);
\`\`\`

---

## 7. Environment variable
Add to your .env (never commit this file):

\`\`\`
GITHUB_TOKEN=ghp_your_personal_access_token_here
\`\`\`
`,
      },
    ],
  }),
);
