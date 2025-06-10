import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-filesize-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_filesize/';

describe('test-filesystem::regex_search_content - Max File Size Limiting', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}small.txt`, content: 'filesize_pattern small' } });
    const bigContent = 'filesize_pattern '.padEnd(2000, 'x');
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}large.txt`, content: bigContent } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('skips files larger than limit', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'filesize_pattern', maxFileSize: 100 } });
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(res.content[0].text).map(r => r.file);
    expect(files).toEqual([path.join(serverRoot, `${testBasePath}small.txt`)]);
  });

  it('searches all when limit high', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'filesize_pattern', maxFileSize: 5000 } });
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(res.content[0].text).map(r => r.file);
    expect(files).toEqual(expect.arrayContaining([
      path.join(serverRoot, `${testBasePath}small.txt`),
      path.join(serverRoot, `${testBasePath}large.txt`)
    ]));
  });
});
