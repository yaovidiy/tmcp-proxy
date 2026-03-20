import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession, withWorkspaceGuard } from "../../utils";
import { db } from "../../db";
import { workspaces } from "../../db/schema";

export const workspaceCreateTool = defineTool(
  {
    name: "workspace_create",
    description:
      "Creates a new workspace and returns its ID. Use the returned ID when creating stories. " +
      "Call pattern: { name: \"My Project\", description?: \"Optional context about this workspace\" }",
    schema: v.object({
      name: v.string(),
      description: v.optional(v.string()),
    }),
  },
  withWorkspaceGuard(async ({ name, description }) => {
    const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
    const now = Math.floor(Date.now() / 1000);

    try {
      const [workspace] = await db
        .insert(workspaces)
        .values({ name, description: description ?? null, createdAt: now })
        .returning();

      await logAgentSession({
        session_id: server.ctx.sessionId ?? undefined,
        name: "Workspace Create",
        tool: "workspace_create",
        request: JSON.stringify({ name, description }),
        response: `Created workspace #${workspace.id}`,
        agent_id,
      });

      return tool.text(
        JSON.stringify(
          { id: workspace.id, name: workspace.name, createdAt: workspace.createdAt },
          null,
          2,
        ),
      );
    } catch (err) {
      return tool.error(
        `workspace_create failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }),
);
