import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';

// --- Client Setup ---
const clientInfo = { name: 'regex-search-flags-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const serverCommand = 'node';
const serverArgs = [
    'dist/index.js',
    '/Users/mateicanavra/Documents/.nosync/DEV/test',
    '--full-access'
];

// --- Test Suite ---
const testBasePath = 'regex_search_content_flags/'; // Unique base path

describe('test-filesystem::regex_search_content - Regex Flags', () => {
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
    console.log('MCP Client Connected for Regex Flags Tests.');

    // Ensure the base directory exists and is clean
    try {
      await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    } catch (e) { /* Ignore */ }
    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });

    // Create files with case variations
    // testBasePath/
    //   case_exact.txt (CaseSensitivePattern)
    //   case_lower.txt (casesensitivepattern)
    //   case_upper.txt (CASESENSITIVEPATTERN)
    //   case_mixed.txt (CaseSensitivePattern and cAsEsEnSiTiVePaTtErN)
    //   multiline.txt (for potential future tests)

    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}case_exact.txt`, content: 'Exact match: CaseSensitivePattern' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}case_lower.txt`, content: 'Lower case: casesensitivepattern' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}case_upper.txt`, content: 'Upper case: CASESENSITIVEPATTERN' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}case_mixed.txt`, content: 'Mixed cases:\nLine 1: CaseSensitivePattern\nLine 2: cAsEsEnSiTiVePaTtErN' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}multiline.txt`, content: 'Line one.\nPattern\nLine three.' } });


    console.log('Test files created for Regex Flags.');
  });

  afterAll(async () => {
    try {
        await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true }});
        console.log('Test files deleted for Regex Flags.');
    } catch (error) {
        console.error("Error deleting test directory:", error);
    } finally {
        if (transport) await transport.close();
        console.log('MCP Client Disconnected for Regex Flags Tests.');
    }
  });

  // --- Test Cases ---

  it('RCS-030: should perform a case-sensitive search by default', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: 'CaseSensitivePattern', // Exact case
      // No filePattern, search all
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should only find in case_exact.txt and case_mixed.txt (first occurrence)
    expect(result.data).toHaveLength(2);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}case_exact.txt`,
      `${testBasePath}case_mixed.txt`
    ]));

    // Verify matches within files
     const exactFile = result.data.find((f: FileResult) => f.file === `${testBasePath}case_exact.txt`);
     expect(exactFile?.matches).toHaveLength(1);
     expect(exactFile?.matches[0].text).toContain('CaseSensitivePattern');

     const mixedFile = result.data.find((f: FileResult) => f.file === `${testBasePath}case_mixed.txt`);
     expect(mixedFile?.matches).toHaveLength(1); // Default regex finds only the first match per line
     expect(mixedFile?.matches[0].line).toBe(2);
     expect(mixedFile?.matches[0].text).toContain('CaseSensitivePattern');
  });

  it('RCS-031: should perform a case-insensitive search using (?i) flag', async () => {
    const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: '(?i)casesensitivepattern', // Case-insensitive flag with lower case pattern
    }}) as any;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should find in all four files
    expect(result.data).toHaveLength(4);
    expect(result.data.map((f: FileResult) => f.file)).toEqual(expect.arrayContaining([
      `${testBasePath}case_exact.txt`,
      `${testBasePath}case_lower.txt`,
      `${testBasePath}case_upper.txt`,
      `${testBasePath}case_mixed.txt`
    ]));

     // Quick check on mixed file - should find both lines if regex engine handles multiple matches per file correctly
     const mixedFile = result.data.find((f: FileResult) => f.file === `${testBasePath}case_mixed.txt`);
     // Note: The tool returns one match per *line*. If multiple matches are on one line, only the line is returned once.
     // If the pattern appears on multiple lines, multiple matches are returned.
     expect(mixedFile?.matches).toHaveLength(2); // Expecting matches on line 2 and line 3
     expect(mixedFile?.matches).toEqual(expect.arrayContaining([
        expect.objectContaining({ line: 2, text: 'Line 1: CaseSensitivePattern' }),
        expect.objectContaining({ line: 3, text: 'Line 2: cAsEsEnSiTiVePaTtErN' })
     ]));
  });

  // RCS-032: Multiline flag (m) - Affects ^ and $. The tool seems line-oriented, so this might be implicitly handled or less relevant.
  it.skip('RCS-032: should handle multiline flag (m) correctly (if applicable)', async () => {
    // Requires a regex pattern using ^ or $ and content spanning multiple lines where this matters.
    // Example: Searching for '^Pattern' in multiline.txt
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: '(?m)^Pattern', // Multiline flag, match start of line
      filePattern: 'multiline.txt'
    }}) as any;
     expect(result.success).toBe(true);
     expect(result.data).toHaveLength(1);
     expect(result.data[0].matches[0].line).toBe(2); // Should match line 2
  });

  // RCS-033: DotAll flag (s) - Makes '.' match newlines. Less likely relevant for line-based matching.
  it.skip('RCS-033: should handle dotall flag (s) correctly (if applicable)', async () => {
    // Requires a regex pattern using '.' that needs to span across newline characters.
    // Example: 'Line one.*Line three.'
     const result = await client.callTool({ name: 'regex_search_content', arguments: {
      path: testBasePath,
      regex: '(?s)Line one.*Line three.', // DotAll flag
      filePattern: 'multiline.txt'
    }}) as any;
     // The expected behavior here is unclear without knowing how the tool handles matches spanning lines.
     // If it reports the starting line, we'd expect line 1.
     expect(result.success).toBe(true);
     // Assertion depends heavily on implementation details.
     // expect(result.data).toHaveLength(1);
     // expect(result.data[0].matches[0].line).toBe(1);
  });

});