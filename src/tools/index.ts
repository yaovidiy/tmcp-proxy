import { localReadTool } from "./file/local_read";
import { localWriteTool } from "./file/local_write";
import { svelteMcpCallTool } from "./svelte/router";
import {
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
} from "./figma";

export const tools = [
  localReadTool,
  localWriteTool,
  svelteMcpCallTool,
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
];

export {
  localReadTool,
  localWriteTool,
  svelteMcpCallTool,
  figmaGetStylesTool,
  figmaGetComponentsTool,
  figmaGetVariablesTool,
};
