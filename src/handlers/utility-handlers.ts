import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import { searchFiles, findFilesByExtension } from '../utils/file-utils.js';
import {
  GetPermissionsArgsSchema,
  SearchFilesArgsSchema,
  FindFilesByExtensionArgsSchema,
  XmlToJsonArgsSchema,
  XmlToJsonStringArgsSchema
} from '../schemas/utility-operations.js';

export function handleGetPermissions(
  args: unknown,
  permissions: Permissions,
  readonlyFlag: boolean,
  noFollowSymlinks: boolean,
  allowedDirectories: string[]
) {
  const parsed = GetPermissionsArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for get_permissions: ${parsed.error}`);
  }

  return {
    content: [{
      type: "text",
      text: `Current permission state:
readOnly: ${readonlyFlag}
followSymlinks: ${!noFollowSymlinks}
fullAccess: ${permissions.fullAccess}

Operations allowed:
- create: ${permissions.create}
- edit: ${permissions.edit}
- move: ${permissions.move}
- delete: ${permissions.delete}

Server was started with ${allowedDirectories.length} allowed ${allowedDirectories.length === 1 ? 'directory' : 'directories'}.
Use 'list_allowed_directories' to see them.`
    }],
  };
}

export async function handleSearchFiles(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = SearchFilesArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for search_files: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const results = await searchFiles(validPath, parsed.data.pattern, parsed.data.excludePatterns);
  return {
    content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matches found" }],
  };
}

export async function handleFindFilesByExtension(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = FindFilesByExtensionArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for find_files_by_extension: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const results = await findFilesByExtension(
    validPath, 
    parsed.data.extension, 
    parsed.data.excludePatterns
  );
  return {
    content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matching files found" }],
  };
}

export async function handleXmlToJson(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = XmlToJsonArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_to_json: ${parsed.error}`);
  }
  
  const validXmlPath = await validatePath(parsed.data.xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validJsonPath = await validatePath(parsed.data.jsonPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: parsed.data.options?.ignoreAttributes ?? false,
      preserveOrder: parsed.data.options?.preserveOrder ?? true,
      // Add other options as needed
    };
    
    const parser = new XMLParser(parserOptions);
    const jsonObj = parser.parse(xmlContent);
    
    // Format JSON if requested
    const format = parsed.data.options?.format ?? true;
    const indentSize = parsed.data.options?.indentSize ?? 2;
    const jsonContent = format 
      ? JSON.stringify(jsonObj, null, indentSize) 
      : JSON.stringify(jsonObj);
    
    // Check if JSON file exists to determine if this is a create operation
    let fileExists = false;
    try {
      await fs.access(validJsonPath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist - this is a create operation
    }
    
    // Enforce permission checks for writing
    if (fileExists && !permissions.edit && !permissions.fullAccess) {
      throw new Error('Cannot write to existing JSON file: edit permission not granted (requires --allow-edit)');
    }
    
    if (!fileExists && !permissions.create && !permissions.fullAccess) {
      throw new Error('Cannot create new JSON file: create permission not granted (requires --allow-create)');
    }
    
    // Write JSON to file
    await fs.writeFile(validJsonPath, jsonContent, "utf-8");
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully converted XML from ${parsed.data.xmlPath} to JSON at ${parsed.data.jsonPath}` 
      }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert XML to JSON: ${errorMessage}`);
  }
}

export async function handleXmlToJsonString(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = XmlToJsonStringArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_to_json_string: ${parsed.error}`);
  }
  
  const validXmlPath = await validatePath(parsed.data.xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: parsed.data.options?.ignoreAttributes ?? false,
      preserveOrder: parsed.data.options?.preserveOrder ?? true,
      // Add other options as needed
    };
    
    const parser = new XMLParser(parserOptions);
    const jsonObj = parser.parse(xmlContent);
    
    // Return the JSON as a string
    const jsonContent = JSON.stringify(jsonObj, null, 2);
    
    return {
      content: [{ type: "text", text: jsonContent }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert XML to JSON: ${errorMessage}`);
  }
} 