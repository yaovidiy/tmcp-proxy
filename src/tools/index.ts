import { localReadTool } from "./file/local_read";
import { localWriteTool } from "./file/local_write";
import { svelteMcpCallTool } from "./svelte/router";
import { githubMcpCallTool } from "./github/router";
import {
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
} from "./figma";
import { context7GetContextTool } from "./context7/router";

export const tools = [
  localReadTool,
  localWriteTool,
  svelteMcpCallTool,
  githubMcpCallTool,
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
  context7GetContextTool,
];

export {
  localReadTool,
  localWriteTool,
  svelteMcpCallTool,
  githubMcpCallTool,
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
  context7GetContextTool,
};
