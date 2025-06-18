import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import spawn from 'cross-spawn';
import type { ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTextContent } from '../utils/regexUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../fs_root');
const serverCommand = 'bun';
const port = 8091;
const serverArgs = ['dist/index.js', serverRoot, '--full-access', '--http', '--port', String(port)];
let proc: ChildProcess;

describe('transport', () => {
  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    proc = spawn(serverCommand, serverArgs, { stdio: 'inherit' });
    await new Promise(r => setTimeout(r, 1000));
  });

  afterAll(async () => {
    proc.kill();
  });

  it('supports SSE', async () => {
    const client = new Client({ name: 'sse-test', version: '1.0' });
    const transport = new SSEClientTransport(new URL(`http://localhost:${port}/sse`));
    await client.connect(transport);
    const res = await client.callTool({ name: 'list_allowed_directories', arguments: {} });
    expect(getTextContent(res)).toContain(serverRoot);
    await transport.close();
  });

  it('supports HTTP streaming', async () => {
    const client = new Client({ name: 'http-test', version: '1.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`http://localhost:${port}/mcp`));
    await client.connect(transport);
    const res = await client.callTool({ name: 'list_allowed_directories', arguments: {} });
    expect(getTextContent(res)).toContain(serverRoot);
    await transport.close();
  });
});
