import { defineTool } from "tmcp/tool";
import { tool } from "tmcp/utils";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { server } from "../../config/server";
import { isToolAllowedForAgent, logAgentSession } from "../../utils";
import { figmaClient } from "../../client/FigmaClient";
import { parseFigmaStyles } from "./utils";
import { db } from "../../db";
import { figmaCache } from "../../db/schema";

const CACHE_TTL_SECONDS = 3600; // 1 hour

export const figmaGetStylesTool = defineTool(
  {
    name: "figma_get_styles",
    description:
      "Fetches all published styles (colors, typography, effects, grids) from a Figma file. " +
      "Returns structured JSON with resolved values ready to use in components. " +
      "Results are cached for 1 hour to minimise Figma API usage.",
    schema: v.object({
      figma_file_key: v.string(),
    }),
    enabled: () =>
      isToolAllowedForAgent(
        (server.ctx.custom?.agent_id as string) || "unknown",
        "figma_get_styles",
      ),
  },
  async ({ figma_file_key }) => {
    const agent_id = (server.ctx.custom?.agent_id as string) || "unknown";
    const cacheKey = `${figma_file_key}:styles`;
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
          name: "Figma Get Styles (cache hit)",
          tool: "figma_get_styles",
          request: `file_key: ${figma_file_key}`,
          response: `Returned cached styles for ${figma_file_key}`,
          agent_id,
        });
        return tool.text(cached[0].data);
      }

      // Fetch styles metadata from Figma
      const stylesResponse = await figmaClient.getFileStyles(figma_file_key);

      const stylesMeta = stylesResponse.meta?.styles ?? [];
      const nodeIds = stylesMeta.map((s) => s.node_id);

      // Fetch actual node values (fills, text styles, effects, grids)
      const nodesResponse =
        nodeIds.length > 0
          ? await figmaClient.getNodes(figma_file_key, nodeIds)
          : { error: false, status: 200, nodes: {} };

        console.error("Fetched styles metadata and node data from Figma", {
          stylesMetaCount: stylesMeta.length,
          nodesResponse,
        });

      const parsed = parseFigmaStyles(stylesMeta, nodesResponse);
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
        name: "Figma Get Styles",
        tool: "figma_get_styles",
        request: `file_key: ${figma_file_key}`,
        response: `Fetched ${stylesMeta.length} styles (colors: ${parsed.colors.length}, typography: ${parsed.typography.length}, effects: ${parsed.effects.length}, grids: ${parsed.grids.length})`,
        agent_id,
      });

      return tool.text(data);
    } catch (err) {
      return tool.error(
        `figma_get_styles failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
);
