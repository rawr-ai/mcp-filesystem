import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import { parseRegexSearchOutput } from '../../utils/regexUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'regex-search-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const testBasePath = 'regex_search_content/';

describe('test-filesystem::regex_search_content - Basic Search', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: testBasePath } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}file1.txt`, content: 'A unique_pattern_123 here' } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}file2.log`, content: 'Another unique_pattern_123 again' } });
    await client.callTool({ name: 'create_directory', arguments: { path: `${testBasePath}sub/` } });
    await client.callTool({ name: 'create_file', arguments: { path: `${testBasePath}sub/subfile.txt`, content: 'unique_pattern_123 in sub' } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: testBasePath, recursive: true } });
    await transport.close();
  });

  it('finds a pattern in a single file', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'unique_pattern_123', filePattern: 'file1.txt' } });
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(res.content[0].text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].file).toBe(path.join(serverRoot, `${testBasePath}file1.txt`));
  });

  it('returns multiple files when pattern exists in them', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'unique_pattern_123', filePattern: '**/*' } });
    expect(res.isError).not.toBe(true);
    const parsed = parseRegexSearchOutput(res.content[0].text);
    const files = parsed.map(p => p.file);
    expect(files).toEqual(expect.arrayContaining([
      path.join(serverRoot, `${testBasePath}file1.txt`),
      path.join(serverRoot, `${testBasePath}file2.log`),
      path.join(serverRoot, `${testBasePath}sub/subfile.txt`)
    ]));
  });

  it('returns no matches when pattern does not exist', async () => {
    const res: any = await client.callTool({ name: 'regex_search_content', arguments: { path: testBasePath, regex: 'does_not_exist' } });
    expect(res.isError).not.toBe(true);
    expect(res.content[0].text).toBe('No matches found for the given regex pattern.');
  });
});
