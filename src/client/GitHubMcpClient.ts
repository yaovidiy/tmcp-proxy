import { McpClient } from "./McpClient";

/**
 * MCP client for the remote GitHub MCP server.
 * Authenticates with a GitHub Personal Access Token via the Authorization header.
 *
 * Required environment variable: GITHUB_TOKEN
 *
 * The remote server endpoint: https://api.githubcopilot.com/mcp/
 * Supports toolsets: context, repos, issues, pull_requests, actions, code_security, etc.
 */
export class GitHubMcpClient extends McpClient {
  protected readonly url = "https://api.githubcopilot.com/mcp/";

  private get token(): string {
    const t = process.env.GITHUB_TOKEN;
    if (!t) throw new Error("GITHUB_TOKEN environment variable is not set");
    return t;
  }

  protected override extraHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

export const gitHubMcpClient = new GitHubMcpClient();
