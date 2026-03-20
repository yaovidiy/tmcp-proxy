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

// ── Workspace / Story / Task ────────────────────────────────────────

export const workspaces = sqliteTable("workspaces", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  createdAt: int("created_at").notNull(), // Unix timestamp (seconds)
});

export const stories = sqliteTable("stories", {
  id: int().primaryKey({ autoIncrement: true }),
  workspaceId: int("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text().notNull(),
  description: text().notNull(),
  status: text().notNull().$type<"backlog" | "in_progress" | "completed" | "blocked">(),
  createdAt: int("created_at").notNull(), // Unix timestamp (seconds)
  updatedAt: int("updated_at").notNull(), // Unix timestamp (seconds)
});

export const tasks = sqliteTable("tasks", {
  id: int().primaryKey({ autoIncrement: true }),
  storyId: int("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  title: text().notNull(),
  description: text().notNull(),
  status: text().notNull().$type<"backlog" | "in_progress" | "completed" | "blocked">(),
  createdAt: int("created_at").notNull(),  // Unix timestamp (seconds)
  startedAt: int("started_at"),            // Unix timestamp (seconds), nullable
  completedAt: int("completed_at"),        // Unix timestamp (seconds), nullable
  updatedAt: int("updated_at").notNull(),  // Unix timestamp (seconds)
});
