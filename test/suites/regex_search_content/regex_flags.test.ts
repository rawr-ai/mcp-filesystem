import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput, getTextContent } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-flags-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_flags/';

describe('test-filesystem::regex_search_content - Regex Flags', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}case.txt`, content: 'CaseSensitivePattern' } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('performs case-sensitive search by default', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'CaseSensitivePattern' } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(getTextContent(res));
    expect(parsed[0].file).toBe(path.join(serverRoot, `${testBasePath}case.txt`));
  });

  it('returns an error for unsupported (?i) flag', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: '(?i)casesensitivepattern' } }, CallToolResultSchema);
    expect(res.isError).toBe(true);
    expect(getTextContent(res)).toMatch(/Invalid regex pattern/);
  });
});
