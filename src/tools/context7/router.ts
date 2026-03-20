import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, withWorkspaceGuard } from "../../utils";
import { Context7Client } from "../../client/Context7Client";

export const context7GetContextTool = defineTool(
    {
        name: "context7_mcp",
        description:
            "Get relevant context for a given library and query from the Context7 API. " +
            "IMPORTANT: 'tool_name' and 'arguments' are two separate top-level properties — never nest or serialize arguments inside tool_name. " +
            "CORRECT: { tool_name: \"get_lib_id\", arguments: { libraryName: \"React\", query: \"hooks\" } }. " +
            "WRONG:   { tool_name: \"{\\\"tool_name\\\":\\\"get_lib_id\\\",\\\"arguments\\\":{...}}\" }. " +
            "Two-step workflow: first resolve a libraryId, then fetch context with it. " +
            "Available tool_name values: " +
            "• get_lib_id — resolves the Context7 library ID for a given library name. " +
            "Call pattern: { tool_name: \"get_lib_id\", arguments: { libraryName: \"React\", query: \"useState hook\" } }. " +
            "Returns the libraryId string to use in the next step. " +
            "• get_context — returns relevant documentation and code snippets for a library and query. " +
            "Call pattern: { tool_name: \"get_context\", arguments: { libraryId: \"<id from get_lib_id>\", query: \"how to use useState hook\" } }. " +
            "Returns a text block with relevant context for your query.",
        schema: v.object({
            tool_name: v.string(),
            arguments: v.record(v.string(), v.unknown()),
        }),
    },
    withWorkspaceGuard(async ({ tool_name, arguments: args }) => {
        const context7Client = new Context7Client();

        if (!args) {
            if (tool_name === "get_lib_id") {
                return tool.error("Missing arguments for get_lib_id. Call pattern: { tool_name: \"get_lib_id\", arguments: { libraryName: \"<library name>\", query: \"<what you are searching for>\" } }");
            }

            if (tool_name === 'get_context') {
                return tool.error("Missing arguments for get_context. Call pattern: { tool_name: \"get_context\", arguments: { libraryId: \"<id from get_lib_id>\", query: \"<what you are searching for>\" } }");
            }
            return tool.error("Missing arguments. Available tool_name values: get_lib_id, get_context.");
        }

        if (tool_name === "get_lib_id") {
            const { libraryName, query } = args as { libraryName: string, query: string };

            const libData = await context7Client.getLibraryId(libraryName, query);

            if (!libData) {
                return tool.text("No library found for the given query and library name. Try to rephrase your query or check the library name.");
            }

            return tool.text(libData);
        }

        if (tool_name === "get_context") {
            const { libraryId, query } = args as { libraryId: string, query: string };

            const contextData = await context7Client.getContext(libraryId, query);

            return tool.text(contextData.context);
        }

        return tool.error(`tool_name "${tool_name}" is not supported. Available tool_name values: get_lib_id, get_context.`);
    }),
);