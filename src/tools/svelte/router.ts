import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession, withWorkspaceGuard } from "../../utils";
import { svelteMcpClient } from "../../client/svelteClient";
import { parseSvelteMcpResponse, type SvelteMcpResponse } from "./utils";

export const svelteMcpCallTool = defineTool(
  {
    name: "svelte_mcp_call",
    description:
      "Call any tool on the Svelte MCP server for official documentation and code fixes. " +
      "IMPORTANT: 'tool_name' and 'arguments' are two separate top-level properties — never nest or serialize arguments inside tool_name. " +
      "CORRECT: { tool_name: \"get-documentation\", arguments: { section: \"Runes\" } }. " +
      "WRONG:   { tool_name: \"{\\\"tool_name\\\":\\\"get-documentation\\\",\\\"arguments\\\":{...}}\" }. " +
      "Available tool_name values: " +
      "• list-sections — lists all available documentation sections. Arguments: none. " +
      "• get-documentation — returns documentation for requested sections. Arguments: { section: \"<section-name>\" } (use a name from list-sections). " +
      "• svelte-autofixer — analyzes Svelte code for issues and suggestions. Arguments: { code: \"<svelte component code>\" }. " +
      "If issues are found, fix them and call again to verify no issues remain. " +
      "• playground-link — generates a Svelte REPL playground link. Arguments: { code: \"<svelte code>\" }.",
    schema: v.object({
      tool_name: v.string(),
      arguments: v.optional(v.record(v.string(), v.unknown()), {}),
    }),
  },
  withWorkspaceGuard(async ({ tool_name, arguments: args }) => {
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
  }),
);
