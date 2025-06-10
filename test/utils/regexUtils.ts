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
