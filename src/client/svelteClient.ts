import { McpClient } from "./McpClient";

/**
 * MCP client for the Svelte remote MCP server.
 * Extend McpClient to add Svelte-specific helpers here as needed.
 */
export class SvelteMcpClient extends McpClient {
  protected readonly url = "https://mcp.svelte.dev/mcp";
}

export const svelteMcpClient = new SvelteMcpClient();
