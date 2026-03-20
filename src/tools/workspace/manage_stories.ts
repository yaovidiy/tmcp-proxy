import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession, withWorkspaceGuard } from "../../utils";
import { db } from "../../db";
import { stories, workspaces } from "../../db/schema";

const storyStatus = v.picklist(["backlog", "in_progress", "completed", "blocked"]);

export const workspaceStoriesTool = defineTool(
  {
    name: "workspace_stories",
    description:
      "Manage stories within a workspace. Statuses: backlog | in_progress | completed | blocked. New stories default to backlog. " +
      "Call patterns: " +
      "create → { action: \"create\", workspaceId: 1, title: \"Story title\", description: \"Detailed description\" } | " +
      "update → { action: \"update\", storyId: 1, title?: \"New title\", description?: \"...\", status?: \"backlog|in_progress|completed|blocked\" } | " +
      "list   → { action: \"list\", workspaceId: 1 }",
    schema: v.object({
      action: v.picklist(["create", "update", "list"]),
      workspaceId: v.optional(v.number()),
      storyId: v.optional(v.number()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(storyStatus),
    }),
  },
  withWorkspaceGuard(async ({ action, workspaceId, storyId, title, description, status }) => {
    const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
    const now = Math.floor(Date.now() / 1000);

    try {
      // ── CREATE ──────────────────────────────────────────────────
      if (action === "create") {
        if (workspaceId == null || !title || !description) {
          return tool.error(
            "create requires workspaceId, title, and description.",
          );
        }

        // Validate workspace exists
        const [ws] = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        if (!ws) {
          return tool.error(`Workspace #${workspaceId} not found.`);
        }

        const [story] = await db
          .insert(stories)
          .values({
            workspaceId,
            title,
            description,
            status: "backlog",
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Stories – Create",
          tool: "workspace_stories",
          request: JSON.stringify({ action, workspaceId, title }),
          response: `Created story #${story.id}`,
          agent_id,
        });

        return tool.text(JSON.stringify(story, null, 2));
      }

      // ── UPDATE ──────────────────────────────────────────────────
      if (action === "update") {
        if (storyId == null) {
          return tool.error("update requires storyId.");
        }

        const updates: Record<string, unknown> = { updatedAt: now };
        if (title != null) updates.title = title;
        if (description != null) updates.description = description;
        if (status != null) updates.status = status;

        const [updated] = await db
          .update(stories)
          .set(updates)
          .where(eq(stories.id, storyId))
          .returning();

        if (!updated) {
          return tool.error(`Story #${storyId} not found.`);
        }

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Stories – Update",
          tool: "workspace_stories",
          request: JSON.stringify({ action, storyId, ...updates }),
          response: `Updated story #${updated.id}`,
          agent_id,
        });

        return tool.text(JSON.stringify(updated, null, 2));
      }

      // ── LIST ────────────────────────────────────────────────────
      if (action === "list") {
        if (workspaceId == null) {
          return tool.error("list requires workspaceId.");
        }

        const rows = await db
          .select()
          .from(stories)
          .where(eq(stories.workspaceId, workspaceId));

        const summary = {
          workspaceId,
          total: rows.length,
          completed: rows.filter((r) => r.status === "completed").length,
          stories: rows,
        };

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Stories – List",
          tool: "workspace_stories",
          request: JSON.stringify({ action, workspaceId }),
          response: `Listed ${rows.length} stories`,
          agent_id,
        });

        return tool.text(JSON.stringify(summary, null, 2));
      }

      return tool.error(`Unknown action: ${action}`);
    } catch (err) {
      return tool.error(
        `workspace_stories failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }),
);
