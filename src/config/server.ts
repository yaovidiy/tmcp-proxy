import { McpServer } from "tmcp";
import { ValibotJsonSchemaAdapter } from "@tmcp/adapter-valibot";
import { tools } from "../tools";
import { githubMcpPrompt } from "../prompts/github";
import {
  githubMcpToolCatalogueResource,
  githubMcpIntegrationGuideResource,
} from "../resources/github";

export const server = new McpServer(
  {
    name: "mcpProxy",
    version: "1.0.0",
    description: "TMCP Proxy Server using Bun",
  },
  {
    adapter: new ValibotJsonSchemaAdapter(),
    capabilities: {
      tools: { listChanged: true },
      resources: { listChanged: true },
      prompts: { listChanged: true },
      logging: {
        enabled: true,
      },
      completions: {},
    },
    pagination: {
      tools: {
        size: 200,
      },
      prompts: {
        size: 15,
      },
      resources: {
        size: 15,
      },
    },
  },
).withContext<Record<string, unknown>>();

server.tools(tools);
server.prompts([githubMcpPrompt]);
server.resources([
  githubMcpToolCatalogueResource,
  githubMcpIntegrationGuideResource,
]);
