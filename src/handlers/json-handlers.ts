import fs from 'fs/promises';
import { JSONPath } from 'jsonpath-plus';
import {
  isPlainObject,
  pickBy,
  size,
  values,
  filter,
  map,
  get as getProp,
  isEqual,
  some,
  every,
  groupBy,
  orderBy,
  flattenDeep,
  pick,
  omit,
  isEmpty,
  sampleSize,
  take,
  transform
} from '../utils/data-utils.js';
import AjvModule, { ErrorObject } from 'ajv';
const Ajv = AjvModule.default || AjvModule;
import path from 'path';
import { validatePath } from '../utils/path-utils.js';
import { parseArgs } from '../utils/schema-utils.js';
import {
  JsonQueryArgsSchema,
  JsonFilterArgsSchema,
  JsonGetValueArgsSchema,
  JsonTransformArgsSchema,
  JsonStructureArgsSchema,
  JsonSampleArgsSchema,
  JsonValidateArgsSchema,
  JsonSearchKvArgsSchema,
  type JsonQueryArgs,
  type JsonFilterArgs,
  type JsonGetValueArgs,
  type JsonTransformArgs,
  type JsonStructureArgs,
  type JsonSampleArgs,
  type JsonValidateArgs,
  type JsonSearchKvArgs
} from '../schemas/json-operations.js';

/**
 * Read and parse a JSON file
 */
async function readJsonFile(filePath: string, maxBytesInput?: number): Promise<any> {
  const effectiveMaxBytes = maxBytesInput ?? (10 * 1024); // Default 10KB
  try {
    // Check file size before reading
    const stats = await fs.stat(filePath);
    if (stats.size > effectiveMaxBytes) {
      throw new Error(`File size (${stats.size} bytes) exceeds the maximum allowed size (${effectiveMaxBytes} bytes).`);
    }
    
    // Read file content up to the limit
    const content = await fs.readFile(filePath, {
      encoding: 'utf-8',
      // Note: fs.readFile doesn't have a 'length' option like createReadStream's 'end'.
      // We rely on the pre-check above. If the file is slightly larger but within limits
      // for parsing start, it might still work, but the size check prevents huge files.
    });
    // Attempt to parse only up to maxBytes (approximate)
    // This is imperfect as JSON parsing needs the full structure. The main protection is the size check.
    return JSON.parse(content.substring(0, effectiveMaxBytes));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read or parse JSON file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSONPath query operations
 */
export async function handleJsonQuery(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonQueryArgsSchema, args, 'json_query');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.maxBytes);

  try {
    const result = JSONPath({
      path: parsed.query,
      json: jsonData,
      wrap: false // Don't wrap single results in an array
    });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(result, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSONPath query failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON filtering operations
 */
export async function handleJsonFilter(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonFilterArgsSchema, args, 'json_filter');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.maxBytes);

  try {
    let dataToFilter: any[] = [];
    
    // Check if arrayPath is provided
    if (parsed.arrayPath) {
      // Use JSONPath to locate the target array
      const targetArray = JSONPath({
        path: parsed.arrayPath,
        json: jsonData,
        wrap: false
      });

      if (!Array.isArray(targetArray)) {
        throw new Error(`Path "${parsed.arrayPath}" did not resolve to an array`);
      }
      
      dataToFilter = targetArray;
    } 
    // No arrayPath provided, use automatic detection for simple cases
    else {
      if (Array.isArray(jsonData)) {
        // Direct array case
        dataToFilter = jsonData;
      } else if (isPlainObject(jsonData)) {
        // Find all array properties at the top level
        const arrayProps = pickBy(jsonData, Array.isArray);

        if (size(arrayProps) === 1) {
          // If exactly one array property, use it automatically
          dataToFilter = values(arrayProps)[0] as any[];
        } else if (size(arrayProps) > 1) {
          // Multiple arrays found, can't automatically determine which to use
          throw new Error(
            'Multiple arrays found in the JSON data. ' +
            'Please provide the "arrayPath" parameter to specify which array to filter. ' +
            'Example: "$.items" or "$.data.resources"'
          );
        } else {
          // No arrays found at the top level
          throw new Error(
            'No arrays found in the JSON data. ' +
            'Please provide the "arrayPath" parameter to specify the path to the array to filter. ' +
            'Example: "$.items" or "$.data.resources"'
          );
        }
      } else {
        // Not an object or array
        throw new Error(
          'The JSON data is not an array or an object containing arrays. ' +
          'Please provide valid JSON data with arrays to filter.'
        );
      }
    }
    
    // If we still couldn't find an array to filter, throw a helpful error
    if (!Array.isArray(dataToFilter) || isEmpty(dataToFilter)) {
      throw new Error(
        'Could not find a valid array to filter in the JSON data. ' +
        'Please make sure the file contains an array or specify the correct arrayPath parameter.'
      );
    }

    // Now filter the array using predicates
    const filtered = filter(dataToFilter, (item) => {
      const results = map(parsed.conditions, condition => {
        const value = getProp(item, condition.field);
        
        switch (condition.operator) {
          case 'eq':
            return isEqual(value, condition.value);
          case 'neq':
            return !isEqual(value, condition.value);
          case 'gt':
            return value > condition.value;
          case 'gte':
            return value >= condition.value;
          case 'lt':
            return value < condition.value;
          case 'lte':
            return value <= condition.value;
          case 'contains':
            return typeof value === 'string'
              ? value.includes(String(condition.value))
              : Array.isArray(value) && some(value, v => isEqual(v, condition.value));
          case 'startsWith':
            return typeof value === 'string' && value.startsWith(String(condition.value));
          case 'endsWith':
            return typeof value === 'string' && value.endsWith(String(condition.value));
          case 'exists':
            return value !== undefined;
          case 'type':
            return typeof value === condition.value;
          default:
            return false;
        }
      });

      return parsed.match === 'all'
        ? every(results, Boolean)
        : some(results, Boolean);
    });

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(filtered, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON filtering failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle getting a specific value from a JSON file
 */
export async function handleJsonGetValue(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonGetValueArgsSchema, args, 'json_get_value');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.maxBytes);

  try {
    const value = getProp(jsonData, parsed.field);
    if (value === undefined) {
      throw new Error(`Field "${parsed.field}" not found in JSON data`);
    }

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(value, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get JSON value: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON transformation operations
 */
export async function handleJsonTransform(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonTransformArgsSchema, args, 'json_transform');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  let jsonData = await readJsonFile(validPath, parsed.maxBytes);

  try {
    // Apply operations in sequence
    for (const op of parsed.operations) {
      switch (op.type) {
        case 'map':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for map operation');
          }
          if (!op.field) {
            throw new Error('Field is required for map operation');
          }
          jsonData = jsonData.map(item => getProp(item, op.field!));
          break;

        case 'groupBy':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for groupBy operation');
          }
          if (!op.field) {
            throw new Error('Field is required for groupBy operation');
          }
          jsonData = groupBy(jsonData, op.field);
          break;

        case 'sort':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for sort operation');
          }
          if (!op.field) {
            throw new Error('Field is required for sort operation');
          }
          jsonData = orderBy(
            jsonData,
            op.field,
            [op.order || 'asc']
          );
          break;

        case 'flatten':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for flatten operation');
          }
          jsonData = flattenDeep(jsonData);
          break;

        case 'pick':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for pick operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => pick(item, op.fields!));
          } else {
            jsonData = pick(jsonData, op.fields);
          }
          break;

        case 'omit':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for omit operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => omit(item, op.fields!));
          } else {
            jsonData = omit(jsonData, op.fields);
          }
          break;
      }
    }

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(jsonData, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON transformation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the structure of a JSON file with configurable depth and array type analysis
 */
export async function handleJsonStructure(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonStructureArgsSchema, args, 'json_structure');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.maxBytes);
  const { maxDepth, detailedArrayTypes = false } = parsed;
  const effectiveMaxDepth = maxDepth ?? 2; // Default depth 2

  try {
    // Define a type that includes our custom type strings
    type ValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | `array<${string}>` | 'null' | 'undefined';
    
    /**
     * Analyze the type of a value, including detailed array analysis if requested
     */
    function analyzeType(value: any, currentDepth: number = 0): { type: ValueType; structure?: Record<string, any> } {
      // Handle null and undefined
      if (value === null) return { type: 'null' };
      if (value === undefined) return { type: 'undefined' };

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return { type: 'array<empty>' as ValueType };
        
        if (detailedArrayTypes) {
          // Analyze all elements for mixed types
          const elementTypes = new Set<string>();
          value.forEach(item => {
            const itemType = analyzeType(item, currentDepth + 1);
            elementTypes.add(itemType.type);
          });
          
          const typeString = Array.from(elementTypes).join('|');
          return { type: `array<${typeString}>` as ValueType };
        } else {
          // Just analyze first element
          const firstType = analyzeType(value[0], currentDepth + 1);
          return { type: `array<${firstType.type}>` as ValueType };
        }
      }

      // Handle objects
      if (isPlainObject(value)) {
        const type = 'object' as ValueType;
        // If we haven't reached depth limit and object isn't empty, analyze structure
        if (currentDepth < effectiveMaxDepth && !isEmpty(value)) { // Use effectiveMaxDepth
          const structure: Record<string, any> = {};
          for (const [key, val] of Object.entries(value)) {
            structure[key] = analyzeType(val, currentDepth + 1);
          }
          return { type, structure };
        }
        return { type };
      }

      // Handle primitives
      if (typeof value === 'string') return { type: 'string' };
      if (typeof value === 'number') return { type: 'number' };
      if (typeof value === 'boolean') return { type: 'boolean' };

      // Fallback
      return { type: typeof value as ValueType };
    }

    // Analyze the root structure
    const structure = Array.isArray(jsonData)
      ? { type: 'array', elements: analyzeType(jsonData, 0) }
      : transform(
          jsonData,
          (result: Record<string, any>, value: unknown, key: string) => {
            result[key] = analyzeType(value, 0);
          },
          {} as Record<string, any>
        );

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(structure, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON structure analysis failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON array sampling operations
 */
export async function handleJsonSample(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonSampleArgsSchema, args, 'json_sample');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.maxBytes);

  try {
    // Use JSONPath to locate the target array
    const targetArray = JSONPath({
      path: parsed.arrayPath,
      json: jsonData,
      wrap: false
    });

    if (!Array.isArray(targetArray)) {
      throw new Error(`Path "${parsed.arrayPath}" did not resolve to an array`);
    }

    if (targetArray.length === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify([], null, 2)
        }],
      };
    }

    let sampledData: any[];
    if (parsed.method === 'random') {
      sampledData = sampleSize(targetArray, Math.min(parsed.count, targetArray.length));
    } else {
      sampledData = take(targetArray, parsed.count);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(sampledData, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON sampling failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON Schema validation operations
 */
export async function handleJsonValidate(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonValidateArgsSchema, args, 'json_validate');

  const validPath = await validatePath(parsed.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validSchemaPath = await validatePath(parsed.schemaPath, allowedDirectories, symlinksMap, noFollowSymlinks);

  try {
    // Read both the data and schema files
    const [jsonData, schemaData] = await Promise.all([
      readJsonFile(validPath, parsed.maxBytes),
      readJsonFile(validSchemaPath)
    ]);

    // Configure Ajv instance
    const ajv = new Ajv({
      allErrors: parsed.allErrors,
      strict: parsed.strict,
      validateSchema: true, // Validate the schema itself
      verbose: true // Include more detailed error information
    });

    try {
      // Compile and validate the schema itself first
      const validateSchema = ajv.compile(schemaData);
      
      // Validate the data
      const isValid = validateSchema(jsonData);

      // Prepare the validation result
      const result = {
        isValid,
        errors: isValid ? null : (validateSchema.errors as ErrorObject[])?.map(error => ({
          path: error.instancePath,
          keyword: error.keyword,
          message: error.message,
          params: error.params,
          schemaPath: error.schemaPath
        }))
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }],
      };
    } catch (validationError) {
      // Handle schema compilation errors
      if (validationError instanceof Error) {
        throw new Error(`Schema validation failed: ${validationError.message}`);
      }
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle searching for JSON files containing specific key/value pairs
 */
export async function handleJsonSearchKv(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = parseArgs(JsonSearchKvArgsSchema, args, 'json_search_kv');

  const validDirPath = await validatePath(parsed.directoryPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  const { key, value, recursive = true, matchType = 'exact', maxBytes, maxResults = 10, maxDepth } = parsed;
  const effectiveMaxDepth = maxDepth ?? 2; // Default depth 2

  /**
   * Check if a value matches the search criteria
   */
  function isValueMatch(foundValue: any): boolean {
    if (value === undefined) return true;
    
    if (typeof foundValue === 'string' && typeof value === 'string') {
      switch (matchType) {
        case 'contains':
          return foundValue.includes(value);
        case 'startsWith':
          return foundValue.startsWith(value);
        case 'endsWith':
          return foundValue.endsWith(value);
        default:
          return foundValue === value;
      }
    }
    
    return isEqual(foundValue, value);
  }

  /**
   * Search for key/value pairs in a JSON object
   */
  function searchInObject(obj: any, currentPath: string[] = []): string[] {
    const matches: string[] = [];

    if (isPlainObject(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k];
        
        // Check if this key matches
        if (k === key && isValueMatch(v)) {
          matches.push(newPath.join('.'));
        }
        
        // Recursively search in nested objects and arrays
        if (isPlainObject(v) || Array.isArray(v)) {
          matches.push(...searchInObject(v, newPath));
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = [...currentPath, index.toString()];
        matches.push(...searchInObject(item, newPath));
      });
    }

    return matches;
  }

  /**
   * Process a single JSON file
   */
  async function processFile(filePath: string): Promise<{ file: string; matches: string[] } | null> {
    try {
      // Pass maxBytes from parsed args to readJsonFile
      // Use the maxBytes variable destructured earlier
      const jsonData = await readJsonFile(filePath, maxBytes);
      const matches = searchInObject(jsonData);
      return matches.length > 0 ? { file: filePath, matches } : null;
    } catch (error) {
      // Skip files that can't be read or aren't valid JSON
      return null;
    }
  }

  /**
   * Recursively get all JSON files in directory
   */
  async function getJsonFiles(dir: string, currentDepth: number): Promise<string[]> {
    // Check depth limit
    if (currentDepth >= effectiveMaxDepth) {
      return [];
    }
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const validSubPath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(...await getJsonFiles(validSubPath, currentDepth + 1));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const validFilePath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(validFilePath);
      }
    }

    return files;
  }

  try {
    // Get all JSON files in the directory
    const jsonFiles = await getJsonFiles(validDirPath, 0); // Start at depth 0
    
    // Process files and collect results
    const results = [];
    for (const file of jsonFiles) {
      if (results.length >= maxResults) break;
      
      const result = await processFile(file);
      if (result) {
        results.push(result);
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          totalFiles: jsonFiles.length,
          matchingFiles: results.length,
          results
        }, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON key/value search failed: ${error.message}`);
    }
    throw error;
  }
} 