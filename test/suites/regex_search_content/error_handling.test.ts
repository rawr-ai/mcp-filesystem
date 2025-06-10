import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-error-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_errors/';
const nonExistentPath = 'regex_search_content_nonexistent/';

describe('test-filesystem::regex_search_content - Error Handling', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}a_file.txt`, content: 'content' } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('returns error for invalid regex', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: '[invalid' } });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/Invalid regex pattern/);
  });

  it('returns no matches for non-existent path', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: nonExistentPath, regex: 'x' } });
    expect(res.isError).not.toBe(true);
    expect(res.content[0].text).toBe('No matches found for the given regex pattern.');
  });

  it('returns no matches when path is a file', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: `${testBasePath}a_file.txt`, regex: 'x' } });
    expect(res.isError).not.toBe(true);
    expect(res.content[0].text).toBe('No matches found for the given regex pattern.');
  });
});
