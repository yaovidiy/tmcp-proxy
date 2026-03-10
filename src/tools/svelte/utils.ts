export interface SvelteMcpResponse {
  content?: {
    type: string;
    text: string;
  }[];
  structuredContent?: {
    require_another_tool_call_after_fixing: boolean;
    suggestions: string[];
    issues: string[];
  };
}

export const parseSvelteMcpResponse = (
  response: SvelteMcpResponse,
  args?: Record<string, string[]>,
): string => {
  if (response.structuredContent) {
    const { issues, suggestions, require_another_tool_call_after_fixing } =
      response.structuredContent;

    let result = "";

    if (issues.length > 0) {
      result += `You **MUST** fix issues. \n\n Identified issues:\n${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}\n\n`;
    }

    if (suggestions.length > 0) {
      result += `You **MUST** implement suggestions to improve code: \n\n Suggestions:\n${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join("\n")}\n\n`;
    }

    if (require_another_tool_call_after_fixing) {
      result += `**MUST** call the tool one more time after fixing issues and implementing suggestions, to check if there are any remaining issues or suggestions.`;
    }

    return result || "All checks are passed, proceed with your work.";
  }

  if (response.content) {
    return response.content.map((c) => c.text).join("\n");
  }

  return `No content or structured content found in the response. Returning original response. \n\n ${JSON.stringify(response, null, 2)}`;
};
