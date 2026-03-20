import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession, withWorkspaceGuard } from "../../utils";
import { db } from "../../db";
import { tasks, stories } from "../../db/schema";

const taskStatus = v.picklist(["backlog", "in_progress", "completed", "blocked"]);

export const workspaceTasksTool = defineTool(
  {
    name: "workspace_tasks",
    description:
      "Manage tasks within a story. Statuses: backlog | in_progress | completed | blocked. New tasks default to backlog. " +
      "startedAt is auto-set on first transition to in_progress; completedAt is auto-set when status becomes completed. " +
      "Call patterns: " +
      "create → { action: \"create\", storyId: 1, title: \"Task title\", description: \"Implementation details\" } | " +
      "update → { action: \"update\", taskId: 1, title?: \"...\", description?: \"...\", status?: \"backlog|in_progress|completed|blocked\" } | " +
      "list   → { action: \"list\", storyId: 1 }",
    schema: v.object({
      action: v.picklist(["create", "update", "list"]),
      storyId: v.optional(v.number()),
      taskId: v.optional(v.number()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(taskStatus),
    }),
  },
  withWorkspaceGuard(async ({ action, storyId, taskId, title, description, status }) => {
    const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
    const now = Math.floor(Date.now() / 1000);

    try {
      // ── CREATE ──────────────────────────────────────────────────
      if (action === "create") {
        if (storyId == null || !title || !description) {
          return tool.error(
            "create requires storyId, title, and description.",
          );
        }

        // Validate story exists
        const [story] = await db
          .select({ id: stories.id })
          .from(stories)
          .where(eq(stories.id, storyId))
          .limit(1);

        if (!story) {
          return tool.error(`Story #${storyId} not found.`);
        }

        const [task] = await db
          .insert(tasks)
          .values({
            storyId,
            title,
            description,
            status: "backlog",
            createdAt: now,
            startedAt: null,
            completedAt: null,
            updatedAt: now,
          })
          .returning();

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Tasks – Create",
          tool: "workspace_tasks",
          request: JSON.stringify({ action, storyId, title }),
          response: `Created task #${task.id}`,
          agent_id,
        });

        return tool.text(JSON.stringify(task, null, 2));
      }

      // ── UPDATE ──────────────────────────────────────────────────
      if (action === "update") {
        if (taskId == null) {
          return tool.error("update requires taskId.");
        }

        // Fetch current task to handle timestamp logic
        const [current] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, taskId))
          .limit(1);

        if (!current) {
          return tool.error(`Task #${taskId} not found.`);
        }

        const updates: Record<string, unknown> = { updatedAt: now };
        if (title != null) updates.title = title;
        if (description != null) updates.description = description;

        if (status != null) {
          updates.status = status;

          // Auto-set startedAt on first transition to in_progress
          if (status === "in_progress" && current.startedAt == null) {
            updates.startedAt = now;
          }

          // Auto-set completedAt when status becomes completed
          if (status === "completed") {
            updates.completedAt = now;
          }

          // Clear completedAt if moving away from completed
          if (status !== "completed" && current.completedAt != null) {
            updates.completedAt = null;
          }
        }

        const [updated] = await db
          .update(tasks)
          .set(updates)
          .where(eq(tasks.id, taskId))
          .returning();

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Tasks – Update",
          tool: "workspace_tasks",
          request: JSON.stringify({ action, taskId, ...updates }),
          response: `Updated task #${updated.id} → ${updated.status}`,
          agent_id,
        });

        return tool.text(JSON.stringify(updated, null, 2));
      }

      // ── LIST ────────────────────────────────────────────────────
      if (action === "list") {
        if (storyId == null) {
          return tool.error("list requires storyId.");
        }

        const rows = await db
          .select()
          .from(tasks)
          .where(eq(tasks.storyId, storyId));

        const summary = {
          storyId,
          total: rows.length,
          completed: rows.filter((r) => r.status === "completed").length,
          inProgress: rows.filter((r) => r.status === "in_progress").length,
          blocked: rows.filter((r) => r.status === "blocked").length,
          backlog: rows.filter((r) => r.status === "backlog").length,
          tasks: rows,
        };

        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Workspace Tasks – List",
          tool: "workspace_tasks",
          request: JSON.stringify({ action, storyId }),
          response: `Listed ${rows.length} tasks`,
          agent_id,
        });

        return tool.text(JSON.stringify(summary, null, 2));
      }

      return tool.error(`Unknown action: ${action}`);
    } catch (err) {
      return tool.error(
        `workspace_tasks failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }),
);
