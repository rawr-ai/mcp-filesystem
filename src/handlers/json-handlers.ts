import fs from 'fs/promises';
import { JSONPath } from 'jsonpath-plus';
import _ from 'lodash';
import AjvModule, { ErrorObject } from 'ajv';
const Ajv = AjvModule.default || AjvModule;
import path from 'path';
import { validatePath } from '../utils/path-utils.js';
import {
  JsonQueryArgsSchema,
  JsonFilterArgsSchema,
  JsonGetValueArgsSchema,
  JsonTransformArgsSchema,
  JsonStructureArgsSchema,
  JsonSampleArgsSchema,
  JsonValidateArgsSchema,
  JsonSearchKvArgsSchema
} from '../schemas/json-operations.js';

/**
 * Read and parse a JSON file
 */
async function readJsonFile(filePath: string, maxBytes?: number): Promise<any> {
  try {
    const content = await fs.readFile(filePath, {
      encoding: 'utf-8',
      ...(maxBytes ? { length: maxBytes } : {})
    });
    return JSON.parse(content);
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
  const parsed = JsonQueryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_query: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    const result = JSONPath({ 
      path: parsed.data.query,
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
  const parsed = JsonFilterArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_filter: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    let dataToFilter: any[] = [];
    
    // Check if arrayPath is provided
    if (parsed.data.arrayPath) {
      // Use JSONPath to locate the target array
      const targetArray = JSONPath({
        path: parsed.data.arrayPath,
        json: jsonData,
        wrap: false
      });

      if (!Array.isArray(targetArray)) {
        throw new Error(`Path "${parsed.data.arrayPath}" did not resolve to an array`);
      }
      
      dataToFilter = targetArray;
    } 
    // No arrayPath provided, use automatic detection for simple cases
    else {
      if (_.isArray(jsonData)) {
        // Direct array case
        dataToFilter = jsonData;
      } else if (_.isPlainObject(jsonData)) {
        // Find all array properties at the top level
        const arrayProps = _.pickBy(jsonData, _.isArray);
        
        if (_.size(arrayProps) === 1) {
          // If exactly one array property, use it automatically
          dataToFilter = _.values(arrayProps)[0] as any[];
        } else if (_.size(arrayProps) > 1) {
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
    if (!_.isArray(dataToFilter) || _.isEmpty(dataToFilter)) {
      throw new Error(
        'Could not find a valid array to filter in the JSON data. ' +
        'Please make sure the file contains an array or specify the correct arrayPath parameter.'
      );
    }

    // Now filter the array using lodash predicates
    const filtered = _.filter(dataToFilter, (item) => {
      const results = _.map(parsed.data.conditions, condition => {
        const value = _.get(item, condition.field);
        
        switch (condition.operator) {
          case 'eq':
            return _.isEqual(value, condition.value);
          case 'neq':
            return !_.isEqual(value, condition.value);
          case 'gt':
            return value > condition.value;
          case 'gte':
            return value >= condition.value;
          case 'lt':
            return value < condition.value;
          case 'lte':
            return value <= condition.value;
          case 'contains':
            return _.isString(value) 
              ? _.includes(value, String(condition.value))
              : _.isArray(value) && _.some(value, v => _.isEqual(v, condition.value));
          case 'startsWith':
            return _.isString(value) && _.startsWith(value, String(condition.value));
          case 'endsWith':
            return _.isString(value) && _.endsWith(value, String(condition.value));
          case 'exists':
            return !_.isUndefined(value);
          case 'type':
            return typeof value === condition.value;
          default:
            return false;
        }
      });

      return parsed.data.match === 'all' 
        ? _.every(results)
        : _.some(results);
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
  const parsed = JsonGetValueArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_get_value: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    const value = _.get(jsonData, parsed.data.field);
    if (value === undefined) {
      throw new Error(`Field "${parsed.data.field}" not found in JSON data`);
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
  const parsed = JsonTransformArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_transform: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  let jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    // Apply operations in sequence
    for (const op of parsed.data.operations) {
      switch (op.type) {
        case 'map':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for map operation');
          }
          if (!op.field) {
            throw new Error('Field is required for map operation');
          }
          jsonData = jsonData.map(item => _.get(item, op.field!));
          break;

        case 'groupBy':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for groupBy operation');
          }
          if (!op.field) {
            throw new Error('Field is required for groupBy operation');
          }
          jsonData = _.groupBy(jsonData, op.field);
          break;

        case 'sort':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for sort operation');
          }
          if (!op.field) {
            throw new Error('Field is required for sort operation');
          }
          jsonData = _.orderBy(
            jsonData,
            [op.field],
            [op.order || 'asc']
          );
          break;

        case 'flatten':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for flatten operation');
          }
          jsonData = _.flattenDeep(jsonData);
          break;

        case 'pick':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for pick operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => _.pick(item, op.fields!));
          } else {
            jsonData = _.pick(jsonData, op.fields);
          }
          break;

        case 'omit':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for omit operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => _.omit(item, op.fields!));
          } else {
            jsonData = _.omit(jsonData, op.fields);
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
  const parsed = JsonStructureArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_structure: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);
  const { depth = 1, detailedArrayTypes = false } = parsed.data;

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
      if (_.isArray(value)) {
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
      if (_.isPlainObject(value)) {
        const type = 'object' as ValueType;
        // If we haven't reached depth limit and object isn't empty, analyze structure
        if ((depth === -1 || currentDepth < depth) && !_.isEmpty(value)) {
          const structure: Record<string, any> = {};
          for (const [key, val] of Object.entries(value)) {
            structure[key] = analyzeType(val, currentDepth + 1);
          }
          return { type, structure };
        }
        return { type };
      }

      // Handle primitives
      if (_.isString(value)) return { type: 'string' };
      if (_.isNumber(value)) return { type: 'number' };
      if (_.isBoolean(value)) return { type: 'boolean' };

      // Fallback
      return { type: typeof value as ValueType };
    }

    // Analyze the root structure
    const structure = _.isArray(jsonData)
      ? { type: 'array', elements: analyzeType(jsonData, 0) }
      : _.transform(jsonData, (result: Record<string, any>, value, key: string) => {
          result[key] = analyzeType(value, 0);
        }, {} as Record<string, any>);

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
  const parsed = JsonSampleArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_sample: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    // Use JSONPath to locate the target array
    const targetArray = JSONPath({
      path: parsed.data.arrayPath,
      json: jsonData,
      wrap: false
    });

    if (!Array.isArray(targetArray)) {
      throw new Error(`Path "${parsed.data.arrayPath}" did not resolve to an array`);
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
    if (parsed.data.method === 'random') {
      // Use Lodash's sampleSize for efficient random sampling
      sampledData = _.sampleSize(targetArray, Math.min(parsed.data.count, targetArray.length));
    } else {
      // Take first N elements
      sampledData = _.take(targetArray, parsed.data.count);
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
  const parsed = JsonValidateArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_validate: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validSchemaPath = await validatePath(parsed.data.schemaPath, allowedDirectories, symlinksMap, noFollowSymlinks);

  try {
    // Read both the data and schema files
    const [jsonData, schemaData] = await Promise.all([
      readJsonFile(validPath, parsed.data.maxBytes),
      readJsonFile(validSchemaPath)
    ]);

    // Configure Ajv instance
    const ajv = new Ajv({
      allErrors: parsed.data.allErrors,
      strict: parsed.data.strict,
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
  const parsed = JsonSearchKvArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_search_kv: ${parsed.error}`);
  }

  const validDirPath = await validatePath(parsed.data.directoryPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  const { key, value, recursive = true, matchType = 'exact', maxBytes, maxResults = 100 } = parsed.data;

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
    
    return _.isEqual(foundValue, value);
  }

  /**
   * Search for key/value pairs in a JSON object
   */
  function searchInObject(obj: any, currentPath: string[] = []): string[] {
    const matches: string[] = [];

    if (_.isPlainObject(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k];
        
        // Check if this key matches
        if (k === key && isValueMatch(v)) {
          matches.push(newPath.join('.'));
        }
        
        // Recursively search in nested objects and arrays
        if (_.isPlainObject(v) || _.isArray(v)) {
          matches.push(...searchInObject(v, newPath));
        }
      }
    } else if (_.isArray(obj)) {
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
  async function getJsonFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const validSubPath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(...await getJsonFiles(validSubPath));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const validFilePath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(validFilePath);
      }
    }

    return files;
  }

  try {
    // Get all JSON files in the directory
    const jsonFiles = await getJsonFiles(validDirPath);
    
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