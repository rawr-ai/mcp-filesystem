import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput, getTextContent } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-depth-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content_depth/';

describe('test-filesystem::regex_search_content - Depth Limiting', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}file_root.txt`, content: 'depth_pattern' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}sub1/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}sub1/file1.txt`, content: 'depth_pattern' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}sub1/sub2/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}sub1/sub2/file2.txt`, content: 'depth_pattern' } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('searches only root when maxDepth is 1', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'depth_pattern', filePattern: '**/*', maxDepth: 1 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(getTextContent(res));
    expect(parsed.map(p=>p.file)).toEqual([path.join(serverRoot, `${testBasePath}file_root.txt`)]);
  });

  it('searches up to depth 2', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'depth_pattern', filePattern: '**/*', maxDepth: 2 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(getTextContent(res)).map(p=>p.file);
    expect(files).toEqual(expect.arrayContaining([
      path.join(serverRoot, `${testBasePath}file_root.txt`),
      path.join(serverRoot, `${testBasePath}sub1/file1.txt`)
    ]));
  });

  it('searches all when maxDepth large', async () => {
    const res = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'depth_pattern', filePattern: '**/*', maxDepth: 5 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const files = parseRegexSearchOutput(getTextContent(res)).map(p=>p.file);
    expect(files).toEqual(expect.arrayContaining([
      path.join(serverRoot, `${testBasePath}file_root.txt`),
      path.join(serverRoot, `${testBasePath}sub1/file1.txt`),
      path.join(serverRoot, `${testBasePath}sub1/sub2/file2.txt`)
    ]));
  });
});
