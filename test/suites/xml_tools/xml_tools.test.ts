import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ClientCapabilities, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const clientInfo = { name: 'xml-tools-test-suite', version: '0.1.0' };
const clientCapabilities: ClientCapabilities = { toolUse: { enabled: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../../fs_root');
const serverCommand = 'bun';
const serverArgs = ['dist/index.js', serverRoot, '--full-access'];
const basePath = 'xml_tools/';

function getTextContent(result: unknown): string {
  const parsed = CallToolResultSchema.parse(result);
  const first = parsed.content[0];
  if (!first || first.type !== 'text') throw new Error('Expected text content');
  return (first as any).text as string;
}

describe('test-filesystem::xml_tools', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await fs.mkdir(serverRoot, { recursive: true });
    transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    client = new Client(clientInfo, { capabilities: clientCapabilities });
    await client.connect(transport);

    await client.callTool({ name: 'create_directory', arguments: { path: basePath } });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<catalog xmlns="http://example.org/catalog">\n` +
      `  <book id="bk101" category="fiction">\n` +
      `    <author>Gambardella, Matthew</author>\n` +
      `    <title>XML Developer's Guide</title>\n` +
      `  </book>\n` +
      `  <book id="bk102" category="fiction">\n` +
      `    <author>Ralls, Kim</author>\n` +
      `    <title>Midnight Rain</title>\n` +
      `  </book>\n` +
      `</catalog>\n`;

    await client.callTool({ name: 'create_file', arguments: { path: `${basePath}basic.xml`, content: xml } });

    // Create a larger XML to exercise truncation
    const manyBooks = Array.from({ length: 200 }, (_, i) => `  <book id="bk${1000 + i}"><title>T${i}</title></book>`).join('\n');
    const bigXml = `<?xml version="1.0"?><catalog xmlns="http://example.org/catalog">\n${manyBooks}\n</catalog>\n`;
    await client.callTool({ name: 'create_file', arguments: { path: `${basePath}big.xml`, content: bigXml } });
  });

  afterAll(async () => {
    await client.callTool({ name: 'delete_directory', arguments: { path: basePath, recursive: true } });
    await transport.close();
  });

  it('xml_structure returns structure for a basic XML', async () => {
    const res = await client.callTool({ name: 'xml_structure', arguments: { path: `${basePath}basic.xml`, maxDepth: 2, includeAttributes: true, maxResponseBytes: 1024 * 1024 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const text = getTextContent(res);
    const obj = JSON.parse(text);
    expect(obj.rootElement).toBe('catalog');
    expect(typeof obj.elements).toBe('object');
    expect(obj.namespaces).toBeDefined();
  });

  it('xml_query supports XPath with local-name() (namespace-agnostic)', async () => {
    const res = await client.callTool({ name: 'xml_query', arguments: { path: `${basePath}basic.xml`, query: "//*[local-name()='title']/text()", includeAttributes: true, maxResponseBytes: 50 * 1024 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const text = getTextContent(res);
    const arr = JSON.parse(text);
    expect(Array.isArray(arr)).toBe(true);
    // Expect at least two titles
    expect(arr.length).toBeGreaterThanOrEqual(2);
    expect(arr[0].type).toBeDefined();
  });

  it('xml_structure truncates output when exceeding maxResponseBytes', async () => {
    const res = await client.callTool({ name: 'xml_structure', arguments: { path: `${basePath}big.xml`, maxDepth: 2, includeAttributes: false, maxResponseBytes: 300 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const text = getTextContent(res);
    const obj = JSON.parse(text);
    expect(obj._meta?.truncated).toBe(true);
  });

  it('xml_query truncates output when exceeding maxResponseBytes', async () => {
    const res = await client.callTool({ name: 'xml_query', arguments: { path: `${basePath}big.xml`, query: "//*[local-name()='book']", includeAttributes: true, maxResponseBytes: 400 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const text = getTextContent(res);
    // Either includes meta or a small array; ensure length is not huge
    expect(text.length).toBeLessThanOrEqual(400 + 200); // allow small overhead
  });

  it('xml_to_json_string returns JSON and applies response cap when small', async () => {
    const res = await client.callTool({ name: 'xml_to_json_string', arguments: { xmlPath: `${basePath}big.xml`, maxResponseBytes: 500 } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const jsonText = getTextContent(res);
    const parsed = JSON.parse(jsonText);
    expect(parsed._meta?.truncated).toBe(true);
  });

  it('xml_to_json writes a file and applies response cap when small', async () => {
    const outPath = `${basePath}out.json`;
    const res = await client.callTool({ name: 'xml_to_json', arguments: { xmlPath: `${basePath}big.xml`, jsonPath: outPath, maxResponseBytes: 600, options: { format: true } } }, CallToolResultSchema);
    expect(res.isError).not.toBe(true);
    const read = await client.callTool({ name: 'read_file', arguments: { path: outPath, maxBytes: 100000 } }, CallToolResultSchema);
    const jsonText = getTextContent(read);
    const parsed = JSON.parse(jsonText);
    expect(parsed._meta?.truncated).toBe(true);
  });
});


