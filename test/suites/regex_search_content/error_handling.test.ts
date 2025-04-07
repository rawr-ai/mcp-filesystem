import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-error-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test', // Use a base path that exists
    '--full-access' // Need access to check non-existent paths etc.
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_errors/'; // Base path for any files needed
const nonExistentPath = 'regex_search_content_non_existent_path/';

describe('test-filesystem::regex_search_content - Error Handling', () => {
  let client: Client;
  let transport: StdioClientTransport;

  // --- Setup & Teardown ---
  beforeAll(async () => {
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);
    console.log('MCP Client Connected for Error Handling Tests.');

    // Clean up any potential leftover directories
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
     try {
      // Ensure the non-existent path is indeed non-existent before tests
      await client.callTool({ name: 'delete_directory', arguments: { path: nonExistentPath, recursive: true } });
    } catch (e) { /* Ignore */ }

    // Create base directory for file path test
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}a_file.txt`, content: 'This is a file, not a directory.' } });

    console.log('Test setup complete for Error Handling.');
  });

  afterAll(async () => {
    try {
        // Clean up created directory
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for Error Handling.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Error Handling Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-060: should return an error for invalid regex syntax', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath, // Needs a valid path to attempt search
      regex: '[invalid_regex', // Malformed regex
    }}) as any;

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.message).toMatch(/regex parse error/i); // Check for regex error message
     expect(result.error.code).toBe('REGEX_PARSE_ERROR'); // Assuming a specific error code
  });

  it('RCS-061: should return an error if the search path does not exist', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: nonExistentPath, // This path should not exist
      regex: 'any_pattern',
    }}) as any;

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.message).toMatch(/path does not exist|not found/i); // Check for path error
    expect(result.error.code).toBe('PATH_NOT_FOUND'); // Assuming a specific error code
  });

  it('RCS-062: should return an error if the search path is a file, not a directory', async () => {
     const filePath = `${testBasePath}a_file.txt`;
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: filePath, // Path is a file
      regex: 'any_pattern',
    }}) as any;

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.message).toMatch(/path is not a directory/i);
    expect(result.error.code).toBe('PATH_IS_NOT_DIRECTORY'); // Assuming a specific error code
  });

  // RCS-063: Permission Denied - Hard to test reliably without setting up specific permissions.
  // Assuming --full-access bypasses this for the test server.
  it.skip('RCS-063: should return an error for permission denied (if applicable)', async () => {
    // This would require setting up a directory the server process cannot read.
    // const restrictedPath = '/path/to/restricted/dir'; // Example
    // const result = await client.callTool({ name: 'regex_search_content', arguments: {
    //   path: restrictedPath,
    //   regex: 'any_pattern',
    // }}) as any;
    // expect(result.success).toBe(false);
    // expect(result.error).toBeDefined();
    // expect(result.error.code).toBe('PERMISSION_DENIED');
  });

  // RCS-064: Other potential errors (e.g., resource exhaustion) are harder to simulate.

});