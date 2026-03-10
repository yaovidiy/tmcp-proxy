import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession } from "../../utils";
import { svelteMcpClient } from "../../client/svelteClient";
import { parseSvelteMcpResponse, type SvelteMcpResponse } from "./utils";

export const svelteMcpCallTool = defineTool(
  {
    name: "svelte_mcp_call",
    description:
      "Get official Svelte documentation or call any tool on the Svelte MCP server. " +
      "You can use next tool_name: list-sections, get-documentation, svelte-autofixer, playground-link",
    schema: v.object({
      tool_name: v.string(),
      arguments: v.optional(v.record(v.string(), v.unknown()), {}),
    }),
    enabled: () =>
      isToolAllowedForAgent(
        (server.ctx.custom?.agent_id as string) || "unknown",
        "svelte_mcp_call",
      ),
  },
  async ({ tool_name, arguments: args }) => {
    try {
      let svelteMCPArgs = args;
      if (args?.suggested_sections) {
        svelteMCPArgs = undefined;
      }

      const result = await svelteMcpClient.call(tool_name, svelteMCPArgs ?? {});

      const transformedResult = parseSvelteMcpResponse(
        result as SvelteMcpResponse,
        args as Record<string, string[]>,
      );

      await logAgentSession({
        name: "svelte_mcp_call",
        tool: tool_name,
        request: JSON.stringify(args),
        response: transformedResult,
        agent_id: (server.ctx.custom?.agent_id as string) || "unknown",
      });

      return tool.text(transformedResult);
    } catch (err) {
      return tool.error(
        `svelte_mcp_call failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  },
);
