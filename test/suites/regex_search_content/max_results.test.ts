import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput, getTextContent } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-maxresults-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_maxresults/';

describe('test-filesystem::regex_search_content - Max Results Limiting', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    for (let i = 1; i <= 5; i++) {
      await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}file_${i}.txt`, content: 'max_results_pattern' } });
    }
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('limits number of files returned', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'max_results_pattern', maxResults: 2 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(getTextContent(res));
    expect(parsed.length).toBe(2);
  });

  it('returns all matches when limit higher than count', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'max_results_pattern', maxResults: 10 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(getTextContent(res));
    expect(parsed.length).toBe(5);
  });
});
