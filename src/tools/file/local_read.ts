import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import {
  isToolAllowedForAgent,
  logAgentSession,
  isAgentAllowedAccessToDir,
} from "../../utils";

const MAX_FILE_LINES = 200; // Limit the number of lines read from a file to prevent overwhelming the agent

export const localReadTool = defineTool(
  {
    name: "local_read_file",
    description:
      "Reads content from a local file. Returns up to 200 lines starting at start_line (0-indexed, defaults to 0). " +
      "If the file has more lines, the response includes a pagination message with the next start_line to pass. " +
      "Call pattern: { path: \"/absolute/path/to/file\", start_line?: 0 }",
    schema: v.object({
      path: v.string(),
      start_line: v.optional(v.number(), 0),
    }),
  },
  async ({ path, start_line = 0 }) => {
    try {
      const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";

      if (!isAgentAllowedAccessToDir(agent_id, path)) {
        return tool.error(
          `Agent ${agent_id} is not allowed to access directory: ${path}`,
        );
      }

      const file = Bun.file(path);
      const isExists = await file.exists();

      if (!isExists) {
        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Error on File Read",
          tool: "local_read_file",
          request: `Path: ${path}`,
          response: `File not found at path: ${path}`,
          agent_id: (server.ctx.custom?.agent_id as string) || "unknown",
        });
        return tool.error(`File not found: ${path}`);
      }

      const content = await file.text();

      const lines = content.split("\n");
      const limitedContent =
        lines.length > start_line + MAX_FILE_LINES
          ? lines.slice(start_line, start_line + MAX_FILE_LINES).join("\n") +
            `\n... fetched lines ${start_line} to ${start_line + MAX_FILE_LINES} of ${lines.length}` +
            `\n To read more lines, call the tool again with start_line: ${start_line + MAX_FILE_LINES}`
          : content;

      await logAgentSession({
        session_id: server.ctx.sessionId ?? undefined,
        name: "File Read Success",
        tool: "local_read_file",
        request: `Path: ${path}`,
        response: `File content: ${limitedContent.substring(0, 100)}...`, // Log only the first 100 characters for brevity
        agent_id: (server.ctx.custom?.agent_id as string) || "unknown",
      });

      return tool.text(limitedContent);
    } catch (err) {
      console.error(`Error reading file ${path}:`, err);
      return tool.error(
        `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
);
