import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent } from "../../utils";
import { Context7Client } from "../../client/Context7Client";

export const context7GetContextTool = defineTool(
    {
        name: "context7_mcp",
        description:
            "Get relavant context for a given library and query from the Context7 API" +
            "Tools names and arguments that are allowed for this tool:" +
            "- get_lib_id - tool to get library id in order to search via it's documents and recive a context;" +
            "allowed arguments:" +
            "libraryName - name of the library you are looking for (e.g.: React, Drizzle etc)" +
            "query: query that you are interested to find in that library" +
            "Result of the toll work is the libraryId which you must use in get_context tool name" +
            "- get_context - a tool that will return context for the quired library and query you are looking for" +
            "allowed arguments:" +
            "libraryId - id of the library recived from get_lib_id tool name" +
            "query - context information you are looking for (e.g. how to use useState hook in React, how to make a request with Drizzle etc)" +
            "Result of the tool work is a text with relavant context for your query",
        schema: v.object({
            tool_name: v.string(),
            arguments: v.record(v.string(), v.unknown()),
        }),
        enabled: () =>
            isToolAllowedForAgent(
                (server.ctx.custom?.agent_id as string) || "unknown",
                "context7_mcp",
            ),
    },
    async ({ tool_name, arguments: args }) => {
        const context7Client = new Context7Client();

        if (!args) {
            if (tool_name === "get_lib_id") {
                return tool.text("No arguments provided. Please follow next format to call this tool : \n { tool_name: get_lib_id, arguments: { libraryName: [name of the library you are looking for], query: [searching queary of the context you are looking for] } }");
            }

            if (tool_name === 'get_context') {
                return tool.text("No arguments provided. Please follow next format to call this tool : \n { tool_name: get_lib_id, arguments: { libraryId: [id recieved from get_lib_id], query: [searching queary of the context you are looking for] } }");
            }
            return tool.text("No arguments provided. Please provide necessary arguments to use the tool.");
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

        return tool.text(`Tool name ${tool_name} is not supported. Please use either get_lib_id or get_context as tool_name.`);
    }
);