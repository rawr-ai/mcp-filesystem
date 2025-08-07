import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ClientCapabilities,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { getTextContent } from "../../utils/regexUtils.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const clientInfo = { name: "regex-search-path-test-suite", version: "0.1.0" };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../../fs_root");
const serverCommand = "bun";
const serverArgs = ["dist/index.js", serverRoot, "--full-access"];
const testRelativeBasePath = "regex_search_content_paths/";
const absoluteBasePath = path.join(serverRoot, testRelativeBasePath);

describe("test-filesystem::regex_search_content - Path Usage", () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
    });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({
      name: "create_directory",
      arguments: { path: testRelativeBasePath },
    });
    await client.callTool({
      name: "create_file",
      arguments: {
        path: `${testRelativeBasePath}file_in_root.txt`,
        content: "Path pattern",
      },
    });
    await client.callTool({
      name: "create_directory",
      arguments: { path: `${testRelativeBasePath}sub/` },
    });
    await client.callTool({
      name: "create_file",
      arguments: {
        path: `${testRelativeBasePath}sub/file_in_subdir.txt`,
        content: "Path pattern",
      },
    });
  });

  afterAll(async () => {
    await client.callTool({
      name: "delete_directory",
      arguments: { path: testRelativeBasePath, recursive: true },
    });
    await transport.close();
  });

  it("works with relative path", async () => {
    const res = await client.callTool(
      {
        name: "regex_search_content",
        arguments: { path: testRelativeBasePath, regex: "Path pattern" },
      },
      CallToolResultSchema,
    );
    expect(res.isError).not.toBe(true);
    expect(getTextContent(res)).toMatch("file_in_root.txt");
  });

  it("works with absolute path within root", async () => {
    const res = await client.callTool(
      {
        name: "regex_search_content",
        arguments: { path: absoluteBasePath, regex: "Path pattern" },
      },
      CallToolResultSchema,
    );
    expect(res.isError).not.toBe(true);
    expect(getTextContent(res)).toMatch("file_in_root.txt");
  });

  it("errors for path outside root", async () => {
    const outside = path.dirname(serverRoot);
    const res = await client.callTool(
      {
        name: "regex_search_content",
        arguments: { path: outside, regex: "x" },
      },
      CallToolResultSchema,
    );
    expect(res.isError).toBe(true);
    expect(getTextContent(res)).toMatch(/Access denied/);
  });
});
