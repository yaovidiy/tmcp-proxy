import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/";
import * as tables from "../db/schema";

export interface Context7LibrariesResponse {
    results: {
        id: string;
        title: string;
        description: string;
        branch: string;
        lastUpdateDate: string;
        state: string;
        totalTokens: number;
        totalSnippets: number;
        stars: number;
        trustScore: number;
        benchmarkScore: number;
        versions: string[];
    }[];
}

export interface Context7ContextResponse {
    codeSnippets: {
        codeTitle: string;
        codeDescription: string;
        codeLanguage: string;
        codeTokens: number;
        codeId: string;
        pageTitle: string;
        codeList: {
            language: string;
            code: string;
        }[];
    }[];
    infoSnippets: {
        pageId: string;
        breadcrumb: string;
        content: string;
        contentTokens: number;
    }[];
}

const BASE_URL = "https://context7.com/api/v2";

export class Context7Client {
    async fetchLibrary(libraryName: string, query: string) {
        const response = await fetch(`${BASE_URL}/libs/search?query=${encodeURIComponent(query)}&libraryName=${encodeURIComponent(libraryName)}`);

        if (!response.ok) {
            throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
        }

        const { results } = await response.json() as Context7LibrariesResponse;

        if (results.length === 0) {
            throw new Error(`No libraries found for query: ${query} and libraryName: ${libraryName}`);
        }

        const bestMatch = results.sort((a, b) => (b.benchmarkScore - a.benchmarkScore) - (b.trustScore - a.trustScore))[0];

        const isExistingCache = await db.select().from(tables.context7LibCache).where(eq(tables.context7LibCache.libraryId, bestMatch.id));

        if (isExistingCache.length > 0) {
            await db.update(tables.context7LibCache).set({
                description: bestMatch.description,
                trustScore: bestMatch.trustScore,
                benchmarkScore: bestMatch.benchmarkScore,
                timestamp: Math.floor(Date.now() / 1000),
            }).where(eq(tables.context7LibCache.libraryId, bestMatch.id));
        } else {
            await db.insert(tables.context7LibCache).values({
                libaryName: libraryName,
                libraryId: bestMatch.id,
                description: bestMatch.description,
                trustScore: bestMatch.trustScore,
                benchmarkScore: bestMatch.benchmarkScore,
                timestamp: Math.floor(Date.now() / 1000),
            });
        }

        return bestMatch;
    }

    async fetchContext(libraryId: string, query: string) {
        const response = await fetch(`${BASE_URL}/context?libraryId=${encodeURIComponent(libraryId)}&query=${encodeURIComponent(query)}&type=json`);
        console.error(`Context7 API GET /context?libraryId=${libraryId}&query=${query} - Status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
        }


        const context = await response.json() as Context7ContextResponse;


        if (context.codeSnippets.length === 0 && context.infoSnippets.length === 0) {
            throw new Error(`No context found for libraryId: ${libraryId} and query: ${query}`);
        }

        const totalTokens = context.codeSnippets.reduce((sum, snippet) => sum + snippet.codeTokens, 0) + context.infoSnippets.reduce((sum, snippet) => sum + snippet.contentTokens, 0);

        const codeSnippetsStr = context.codeSnippets.map(snippet => {
            return `## ${snippet.codeTitle}\n ###Description\n ${snippet.codeDescription}\n###Language\n${snippet.codeLanguage}\n\n###Code Reference:\n${snippet.codeList.map(code => `\`\`\`${code.language}\n${code.code}\n\`\`\``).join("\n")}\n`;
        });

        const infoSnippetsStr = context.infoSnippets.map(snippet => {
            return `General information about **${snippet.breadcrumb}**:\n\n ${snippet.content}`;
        });

        const existingCache = await db.select().from(tables.context7ContextCache).where(and(eq(tables.context7ContextCache.libraryId, libraryId), eq(tables.context7ContextCache.query, query)));

        if (existingCache.length > 0) {
            await db.update(tables.context7ContextCache).set({
                codeSnippets: codeSnippetsStr.join("\n"),
                infoSnippets: infoSnippetsStr.join("\n"),
                totalTokens,
                timestamp: Math.floor(Date.now() / 1000),
            }).where(and(eq(tables.context7ContextCache.libraryId, libraryId), eq(tables.context7ContextCache.query, query)));
        } else {

            await db.insert(tables.context7ContextCache).values({
                libraryId,
                query,
                codeSnippets: codeSnippetsStr.join("\n"),
                infoSnippets: infoSnippetsStr.join("\n"),
                totalTokens,
                timestamp: Math.floor(Date.now() / 1000),
            });
        }


        return {
            context: `${codeSnippetsStr.join("\n")}\n\n${infoSnippetsStr.join("\n")}`,
        }
    }

    async getLibraryCache(libraryName: string) {
        const cache = await db.select().from(tables.context7LibCache).where(eq(tables.context7LibCache.libaryName, libraryName)).orderBy(desc(tables.context7LibCache.timestamp)).limit(1);

        if (cache.length === 0) {
            return null;
        }

        return cache[0];
    }

    async getContextCache(libraryId: string, query: string) {
        const cache = await db.select().from(tables.context7ContextCache).where(and(eq(tables.context7ContextCache.libraryId, libraryId), eq(tables.context7ContextCache.query, query))).orderBy(desc(tables.context7ContextCache.timestamp)).limit(1);

        if (cache.length === 0) {
            return null;
        }

        return cache[0];
    }

    async getLibraryId(libraryName: string, query: string) {
        try {
            const libCache = await this.getLibraryCache(libraryName);

            if (libCache) {
                return libCache.libraryId;
            }

            const fetchedLib = await this.fetchLibrary(libraryName, query);

            return fetchedLib.id;
        } catch (error) {
            console.error("Error fetching library ID:", error);
            return null;
        }

    }

    async getContext(libraryId: string, query: string) {
        try {
            const contextCache = await this.getContextCache(libraryId, query);

            if (contextCache) {
                const contextString = `${contextCache.codeSnippets}\n\n${contextCache.infoSnippets}`;

                return {
                    context: contextString,
                }
            }

            const fetchedContext = await this.fetchContext(libraryId, query);

            return fetchedContext;
        } catch (error) {
            console.error("Error fetching context:", error);
            return {
                context: `Error fetching context for libraryId: ${libraryId} and query: ${query}. Error: ${error instanceof Error ? error.message : String(error)}`,
            }
        }

    }
}