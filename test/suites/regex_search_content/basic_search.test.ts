import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Import necessary classes and types from the SDK specific paths
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-test-suite', version: '0.1.0' };
// Define minimal capabilities needed for testing tool use
const clientCapabilities: ClientCapabilities = {
  toolUse: { enabled: true },
  // Add other capabilities if required by the client or server during testing
};

// Command to launch the test-filesystem server
// Assumes the test server targets the '/test' directory with full access
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js', // Path to the compiled server entry point
    '/Users/mateicanavra/Documents/.nosync/DEV/test', // Target directory for the test server
    '--full-access' // Grant permissions needed for setup/teardown
];

// Transport and Client will be instantiated in beforeAll


// --- Test Suite ---
const testBasePath = 'regex_search_content/';
// const testDir = `/Users/mateicanavra/Documents/.nosync/DEV/test/${testBasePath}`; // For context

describe('test-filesystem::regex_search_content - Basic Search', () => {
  let client: Client;
  let transport: StdioClientTransport;
  // Define interfaces for the expected result structure
  interface RegexMatch { line: number; text: string; }
  interface FileResult { file: string; matches: RegexMatch[]; }
  // Using a generic structure for now, refine if needed based on actual SDK types
  interface ToolResult { success: boolean; data?: any; error?: any; }

  // --- Setup & Teardown ---
  beforeAll(async () => {
    // Instantiate Transport and Client
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });

    // Connect the client before any tests or setup actions
    await client.connect(transport);
    console.log('MCP Client Connected for Basic Search Tests.');

    // Ensure the base directory exists (idempotent)
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create sample files for basic tests
    await client.callTool({ name: 'create_file', arguments: {
      path: `${testBasePath}file1.txt`,
      content: `This is file one.\nIt contains a unique_pattern_123.\nAnother line.\nEnd of file1.`
    }
    });
    await client.callTool({ name: 'create_file', arguments: {
      path: `${testBasePath}file2.log`,
      content: `Log file entry.\nAnother unique_pattern_123 here.\nMore logs.\nunique_pattern_123 again.`
    }
    });
    await client.callTool({ name: 'create_file', arguments: {
      path: `${testBasePath}no_match.txt`,
      content: `This file has no matching patterns.`
    }
    });
     await client.callTool({ name: 'create_file', arguments: {
      path: `${testBasePath}empty.txt`,
      content: ``
    }
    });
    // Create a subdirectory and file for basic depth check
     await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}subdir1/` } });
     await client.callTool({ name: 'create_file', arguments: {
       path: `${testBasePath}subdir1/subfile1.txt`,
       content: `Content in subdirectory.\nContains unique_pattern_123.`
     }
     });
     console.log('Test files created for Basic Search.');
  });

  afterAll(async () => {
    // Clean up test files first
    try {
        await client.callTool({ name: 'delete_directory', arguments: {
          path: testBasePath,
          recursive: true
        }});
        console.log('Test files deleted for Basic Search.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
        // Don't let cleanup failure stop disconnection
    } finally {
        // Disconnect the client after all tests in the suite are done
        // Close the transport, not the client directly
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Basic Search Tests.');
    }
  });

  // --- Test Cases (Unchanged from previous version) ---

  it('RCS-001: should find a simple pattern in a single file', async () => {
    // Interfaces moved outside the 'it' block

    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'unique_pattern_123',
      filePattern: 'file1.txt' // Limit to one file for simplicity here
    }
    }) as any; // Use 'as any' for now to bypass strict type check

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);

    const fileResult = result.data[0];
    expect(fileResult.file).toBe(`${testBasePath}file1.txt`);
    expect(fileResult.matches).toHaveLength(1);
    expect(fileResult.matches[0]).toEqual(expect.objectContaining({
      line: 2,
      text: 'It contains a unique_pattern_123.'
    }));
  });

  it('RCS-002: should find multiple occurrences of a pattern in a single file', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'unique_pattern_123',
      filePattern: 'file2.log' // Limit to the file with multiple matches
    }
    }) as any; // Use 'as any'

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);

    const fileResult = result.data[0];
    expect(fileResult.file).toBe(`${testBasePath}file2.log`);
    expect(fileResult.matches).toHaveLength(2);
    expect(fileResult.matches).toEqual(expect.arrayContaining([
      expect.objectContaining({ line: 2, text: 'Another unique_pattern_123 here.' }),
      expect.objectContaining({ line: 4, text: 'unique_pattern_123 again.' })
    ]));
  });

   it('RCS-003: should return multiple files if pattern exists in them (default depth)', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'unique_pattern_123',
      // No filePattern, default maxDepth should find in root and subdir1
    }
    }) as any; // Use 'as any'

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Expecting file1.txt, file2.log, subdir1/subfile1.txt (default depth likely >= 1)
    // Note: Default maxDepth is 2 according to spec, so this should work.
    expect(result.data).toHaveLength(3);

    // Check presence and basic match structure for each expected file
    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        file: `${testBasePath}file1.txt`,
        matches: expect.arrayContaining([expect.objectContaining({ line: 2 })])
      }),
      expect.objectContaining({
        file: `${testBasePath}file2.log`,
        matches: expect.arrayContaining([expect.objectContaining({ line: 2 }), expect.objectContaining({ line: 4 })])
      }),
       expect.objectContaining({
         file: `${testBasePath}subdir1/subfile1.txt`,
         matches: expect.arrayContaining([expect.objectContaining({ line: 2 })])
       })
    ]));
  });

  it('RCS-004: should return an empty array when searching an empty file', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'anything',
      filePattern: 'empty.txt'
    }
    }) as any; // Use 'as any'

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('RCS-005: should return an empty array when no files match the pattern', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'pattern_that_does_not_exist_anywhere',
    }}) as any; // Use 'as any'

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

   it('RCS-006: should find patterns at the beginning of a line', async () => {
     // Modify file2.log to have the pattern at the start
     await client.callTool({ name: 'modify_file', arguments: {
       path: `${testBasePath}file2.log`,
       content: `Log file entry.\nAnother unique_pattern_123 here.\nMore logs.\nunique_pattern_123 again.\nStart unique_pattern_123`
     }
     });

     const result = await client.callTool({ name: 'regex_search_content', arguments: {
       path: testBasePath,
       regex: '^Start unique_pattern_123', // Use ^ for start of line
       filePattern: 'file2.log'
     }
     }) as any; // Use 'as any'

     expect(result.success).toBe(true);
     expect(result.data).toHaveLength(1);
     expect(result.data[0].matches).toHaveLength(1);
     expect(result.data[0].matches[0]).toEqual(expect.objectContaining({
       line: 5,
       text: 'Start unique_pattern_123'
     }));

     // Revert file2.log for other tests
      await client.callTool({ name: 'modify_file', arguments: {
        path: `${testBasePath}file2.log`,
        content: `Log file entry.\nAnother unique_pattern_123 here.\nMore logs.\nunique_pattern_123 again.`
      }});
   });

   it('RCS-007: should find patterns at the end of a line', async () => {
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
       path: testBasePath,
       regex: 'unique_pattern_123\\.$', // Escaped dot, use .$ to match pattern followed by period at end
       filePattern: 'file1.txt'
     }
     }) as any; // Use 'as any'

     expect(result.success).toBe(true);
     expect(result.data).toHaveLength(1);
     expect(result.data[0].matches).toHaveLength(1);
     expect(result.data[0].matches[0]).toEqual(expect.objectContaining({
       line: 2,
       text: 'It contains a unique_pattern_123.'
     }));
   });

   // Add more basic tests as needed, covering RCS-008, RCS-009 etc. if they represent distinct basic scenarios.

});