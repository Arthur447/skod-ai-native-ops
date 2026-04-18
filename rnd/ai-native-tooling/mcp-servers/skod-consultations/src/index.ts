#!/usr/bin/env node
// src/index.ts
//
// Entry point for the skod-consultations MCP server.
//
// Transport: stdio (standard input / standard output).
//   - This is the simplest MCP transport. The process reads JSON-RPC requests
//     on stdin and writes responses on stdout. Claude Code spawns us as a
//     child process and pipes stdio — no network involved, no auth needed
//     (the OS-level process boundary IS the security boundary).
//
// Scope: READ-ONLY, bounded to commu_consultation_order + commu_marktplace.
//   - Principle of Least Privilege: every tool below is a SELECT-equivalent.
//     No drush config:set, no entity:save, no mutation of any kind.
//   - To add a write capability later: require a separate transport (HTTP +
//     auth), Human-in-the-Loop confirmation, and an audit trail.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";

import {
  listConsultations,
  listConsultationsInputSchema,
} from "./tools/list-consultations.js";
import {
  getConsultationStats,
  getConsultationStatsInputSchema,
} from "./tools/get-consultation-stats.js";
import {
  getDomainInfo,
  getDomainInfoInputSchema,
} from "./tools/get-domain-info.js";

// ---------------------------------------------------------------------------
// Zod → JSON Schema helper
//
// The MCP protocol advertises tool inputs as JSON Schema. Our source of truth
// is Zod (runtime validation + compile-time types). We keep a tiny inline
// converter to avoid pulling a third dependency — enough for our simple shapes.
// ---------------------------------------------------------------------------

function zodObjectToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
} {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    const def = (field as z.ZodTypeAny)._def;
    let fieldSchema: Record<string, unknown> = {};

    // Peel optional / default wrappers while collecting description
    let inner: z.ZodTypeAny = field as z.ZodTypeAny;
    let isOptional = false;
    while (true) {
      const innerDef = inner._def;
      if (innerDef.typeName === "ZodOptional") {
        isOptional = true;
        inner = innerDef.innerType;
      } else if (innerDef.typeName === "ZodDefault") {
        isOptional = true;
        fieldSchema.default = innerDef.defaultValue();
        inner = innerDef.innerType;
      } else {
        break;
      }
    }

    const innerDef = inner._def;
    switch (innerDef.typeName) {
      case "ZodString":
        fieldSchema.type = "string";
        break;
      case "ZodNumber":
        fieldSchema.type = "number";
        break;
      case "ZodBoolean":
        fieldSchema.type = "boolean";
        break;
      case "ZodEnum":
        fieldSchema.type = "string";
        fieldSchema.enum = innerDef.values;
        break;
      default:
        fieldSchema.type = "string"; // best-effort fallback
    }

    if (def.description ?? (field as z.ZodTypeAny).description) {
      fieldSchema.description =
        def.description ?? (field as z.ZodTypeAny).description;
    }

    properties[key] = fieldSchema;
    if (!isOptional) required.push(key);
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

// ---------------------------------------------------------------------------
// Tool registry
//
// A single source of truth mapping tool name → (zod schema, handler,
// human-facing description). The MCP server uses this both to advertise
// tools (ListTools) and dispatch calls (CallTool).
// ---------------------------------------------------------------------------

interface ToolDefinition<T extends z.ZodObject<z.ZodRawShape>> {
  description: string;
  inputSchema: T;
  handler: (input: z.infer<T>) => Promise<unknown>;
}

const TOOLS: Record<string, ToolDefinition<z.ZodObject<z.ZodRawShape>>> = {
  list_consultations: {
    description:
      "List Skod consultations (read-only). Filter by state (draft, " +
      "configured, processing, completed, canceled, any). Bounded context: " +
      "commu_consultation_order.",
    inputSchema: listConsultationsInputSchema,
    handler: (input) => listConsultations(input as never),
  },
  get_consultation_stats: {
    description:
      "Aggregated consultation counts by state and type (read-only). " +
      "Optionally limited to the last N days. Useful for a quick pipeline " +
      "health check without fetching individual records.",
    inputSchema: getConsultationStatsInputSchema,
    handler: (input) => getConsultationStats(input as never),
  },
  get_domain_info: {
    description:
      "Return metadata for a Skod domain (hostname, name, default flag, " +
      "admin user id). If no domain_id is provided, returns the first " +
      "registered domain. Bounded context: commu_marktplace (domain resolver).",
    inputSchema: getDomainInfoInputSchema,
    handler: (input) => getDomainInfo(input as never),
  },
};

// ---------------------------------------------------------------------------
// MCP server setup
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: "skod-consultations",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List tools — called by the agent to discover what's available.
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: def.description,
    inputSchema: zodObjectToJsonSchema(def.inputSchema),
  })),
}));

// Call tool — dispatch to the right handler after validating input.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const tool = TOOLS[name];

  if (!tool) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Unknown tool: ${name}. Available tools: ${Object.keys(TOOLS).join(", ")}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const input = tool.inputSchema.parse(rawArgs ?? {});
    const result = await tool.handler(input);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const message =
      err instanceof ZodError
        ? `Invalid input: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error calling tool "${name}": ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // We intentionally do NOT log anything here: stdout is the protocol channel.
  // If you need logs, write them to stderr:
  process.stderr.write("skod-consultations MCP server ready\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
