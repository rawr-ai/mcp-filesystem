import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-pattern-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test',
    '--full-access'
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_pattern/'; // Unique base path

describe('test-filesystem::regex_search_content - File Pattern Matching', () => {
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
    console.log('MCP Client Connected for File Pattern Tests.');

    // Ensure the base directory exists and is clean
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create diverse file structure
    // testBasePath/
    //   report.txt (match)
    //   summary.log (match)
    //   config.json (no match)
    //   temp.tmp (match, for negation test)
    //   subdir/
    //     data.txt (match)
    //     archive.zip (no match)
    //     notes.log (match)
    //   data/
    //     users.json (match)
    //     products.csv (no match)

    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}report.txt`, content: 'Pattern found here: file_pattern_match' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}summary.log`, content: 'Log entry: file_pattern_match' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}config.json`, content: '{"setting": "value"}' } }); // No pattern
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}temp.tmp`, content: 'Temporary file: file_pattern_match' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}subdir/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir/data.txt`, content: 'Subdir data: file_pattern_match' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir/archive.zip`, content: 'binary' } }); // No pattern
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}subdir/notes.log`, content: 'Subdir log: file_pattern_match' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}data/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}data/users.json`, content: '[{"user": "test", "value": "file_pattern_match"}]' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}data/products.csv`, content: 'id,name' } }); // No pattern

    console.log('Test files created for File Pattern.');
  });

  afterAll(async () => {
    try {
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for File Pattern.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for File Pattern Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-020: should find pattern only in .txt files using *.txt glob', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: '*.txt' // Only top-level txt
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].file).toBe(`${testBasePath}report.txt`);
  });

   it('RCS-021: should find pattern only in specific json file using data/*.json glob', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: 'data/*.json'
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].file).toBe(`${testBasePath}data/users.json`);
  });

  it('RCS-022: should find pattern in all .log files recursively using **/*.log glob', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: '**/*.log' // All log files in any subdir
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}summary.log`,
      `${testBasePath}subdir/notes.log`
    ]));
  });

  // Note: Glob negation support depends on the underlying library used by the server.
  // Assuming basic ! negation works as per spec RCS-023.
  it('RCS-023: should exclude .tmp files using !*.tmp glob negation (if supported)', async () => {
     // This test assumes the server's glob implementation supports negation.
     // If it doesn't, this test might find the .tmp file.
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: '!*.tmp' // Exclude tmp files
      // This might require searching all files first and then filtering, depending on implementation.
      // Let's test searching all files first to see what we get without negation.
    }}) as any;

     const allFilesResult = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      // No filePattern -> search all
    }}) as any;

    // Check if the non-negated search finds the .tmp file
    const foundTmpFile = allFilesResult.data.some((f: FileResult) => f.file === `${testBasePath}temp.tmp`);
    expect(foundTmpFile).toBe(true); // Ensure the file exists and has the pattern

    // Now check the result with negation
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Expect all matching files EXCEPT the .tmp file
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}report.txt`,
      `${testBasePath}summary.log`,
      `${testBasePath}subdir/data.txt`,
      `${testBasePath}subdir/notes.log`,
      `${testBasePath}data/users.json`,
    ]));
    expect(result.data.some((f: FileResult) => f.file === `${testBasePath}temp.tmp`)).toBe(false); // Explicitly check exclusion
  });

  it('RCS-024: should handle a specific subdirectory pattern like subdir/*.txt', async () => {
    // Testing a single, more complex pattern as multiple patterns aren't directly supported by the schema.
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: 'subdir/*.txt'
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].file).toBe(`${testBasePath}subdir/data.txt`);
  });


  it('RCS-025: should return empty results if filePattern matches no files', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'file_pattern_match',
      filePattern: '*.nonexistent'
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

});