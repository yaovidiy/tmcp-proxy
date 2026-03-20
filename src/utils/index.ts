import { db } from "../db";
import * as tables from "../db/schema";

const FIGMA_TOOLS = ['figma_get_styles', 'figma_get_components', 'figma_get_variables'];
const GITHUB_TOOLS = ['github_mcp_call'];
const WORKSPACE_TOOLS = ['workspace_create', 'workspace_stories', 'workspace_tasks'];

const AGENT_TOOLS_PERMISSIONS: Record<string, string[]> = {
    'test': ['svelte_mcp_call', ...FIGMA_TOOLS, ...GITHUB_TOOLS, 'context7_mcp', ...WORKSPACE_TOOLS],
    'test-1': ['local_read_file', 'local_write_file', 'svelte_mcp_call', ...FIGMA_TOOLS, ...GITHUB_TOOLS, ...WORKSPACE_TOOLS],
};

const AGENT_DIR_ACCESS_PERMISSIONS: Record<string, string[]> = {
    'test': [`src/tools/file`, 'Library/Application Support/Code/User/workspaceStorage/'],
    'test-1': [`src/file`, `src/logs`, 'Library/Application Support/Code/User/workspaceStorage/'],
};

export const logAgentSession = async ({
  session_id,
  name,
  tool,
  request,
  response,
  agent_id,
}: {
  session_id?: string;
  name: string;
  tool: string;
  request: string;
  response: string;
  agent_id: string;
}) => {
  try {
    return await db
      .insert(tables.agentSessions)
      .values({
        session_id: session_id || crypto.randomUUID(),
        name,
        tool,
        request,
        response,
        agent_id,
      })
      .returning();
  } catch (error) {
    console.error("Error logging agent session:", error);
  }
};

export const isToolAllowedForAgent = (agent_id: string, tool_name: string): boolean => {
  const allowedTools = AGENT_TOOLS_PERMISSIONS[agent_id];
  return allowedTools ? allowedTools.includes(tool_name) : false;
};

export const isAgentAllowedAccessToDir = (agent_id: string, dir_path: string): boolean => {
  const allowedDirs = AGENT_DIR_ACCESS_PERMISSIONS[agent_id];
  return allowedDirs ? allowedDirs.some(allowedDir => dir_path.includes(allowedDir)) : false;
};

export { withWorkspaceGuard } from "./workspace-guard";