import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput, getTextContent } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-pattern-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_pattern/';

describe('test-filesystem::regex_search_content - File Pattern Matching', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}a.txt`, content: 'pattern_here' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}b.log`, content: 'pattern_here' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}sub/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}sub/c.txt`, content: 'pattern_here' } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('limits search using *.txt glob', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'pattern_here', filePattern: '*.txt' } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(getTextContent(res)).map(r => r.file);
    expect(files).toEqual([path.join(serverRoot, `${testBasePath}a.txt`)]);
  });

  it('searches recursively with **/*.txt', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'pattern_here', filePattern: '**/*.txt' } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(getTextContent(res)).map(r => r.file);
    expect(files).toEqual(expect.arrayContaining([
      path.join(serverRoot, `${testBasePath}a.txt`),
      path.join(serverRoot, `${testBasePath}sub/c.txt`)
    ]));
  });

  it('returns empty when glob matches nothing', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'pattern_here', filePattern: '*.none' } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    expect(getTextContent(res)).toBe('No matches found for the given regex pattern.');
  });
});
