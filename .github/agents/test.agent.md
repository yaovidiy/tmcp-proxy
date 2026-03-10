---
name: test
description: Testing custom MCP server
tools: ['testone/*', 'read/readFile']
---

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
