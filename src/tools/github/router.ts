import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession } from "../../utils";
import { gitHubMcpClient } from "../../client/GitHubMcpClient";

/**
 * GitHub MCP tool names available via the remote server (default toolsets).
 *
 * context:        get_me
 * repos:          get_file_contents, list_branches, list_commits, search_repositories,
 *                 get_commit, get_tag, list_tags, get_latest_release, list_releases,
 *                 get_release_by_tag, search_code
 * issues:         issue_read, list_issues, search_issues, list_issue_types
 * pull_requests:  pull_request_read, list_pull_requests, search_pull_requests
 * users:          search_users
 * labels:         get_label
 * actions:        actions_get, actions_list, get_job_logs
 * code_security:  list_code_scanning_alerts, get_code_scanning_alert,
 *                 list_secret_scanning_alerts, get_secret_scanning_alert
 */
export const githubMcpCallTool = defineTool(
  {
    name: "github_mcp_call",
    description:
      "Call any tool on the remote GitHub MCP server. " +
      "Default toolsets expose: context (get_me), repos (get_file_contents, list_branches, " +
      "list_commits, search_repositories, get_commit, get_tag, list_tags, get_latest_release, " +
      "list_releases, get_release_by_tag, search_code), issues (issue_read, list_issues, " +
      "search_issues, list_issue_types), pull_requests (pull_request_read, list_pull_requests, " +
      "search_pull_requests), users (search_users), labels (get_label), " +
      "actions (actions_get, actions_list, get_job_logs), " +
      "code_security (list_code_scanning_alerts, get_code_scanning_alert, " +
      "list_secret_scanning_alerts, get_secret_scanning_alert). " +
      "Pass the exact tool_name and its arguments as defined by the GitHub MCP server. " +
      "Requires GITHUB_TOKEN environment variable to be set.",
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

      const text =
        typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2);

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
        `github_mcp_call failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  },
);
