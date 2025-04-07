import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-maxresults-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test',
    '--full-access'
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_maxresults/'; // Unique base path

describe('test-filesystem::regex_search_content - Max Results Limiting', () => {
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
    console.log('MCP Client Connected for Max Results Tests.');

    // Ensure the base directory exists and is clean
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create multiple files with the same pattern
    const pattern = 'max_results_pattern';
    for (let i = 1; i <= 5; i++) {
      await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}file_${i}.txt`,
        content: `This is file ${i}.\nIt contains the pattern: ${pattern}`
      }});
    }
     // Add one file without the pattern
     await client.callTool({ name: 'create_file', arguments: {
        path: `${testBasePath}no_match.txt`,
        content: `This file does not match.`
      }});


    console.log('Test files created for Max Results.');
  });

  afterAll(async () => {
    try {
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for Max Results.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Max Results Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-040: should return only 1 file when maxResults is 1', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'max_results_pattern',
      maxResults: 1
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    // We don't know *which* file it will be due to potential async reads, just that it's one of them.
    expect(result.data[0].file).toMatch(/file_\d\.txt$/);
  });

  it('RCS-041: should return exactly 3 files when maxResults is 3', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'max_results_pattern',
      maxResults: 3
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(3);
    // Check that all returned files are among the expected ones
    const expectedFiles = [`${testBasePath}file_1.txt`, `${testBasePath}file_2.txt`, `${testBasePath}file_3.txt`, `${testBasePath}file_4.txt`, `${testBasePath}file_5.txt`];
    result.data.forEach((f: FileResult) => {
        expect(expectedFiles).toContain(f.file);
    });
  });

  it('RCS-042: should return all matching files (5) when maxResults is larger (10)', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'max_results_pattern',
      maxResults: 10 // Larger than the number of matching files
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(5); // Should return all 5 matching files
     expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_1.txt`,
      `${testBasePath}file_2.txt`,
      `${testBasePath}file_3.txt`,
      `${testBasePath}file_4.txt`,
      `${testBasePath}file_5.txt`
    ]));
  });

   it('should return all matching files (5) when maxResults uses default (50)', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'max_results_pattern',
      // maxResults omitted, should default to 50
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(5); // Should return all 5 matching files as 5 < 50
     expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}file_1.txt`,
      `${testBasePath}file_2.txt`,
      `${testBasePath}file_3.txt`,
      `${testBasePath}file_4.txt`,
      `${testBasePath}file_5.txt`
    ]));
  });

});