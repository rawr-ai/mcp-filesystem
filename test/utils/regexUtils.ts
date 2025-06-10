import path from 'path';

export interface RegexMatch { line: number; text: string; }
export interface FileResult { file: string; matches: RegexMatch[]; }

export function parseRegexSearchOutput(text: string): FileResult[] {
  const blocks = text.trim().split(/\n\n+/).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split(/\n/);
    const fileLine = lines.shift() || '';
    const file = fileLine.replace(/^File:\s*/, '');
    const matches = lines.map(l => {
      const m = l.match(/Line\s+(\d+):\s*(.*)/);
      return m ? { line: parseInt(m[1], 10), text: m[2] } : { line: 0, text: l };
    });
    return { file: path.normalize(file), matches };
  });
}

// Helper to safely extract text content from a CallToolResult
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';

export function getTextContent(result: unknown): string {
  const parsed = CallToolResultSchema.parse(result) as CallToolResult;
  const first = parsed.content[0];
  if (!first || first.type !== 'text') {
    throw new Error('Expected first content element to be text');
  }
  return (first as TextContent).text;
}
