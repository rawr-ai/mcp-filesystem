import { z } from "zod";

// Schema for JSONPath query operations
export const JsonQueryArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to query'),
  query: z.string().describe('JSONPath expression to execute against the JSON data'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for filtering JSON arrays
export const JsonFilterArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to filter'),
  arrayPath: z.string().optional()
    .describe('Optional JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")'),
  conditions: z.array(z.object({
    field: z.string().describe('Path to the field to check (e.g., "address.city" or "tags[0]")'),
    operator: z.enum([
      'eq', 'neq',  // equals, not equals
      'gt', 'gte',  // greater than, greater than or equal
      'lt', 'lte',  // less than, less than or equal
      'contains',   // string/array contains
      'startsWith', // string starts with
      'endsWith',   // string ends with
      'exists',     // field exists
      'type'        // check value type
    ]).describe('Comparison operator'),
    value: z.any().describe('Value to compare against'),
  })).min(1).describe('Array of filter conditions'),
  match: z.enum(['all', 'any'])
    .default('all')
    .describe('How to combine multiple conditions - "all" for AND, "any" for OR'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for getting a specific value from a JSON file
export const JsonGetValueArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file'),
  field: z.string().describe('Path to the field to retrieve (e.g., "user.address.city" or "items[0].name")'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for transforming JSON data
export const JsonTransformArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to transform'),
  operations: z.array(z.object({
    type: z.enum([
      'map',      // Transform array elements
      'groupBy',  // Group array elements
      'sort',     // Sort array elements
      'flatten',  // Flatten nested arrays
      'pick',     // Pick specific fields
      'omit'      // Omit specific fields
    ]).describe('Type of transformation operation'),
    field: z.string().optional().describe('Field to operate on (if applicable)'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order (if applicable)'),
    fields: z.array(z.string()).optional().describe('Fields to pick/omit (if applicable)'),
  })).min(1).describe('Array of transformation operations to apply in sequence'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for getting JSON structure
export const JsonStructureArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to analyze'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
  depth: z.number().int().positive().optional().default(1)
    .describe('How deep to analyze the structure (default: 1, use -1 for unlimited)'),
  detailedArrayTypes: z.boolean().optional().default(false)
    .describe('Whether to analyze all array elements for mixed types (default: false)')
});

// Schema for sampling JSON array elements
export const JsonSampleArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file containing the array'),
  arrayPath: z.string().describe('JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")'),
  count: z.number().int().positive().describe('Number of elements to sample'),
  method: z.enum(['first', 'random']).optional().default('first')
    .describe('Sampling method - "first" for first N elements, "random" for random sampling'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)')
});

// Schema for JSON Schema validation
export const JsonValidateArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to validate'),
  schemaPath: z.string().describe('Path to the JSON Schema file'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
  strict: z.boolean().optional().default(false)
    .describe('Whether to enable strict mode validation (additionalProperties: false)'),
  allErrors: z.boolean().optional().default(true)
    .describe('Whether to collect all validation errors or stop at first error')
});

// Schema for searching JSON files by key/value pairs
export const JsonSearchKvArgsSchema = z.object({
  directoryPath: z.string().describe('Directory to search in'),
  key: z.string().describe('Key to search for'),
  value: z.any().optional().describe('Optional value to match against the key'),
  recursive: z.boolean().optional().default(true)
    .describe('Whether to search recursively in subdirectories'),
  matchType: z.enum(['exact', 'contains', 'startsWith', 'endsWith']).optional().default('exact')
    .describe('How to match values - only applies if value is provided'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from each file (default: 1MB)'),
  maxResults: z.number().int().positive().optional().default(100)
    .describe('Maximum number of results to return (default: 100)')
}); 