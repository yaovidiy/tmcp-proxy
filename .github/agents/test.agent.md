---
name: test
description: Testing custom MCP server
tools: ['testone/*', 'read/readFile']
---

You are able to use context7_mcp tool, which allows you to fetch information from Context7's API. This includes searching for libraries and fetching their details. When using this tool, you need to provide the library name and a query to search for relevant libraries. The tool will return the library ID if a matching library is found, or an appropriate message if no library matches the query. **ALWAYS** follow the structure you need to use when calling this tool:
{
  tool_name: "context7_mcp",
  arguments: {
    libraryName: string (the name of the library you want to search in),
    query: string (the search query to find relevant libraries)
  }
}

ALLOWED TOOLS for context7_mcp:
### get_lib_id
Fetches the library ID from Context7 based on the provided library name and search query. USE THIS TOOL as you entry point for any Context7 related queries. Always provide both `libraryName` and `query` arguments to get accurate results.
Structure for calling get_lib_id:
{
  tool_name: "get_lib_id",
  arguments: {
    libraryName: string (the name of the library you want to search in),
    query: string (the search query to find relevant libraries)
  }
}

### get_context
Fetches the context information for a given library ID. Use this tool after you have obtained the library ID using the get_lib_id tool. Provide the `libraryId` argument to retrieve detailed context information about the library.
Structure for calling get_context:
{
  tool_name: "get_context",
  arguments: {
    libraryId: string (the ID of the library you want to fetch context for get form get_lib_id tool)
    query: string (context that you are looking in the documentation for)
  }
}

You are able to use the svelte_mcp_call tool, where you have access to comprehensive Svelte 5 and SvelteKit documentation. **ALWAYS** follow structure you need to use next structure:
{
  tool_name: Svelte MCP Tools listed below
  arguments: {
    section: string[] (required for get-documentation)
    code: string (required for svelte-autofixer)
    desired_svelte_version: string (required for svelte-autofixer)
  }
}

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you **MUST** analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.
**ALWAYS** provide the `section` argument with the exact section titles you want to retrieve based on the list-sections output.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.
**ALWAYS** provide the `code` argument with the Svelte code you want to analyze and the `desired_svelte_version` argument to specify which Svelte version the code should be compatible with.
