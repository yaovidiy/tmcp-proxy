import { defineTool } from "tmcp/tool";
import * as v from "valibot";
import { tool } from "tmcp/utils";
import { isToolAllowedForAgent, isAgentAllowedAccessToDir } from "../../utils";
import { server } from "../../config/server";

export const localWriteTool = defineTool(
  {
    name: "local_write_file",
    description: "Writes content to a local file",
    schema: v.object({
      path: v.string(),
      content: v.string(),
    }),
    enabled: () =>
      isToolAllowedForAgent(
        (server.ctx.custom?.agent_id as string) || "unknown",
        "local_write_file",
      ),
  },
  async ({ path, content }) => {
    try {
      const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
      if (!isAgentAllowedAccessToDir(agent_id, path)) {
        return tool.error(
          `Agent ${agent_id} is not allowed to access directory: ${path}`,
        );
      }

      const writenFile = await Bun.write(path, content);

      return tool.text(
        `Successfully wrote to file: ${path}, bytes written: ${writenFile}`,
      );
    } catch (err) {
      console.error(`Error writing to file ${path}:`, err);
      return tool.error(
        `Failed to write to file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
);
