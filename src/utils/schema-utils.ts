import { Value } from '@sinclair/typebox/value';
import type { Static, TSchema } from '@sinclair/typebox';

export function parseArgs<T extends TSchema>(schema: T, args: unknown, context: string): Static<T> {
  try {
    // Use only the Assert step to ensure strict validation
    return Value.Parse(['Assert'], schema, args);
  } catch {
    const errors = [...Value.Errors(schema, args)]
      .map(e => `${e.path}: ${e.message}`)
      .join('; ');
    throw new Error(`Invalid arguments for ${context}: ${errors}`);
  }
}
