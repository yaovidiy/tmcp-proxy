CREATE TABLE `agent_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tool` text NOT NULL,
	`request` text NOT NULL,
	`response` text NOT NULL,
	`session_id` text NOT NULL,
	`agent_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `context7__context_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`libraryId` text NOT NULL,
	`query` text NOT NULL,
	`codeSnippets` text NOT NULL,
	`infoSnippets` text NOT NULL,
	`totalTokens` integer NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `context7__lib_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`libaryName` text NOT NULL,
	`libraryId` text NOT NULL,
	`description` text NOT NULL,
	`trustScore` integer NOT NULL,
	`benchmarkScore` integer NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `figma_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cache_key` text NOT NULL,
	`data` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `figma_cache_cache_key_unique` ON `figma_cache` (`cache_key`);