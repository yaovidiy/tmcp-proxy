import { tool } from "tmcp/utils";
import { server } from "../config/server";
import { db } from "../db";
import { workspaces } from "../db/schema";

/**
 * In-memory tracker: agent_id → last auto-created workspace ID.
 * Resets on server restart; workspaces persist in DB.
 */
const agentWorkspaceTracker = new Map<string, number>();

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function ensureWorkspace(
  agentId: string,
  workspaceId: string | undefined,
): Promise<{ ok: true } | { ok: false; workspaceId: number; firstTime: boolean }> {
  if (workspaceId) {
    return { ok: true };
  }

  const existing = agentWorkspaceTracker.get(agentId);
  if (existing != null) {
    return { ok: false, workspaceId: existing, firstTime: false };
  }

  // Auto-create a workspace
  const now = Math.floor(Date.now() / 1000);
  const [ws] = await db
    .insert(workspaces)
    .values({
      name: `Auto Workspace ${formatTimestamp()}`,
      description: `Auto-created workspace for agent ${agentId}`,
      createdAt: now,
    })
    .returning();

  agentWorkspaceTracker.set(agentId, ws.id);
  return { ok: false, workspaceId: ws.id, firstTime: true };
}

function buildWarning(workspaceId: number, firstTime: boolean): string {
  if (firstTime) {
    return (
      `⚠️ No x-workspace-id header provided. A workspace has been auto-created.\n` +
      `YOU MUST SET x-workspace-id header with this ${workspaceId} to proceed working with this MCP server.`
    );
  }
  return (
    `⚠️ No x-workspace-id header provided. Your last auto-created workspace ID is ${workspaceId}.\n` +
    `YOU MUST SET x-workspace-id header with this ${workspaceId} to proceed working with this MCP server.`
  );
}

/**
 * Wraps a tool handler to enforce x-workspace-id header.
 * If the header is missing, short-circuits with a warning message.
 */
export function withWorkspaceGuard<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>,
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs): Promise<TResult> => {
    const agentId = (server.ctx.custom?.agent_id as string) || "unknown";
    const workspaceId = server.ctx.custom?.workspace_id as string | undefined;

    const result = await ensureWorkspace(agentId, workspaceId);

    if (!result.ok) {
      return tool.text(buildWarning(result.workspaceId, result.firstTime)) as TResult;
    }

    return handler(args);
  };
}
