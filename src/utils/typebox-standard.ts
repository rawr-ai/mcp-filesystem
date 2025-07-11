import { TypeCompiler } from '@sinclair/typebox/compiler';
import type { TSchema } from '@sinclair/typebox';
import { StandardSchemaV1 } from '@standard-schema/spec';

export function toStandardSchema(schema: TSchema): StandardSchemaV1 {
  const compiled = TypeCompiler.Compile(schema);
  return {
    "~standard": {
      version: 1,
      vendor: 'typebox',
      validate(value: unknown): StandardSchemaV1.Result<unknown> {
        if (compiled.Check(value)) {
          return { value };
        }
        const issues = [...compiled.Errors(value)].map((e) => ({
          message: e.message,
          path: e.path ? [e.path] : undefined,
        }));
        return { issues };
      },
    },
  };
}
