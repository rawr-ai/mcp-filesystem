import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-filesize-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test',
    '--full-access'
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_filesize/'; // Unique base path
const smallFileSize = 100; // Bytes
const largeFileSize = 200; // Bytes
const testLimit = 150; // Test limit between small and large

describe('test-filesystem::regex_search_content - Max File Size Limiting', () => {
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
    console.log('MCP Client Connected for Max File Size Tests.');

    // Ensure the base directory exists and is clean
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create files of different sizes
    const pattern = 'filesize_pattern';
    const smallContent = `${pattern} `.padEnd(smallFileSize - 1, 's') + '\n'; // Approx smallFileSize bytes
    const largeContent = `${pattern} `.padEnd(largeFileSize - 1, 'l') + '\n'; // Approx largeFileSize bytes

    await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}small_file.txt`,
        content: smallContent
    }});
     await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}large_file.txt`,
        content: largeContent
    }});
     await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}another_small_file.txt`,
        content: smallContent.replace(pattern, 'another_pattern') // Doesn't match main pattern
    }});
     await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}exact_limit_file.txt`, // Create a file around the limit size
        content: `${pattern} `.padEnd(testLimit -1, 'e') + '\n'
    }});


    console.log('Test files created for Max File Size.');
  });

  afterAll(async () => {
    try {
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for Max File Size.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Max File Size Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-050: should search files smaller than maxFileSize limit', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'filesize_pattern',
      maxFileSize: testLimit // Limit is 150
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should find small_file.txt and exact_limit_file.txt (assuming limit is inclusive <=)
    expect(result.data).toHaveLength(2);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
        `${testBasePath}small_file.txt`,
        `${testBasePath}exact_limit_file.txt`
    ]));
    // Should NOT find large_file.txt
    expect(result.data.some((f: FileResult) => f.file === `${testBasePath}large_file.txt`)).toBe(false);
  });

  it('RCS-051: should skip files larger than maxFileSize limit', async () => {
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'filesize_pattern',
      maxFileSize: smallFileSize + 10 // Limit is ~110, only small_file should be searched
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should only find small_file.txt
    expect(result.data).toHaveLength(1);
    expect(result.data[0].file).toBe(`${testBasePath}small_file.txt`);
  });

  it('RCS-052: should use default maxFileSize (10MB) when not specified', async () => {
    // Default is 10MB, which is much larger than our test files
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'filesize_pattern',
      // maxFileSize omitted
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should find all files containing the pattern regardless of size (small, large, exact)
    expect(result.data).toHaveLength(3);
     expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
        `${testBasePath}small_file.txt`,
        `${testBasePath}large_file.txt`,
        `${testBasePath}exact_limit_file.txt`
    ]));
  });

});