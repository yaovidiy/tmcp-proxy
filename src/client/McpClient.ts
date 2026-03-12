interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Abstract base class for MCP Streamable-HTTP clients.
 * Handles JSON-RPC session lifecycle and tool calls.
 * Extend this class and provide a `url` to create a client for any MCP server.
 */
export abstract class McpClient {
  protected abstract readonly url: string;

  private rpcId = 1;

  private nextId(): number {
    return this.rpcId++;
  }

  private async parseResponse(response: Response): Promise<JsonRpcResponse> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      const text = await response.text();
      const lines = text.split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith("data:")) {
          const json = line.slice(5).trim();
          if (json) return JSON.parse(json) as JsonRpcResponse;
        }
      }
      throw new Error("No data event found in SSE response");
    }

    return response.json() as Promise<JsonRpcResponse>;
  }

  protected extraHeaders(): Record<string, string> {
    return {};
  }

  protected async post(
    body: JsonRpcRequest,
    sessionId?: string,
  ): Promise<{ response: Response; sessionId?: string }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...this.extraHeaders(),
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `MCP HTTP error: ${response.status} ${response.statusText}`,
      );
    }

    const returnedSessionId =
      response.headers.get("Mcp-Session-Id") ?? sessionId;
    return { response, sessionId: returnedSessionId ?? undefined };
  }

  /**
   * Performs the MCP initialize handshake and returns the session ID.
   */
  async initSession(): Promise<string> {
    const { response, sessionId } = await this.post({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "tmcp-proxy", version: "1.0.0" },
      },
    });

    await this.parseResponse(response);

    if (!sessionId) {
      throw new Error(
        "MCP server did not return a session ID during initialize",
      );
    }

    // Fire-and-forget — the server does not send a response to this notification
    this.post(
      { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
      sessionId,
    ).catch(() => {});

    return sessionId;
  }

  /**
   * Calls a tool within an existing session.
   */
  async callTool(
    tool_name: string,
    args: Record<string, unknown>,
    sessionId: string,
  ): Promise<unknown> {
    const { response } = await this.post(
      {
        jsonrpc: "2.0",
        id: this.nextId(),
        method: "tools/call",
        params: { name: tool_name, arguments: args },
      },
      sessionId,
    );

    const rpcResponse = await this.parseResponse(response);

    if (rpcResponse.error) {
      throw new Error(
        `MCP tool error: ${rpcResponse.error.message} (code ${rpcResponse.error.code})`,
      );
    }

    return rpcResponse.result;
  }

  /**
   * Stateless shorthand: initializes a fresh session, calls the tool, returns the result.
   */
  async call(
    tool_name: string,
    args: Record<string, unknown> = {},
  ): Promise<unknown> {
    const sessionId = await this.initSession();
    return this.callTool(tool_name, args, sessionId);
  }
}
