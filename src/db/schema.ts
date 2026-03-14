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

export const context7LibCache = sqliteTable("context7__lib_cache", {
  id: int().primaryKey({ autoIncrement: true }),
  libaryName: text().notNull(),
  libraryId: text().notNull(),
  description: text().notNull(),
  trustScore: int().notNull(),
  benchmarkScore: int().notNull(),
  timestamp: int().notNull(), // Unix timestamp (seconds)
});

export const context7ContextCache = sqliteTable("context7__context_cache", {
  id: int().primaryKey({ autoIncrement: true }),
  libraryId: text().notNull(),
  query: text().notNull(),
  codeSnippets: text().notNull(),
  infoSnippets: text().notNull(),
  totalTokens: int().notNull(),
  timestamp: int().notNull(), // Unix timestamp (seconds)
});
