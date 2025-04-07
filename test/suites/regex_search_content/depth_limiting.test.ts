import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-depth-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test',
    '--full-access'
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_depth/'; // Unique base path for this suite

describe('test-filesystem::regex_search_content - Depth Limiting', () => {
  let client: Client;
  let transport: StdioClientTransport;
  // Define interfaces for the expected result structure
  interface RegexMatch { line: number; text: string; }
  interface FileResult { file: string; matches: RegexMatch[]; }

  // --- Setup & Teardown ---
  beforeAll(async () => {
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);
    console.log('MCP Client Connected for Depth Limiting Tests.');

    // Ensure the base directory exists and is clean
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore if it doesn't exist */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create nested directory structure
    // testBasePath/
    //   file_root.txt (match)
    //   subdir1/
    //     file_depth1.txt (match)
    //     subdir2/
    //       file_depth2.txt (match)
    //       subdir3/
    //         file_depth3.txt (match)
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}file_root.txt`, content: 'Match at root level: depth_pattern' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}subdir1/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir1/file_depth1.txt`, content: 'Match at depth 1: depth_pattern' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}subdir1/subdir2/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir1/subdir2/file_depth2.txt`, content: 'Match at depth 2: depth_pattern' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}subdir1/subdir2/subdir3/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir1/subdir2/subdir3/file_depth3.txt`, content: 'Match at depth 3: depth_pattern' } });

    console.log('Test files created for Depth Limiting.');
  });

  afterAll(async () => {
    try {
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for Depth Limiting.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Depth Limiting Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-010: should find files only at the root level when maxDepth is 0', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'depth_pattern',
      maxDepth: 0
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].file).toBe(`${testBasePath}file_root.txt`);
  });

  it('RCS-011: should find files up to depth 1 when maxDepth is 1', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'depth_pattern',
      maxDepth: 1
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_root.txt`,
      `${testBasePath}subdir1/file_depth1.txt`
    ]));
  });

  it('RCS-012: should find files up to depth 2 when maxDepth is 2 (default)', async () => {
    // Test with explicit maxDepth: 2
    let result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'depth_pattern',
      maxDepth: 2
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_root.txt`,
      `${testBasePath}subdir1/file_depth1.txt`,
      `${testBasePath}subdir1/subdir2/file_depth2.txt`
    ]));

    // Test with default maxDepth (should also be 2 based on spec)
    result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'depth_pattern',
      // maxDepth omitted, should default to 2
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(3); // Expecting 3 files up to depth 2
     expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_root.txt`,
      `${testBasePath}subdir1/file_depth1.txt`,
      `${testBasePath}subdir1/subdir2/file_depth2.txt`
    ]));
  });

   it('RCS-013: should find all files when maxDepth is large enough', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'depth_pattern',
      maxDepth: 5 // Sufficiently large
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(4); // All 4 files should be found
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_root.txt`,
      `${testBasePath}subdir1/file_depth1.txt`,
      `${testBasePath}subdir1/subdir2/file_depth2.txt`,
      `${testBasePath}subdir1/subdir2/subdir3/file_depth3.txt`
    ]));
  });

  // RCS-083: maxDepth Validation is handled by the server schema, but we can add a client-side check if desired,
  // or rely on the server to reject invalid input (e.g., negative depth).
  // For now, assume server validation covers this.

});