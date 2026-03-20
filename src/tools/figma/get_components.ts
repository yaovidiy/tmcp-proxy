import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession } from "../../utils";
import { figmaClient } from "../../client/FigmaClient";
import { parseFigmaComponents } from "./utils";
import { db } from "../../db";
import { figmaCache } from "../../db/schema";

const CACHE_TTL_SECONDS = 3600; // 1 hour

export const figmaGetComponentsTool = defineTool(
  {
    name: "figma_get_components",
    description:
      "Fetches all published components and component sets from a Figma file. " +
      "Returns component names, descriptions, node IDs, and their containing frame/page. " +
      "Results are cached for 1 hour to minimise Figma API usage. " +
      "Call pattern: { figma_file_key: \"<key>\" } — the file key is the alphanumeric segment from the Figma file URL: " +
      "https://www.figma.com/file/<key>/...",
    schema: v.object({
      figma_file_key: v.string(),
    }),
  },
  async ({ figma_file_key }) => {
    const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
    const cacheKey = `${figma_file_key}:components`;
    const nowSeconds = Math.floor(Date.now() / 1000);

    try {
      // Check cache first
      const cached = await db
        .select()
        .from(figmaCache)
        .where(eq(figmaCache.cache_key, cacheKey))
        .limit(1);

      if (
        cached.length > 0 &&
        nowSeconds - cached[0].fetched_at < CACHE_TTL_SECONDS
      ) {
        await logAgentSession({
          session_id: server.ctx.sessionId ?? undefined,
          name: "Figma Get Components (cache hit)",
          tool: "figma_get_components",
          request: `file_key: ${figma_file_key}`,
          response: `Returned cached components for ${figma_file_key}`,
          agent_id,
        });
        return tool.text(cached[0].data);
      }

      const response = await figmaClient.getComponents(figma_file_key);
      const parsed = parseFigmaComponents(response);
      const data = JSON.stringify(parsed, null, 2);

      // Upsert cache
      await db
        .insert(figmaCache)
        .values({ cache_key: cacheKey, data, fetched_at: nowSeconds })
        .onConflictDoUpdate({
          target: figmaCache.cache_key,
          set: { data, fetched_at: nowSeconds },
        });

      await logAgentSession({
        session_id: server.ctx.sessionId ?? undefined,
        name: "Figma Get Components",
        tool: "figma_get_components",
        request: `file_key: ${figma_file_key}`,
        response: `Fetched ${parsed.components.length} components`,
        agent_id,
      });

      return tool.text(data);
    } catch (err) {
      return tool.error(
        `figma_get_components failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
);
