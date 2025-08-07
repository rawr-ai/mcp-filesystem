import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getTextContent } from "../utils/regexUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../fs_root");

describe("stdio transport", () => {
  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
  });

  afterAll(async () => {
  });

  it("announces tools over stdio", async () => {
    const client = new Client({ name: "stdio-test", version: "1.0" });
    const transport = new StdioClientTransport({
      command: "node",
      args: [
        path.resolve(__dirname, "../../dist/index.js"),
        serverRoot,
        "--readonly",
      ],
    });
    await client.connect(transport as any);
    const res = await client.callTool({
      name: "list_allowed_directories",
      arguments: {},
    });
    expect(getTextContent(res)).toContain(serverRoot);
    await transport.close();
  });

  it("lists tools with parameter schemas", async () => {
    const client = new Client({ name: "stdio-list-tools", version: "1.0" });
    const transport = new StdioClientTransport({
      command: "node",
      args: [
        path.resolve(__dirname, "../../dist/index.js"),
        serverRoot,
        "--readonly",
      ],
    });
    await client.connect(transport as any);
    const list = await client.listTools();
    const parsed = ListToolsResultSchema.parse(list);
    const sample = parsed.tools.find((t) => t.name === "list_directory" || t.name === "read_file");
    expect(sample).toBeTruthy();
    expect(sample?.inputSchema).toBeTruthy();
    // Ensure schema isn’t using unsupported vendor by checking presence of jsonSchema or zod-ish shape
    const schemaKeys = Object.keys(sample!.inputSchema as Record<string, unknown>);
    expect(schemaKeys.length).toBeGreaterThan(0);
    await transport.close();
  });
});


