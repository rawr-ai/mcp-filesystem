import { Type, Static } from "@sinclair/typebox";

// Schema for JSONPath query operations
export const JsonQueryArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file to query' }),
  query: Type.String({ description: 'JSONPath expression to execute against the JSON data' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type JsonQueryArgs = Static<typeof JsonQueryArgsSchema>;

// Schema for filtering JSON arrays
export const JsonFilterArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file to filter' }),
  arrayPath: Type.Optional(
    Type.String({ description: 'Optional JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")' })
  ),
  conditions: Type.Array(
    Type.Object({
      field: Type.String({ description: 'Path to the field to check (e.g., "address.city" or "tags[0]")' }),
      operator: Type.Union([
        Type.Literal('eq'), Type.Literal('neq'),
        Type.Literal('gt'), Type.Literal('gte'),
        Type.Literal('lt'), Type.Literal('lte'),
        Type.Literal('contains'),
        Type.Literal('startsWith'),
        Type.Literal('endsWith'),
        Type.Literal('exists'),
        Type.Literal('type')
      ], { description: 'Comparison operator' }),
      value: Type.Any({ description: 'Value to compare against' })
    }),
    { minItems: 1, description: 'Array of filter conditions' }
  ),
  match: Type.Optional(
    Type.Union([Type.Literal('all'), Type.Literal('any')], {
      default: 'all',
      description: 'How to combine multiple conditions - "all" for AND, "any" for OR'
    })
  ),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type JsonFilterArgs = Static<typeof JsonFilterArgsSchema>;

// Schema for getting a specific value from a JSON file
export const JsonGetValueArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file' }),
  field: Type.String({ description: 'Path to the field to retrieve (e.g., "user.address.city" or "items[0].name")' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type JsonGetValueArgs = Static<typeof JsonGetValueArgsSchema>;

// Schema for transforming JSON data
export const JsonTransformArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file to transform' }),
  operations: Type.Array(
    Type.Object({
      type: Type.Union([
        Type.Literal('map'),
        Type.Literal('groupBy'),
        Type.Literal('sort'),
        Type.Literal('flatten'),
        Type.Literal('pick'),
        Type.Literal('omit')
      ], { description: 'Type of transformation operation' }),
      field: Type.Optional(Type.String({ description: 'Field to operate on (if applicable)' })),
      order: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')], { description: 'Sort order (if applicable)' })),
      fields: Type.Optional(Type.Array(Type.String(), { description: 'Fields to pick/omit (if applicable)' }))
    }),
    { minItems: 1, description: 'Array of transformation operations to apply in sequence' }
  ),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type JsonTransformArgs = Static<typeof JsonTransformArgsSchema>;

// Schema for getting JSON structure
export const JsonStructureArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file to analyze' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  }),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'How deep to analyze the structure. Must be a positive integer. Handler default: 2.'
  }),
  detailedArrayTypes: Type.Optional(Type.Boolean({
    default: false,
    description: 'Whether to analyze all array elements for mixed types (default: false)'
  }))
});
export type JsonStructureArgs = Static<typeof JsonStructureArgsSchema>;

// Schema for sampling JSON array elements
export const JsonSampleArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file containing the array' }),
  arrayPath: Type.String({ description: 'JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")' }),
  count: Type.Integer({ minimum: 1, description: 'Number of elements to sample' }),
  method: Type.Optional(
    Type.Union([Type.Literal('first'), Type.Literal('random')], {
      default: 'first',
      description: 'Sampling method - "first" for first N elements, "random" for random sampling'
    })
  ),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type JsonSampleArgs = Static<typeof JsonSampleArgsSchema>;

// Schema for JSON Schema validation
export const JsonValidateArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the JSON file to validate' }),
  schemaPath: Type.String({ description: 'Path to the JSON Schema file' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  }),
  strict: Type.Optional(Type.Boolean({
    default: false,
    description: 'Whether to enable strict mode validation (additionalProperties: false)'
  })),
  allErrors: Type.Optional(Type.Boolean({
    default: true,
    description: 'Whether to collect all validation errors or stop at first error'
  }))
});
export type JsonValidateArgs = Static<typeof JsonValidateArgsSchema>;

// Schema for searching JSON files by key/value pairs
export const JsonSearchKvArgsSchema = Type.Object({
  directoryPath: Type.String({ description: 'Directory to search in' }),
  key: Type.String({ description: 'Key to search for' }),
  value: Type.Optional(Type.Any({ description: 'Optional value to match against the key' })),
  recursive: Type.Optional(Type.Boolean({ default: true, description: 'Whether to search recursively in subdirectories' })),
  matchType: Type.Optional(
    Type.Union([
      Type.Literal('exact'),
      Type.Literal('contains'),
      Type.Literal('startsWith'),
      Type.Literal('endsWith')
    ], { default: 'exact', description: 'How to match values - only applies if value is provided' })
  ),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from each file. Must be a positive integer. Handler default: 10KB.'
  }),
  maxResults: Type.Integer({
    minimum: 1,
    description: 'Maximum number of results to return. Must be a positive integer. Handler default: 10.'
  }),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'Maximum directory depth to search. Must be a positive integer. Handler default: 2.'
  })
});
export type JsonSearchKvArgs = Static<typeof JsonSearchKvArgsSchema>;
