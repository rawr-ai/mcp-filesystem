import { ZodFromTypeBox } from "@sinclair/typemap";
import type { TSchema } from "@sinclair/typebox";
import type { FastMCP, Tool } from "fastmcp";

/**
 * Convert a TypeBox schema to a Zod schema compatible with FastMCP.
 * Returns undefined when no schema is provided to match FastMCP API shape.
 */
export function toZodParameters(schema?: TSchema) {
  return schema ? (ZodFromTypeBox(schema) as unknown) : undefined;
}

/**
 * Convenience helper to register a tool defined with TypeBox parameters.
 * This ensures parameters are converted to Zod so MCP clients (Cursor/Claude)
 * recognize the schema without xsschema vendor issues.
 */
// FastMCP's generic constraint is FastMCPSessionAuth = Record<string, unknown> | undefined.
// Mirror that here to avoid importing non-exported types from fastmcp.
export function addTypeBoxTool<TSession extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
  server: FastMCP<TSession>,
  tool: {
    name: string;
    description: string;
    parameters?: TSchema;
    execute: Tool<TSession>["execute"];
  },
) {
  server.addTool({
    name: tool.name,
    description: tool.description,
    parameters: toZodParameters(tool.parameters) as any,
    execute: tool.execute as any,
  } as unknown as Tool<TSession>);
}


