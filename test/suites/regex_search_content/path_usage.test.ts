import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import path from 'node:path'; // Import path for absolute path testing

// --- Client Setup ---
const clientInfo = { name: 'regex-search-path-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverTestRoot = '/Users/mateicanavra/Documents/.nosync/DEV/test'; // Server's root
const serverArgs = [
    'dist/index.js',
    serverTestRoot,
    '--full-access'
];

// --- Test Suite ---
const testRelativeBasePath = 'regex_search_content_paths/'; // Relative path within serverTestRoot
const testAbsoluteBasePath = path.join(serverTestRoot, testRelativeBasePath); // Absolute path

describe('test-filesystem::regex_search_content - Path Usage', () => {
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
    console.log('MCP Client Connected for Path Usage Tests.');

    // Ensure the base directory exists and is clean (using relative path for server)
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testRelativeBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testRelativeBasePath } });

    // Create files
    await client.callTool({ name: 'create_file', arguments: {
        path: path.join(testRelativeBasePath, 'file_in_root.txt'),
        content: 'Path pattern match in root'
    }});
    await client.callTool({ name: 'create_directory', arguments: { path: path.join(testRelativeBasePath, 'subdir') } });
    await client.callTool({ name: 'create_file', arguments: {
        path: path.join(testRelativeBasePath, 'subdir', 'file_in_subdir.txt'),
        content: 'Path pattern match in subdir'
    }});

    console.log('Test files created for Path Usage.');
  });

  afterAll(async () => {
    try {
        // Use relative path for deletion
        await client.callTool({ name: 'delete_directory', arguments: { path: testRelativeBasePath, recursive: true }});
        console.log('Test files deleted for Path Usage.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Path Usage Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-070: should find files using a relative path from the server root', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testRelativeBasePath, // e.g., 'regex_search_content_paths/'
      regex: 'Path pattern match',
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2); // Finds both files
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      path.join(testRelativeBasePath, 'file_in_root.txt'),
      path.join(testRelativeBasePath, 'subdir', 'file_in_subdir.txt')
    ]));
  });

  it('RCS-071: should find files using a relative path including a subdirectory', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: path.join(testRelativeBasePath, 'subdir'), // e.g., 'regex_search_content_paths/subdir'
      regex: 'Path pattern match',
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1); // Finds only the file in subdir
    expect(result.data[0].file).toBe(path.join(testRelativeBasePath, 'subdir', 'file_in_subdir.txt'));
  });

  // RCS-072: Absolute Path - Behavior depends on server implementation.
  // It *should* work if the absolute path is within the server's allowed root directory.
  it('RCS-072: should find files using an absolute path (within server root)', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testAbsoluteBasePath, // e.g., '/Users/mateicanavra/Documents/.nosync/DEV/test/regex_search_content_paths/'
      regex: 'Path pattern match',
    }}) as any;

    // This assertion depends on whether the server resolves and allows absolute paths within its root.
    // Assuming it does:
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2); // Finds both files
     expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      path.join(testRelativeBasePath, 'file_in_root.txt'), // Server likely still returns relative paths
      path.join(testRelativeBasePath, 'subdir', 'file_in_subdir.txt')
    ]));
     // If the server strictly forbids absolute paths, the expected result would be:
     // expect(result.success).toBe(false);
     // expect(result.error).toBeDefined();
     // expect(result.error.code).toBe('INVALID_PATH'); // Or similar error
  });

   it('should fail if absolute path is outside server root (if server enforces)', async () => {
     // Use a path guaranteed to be outside the server's test root
     const outsidePath = path.dirname(serverTestRoot); // e.g., /Users/mateicanavra/Documents/.nosync/DEV

     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: outsidePath,
      regex: 'any_pattern',
    }}) as any;

     // Expect failure due to path restrictions
     expect(result.success).toBe(false);
     expect(result.error).toBeDefined();
     // The specific error code/message might vary based on server implementation
     expect(result.error.message).toMatch(/path is outside allowed directories|invalid path/i);
     expect(result.error.code).toMatch(/PATH_OUTSIDE_ALLOWED|INVALID_PATH/);
   });

});