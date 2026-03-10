#!/usr/bin/env node

import { serve } from "srvx";
import { HttpTransport } from "@tmcp/transport-http";
import { server } from "./config/server";

export const http_transport = new HttpTransport(server);

serve({
  async fetch(request) {
    const headers = new Headers(request.headers);

    const agent_id = headers.get("x-agent-id");

    const http_response = await http_transport.respond(request, {
      agent_id: agent_id || undefined,
    });

    if (http_response) {
      return http_response;
    }
    return new Response(null, { status: 404 });
  },
});
