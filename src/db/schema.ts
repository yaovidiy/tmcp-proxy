import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentSessions = sqliteTable("agent_session", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  tool: text().notNull(),
  request: text().notNull(),
  response: text().notNull(),
  session_id: text().notNull(),
  agent_id: text().notNull(),
});

export const figmaCache = sqliteTable("figma_cache", {
  id: int().primaryKey({ autoIncrement: true }),
  cache_key: text().notNull().unique(),
  data: text().notNull(),
  fetched_at: int().notNull(), // Unix timestamp (seconds)
});
