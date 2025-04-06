import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import { searchFiles, findFilesByExtension, regexSearchContent } from '../utils/file-utils.js';
import {
  GetPermissionsArgsSchema,
  SearchFilesArgsSchema,
  FindFilesByExtensionArgsSchema,
  XmlToJsonArgsSchema,
  XmlToJsonStringArgsSchema,
  RegexSearchContentArgsSchema // Added import
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
- rename: ${permissions.rename}
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
  const { path: startPath, pattern, excludePatterns, maxDepth, maxResults } = parsed.data;
  const validPath = await validatePath(startPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  // TODO: Update searchFiles in file-utils.ts to accept and use maxDepth and maxResults
  const results = await searchFiles(validPath, pattern, excludePatterns, maxDepth, maxResults);
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
  const { path: startPath, extension, excludePatterns, maxDepth, maxResults } = parsed.data;
  const validPath = await validatePath(startPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  // TODO: Update findFilesByExtension in file-utils.ts to accept and use maxDepth and maxResults
  const results = await findFilesByExtension(
    validPath,
    extension,
    excludePatterns,
    maxDepth,
    maxResults
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
  
  const { xmlPath, jsonPath, maxBytes, options } = parsed.data;
  const validXmlPath = await validatePath(xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks); // Source must exist

  const validJsonPath = await validatePath(
    jsonPath,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks,
    { checkParentExists: false } // Add option here for output JSON path
  );
  try {
    // Check file size before reading
    const stats = await fs.stat(validXmlPath);
    const effectiveMaxBytes = maxBytes ?? (10 * 1024); // Default 10KB
    if (stats.size > effectiveMaxBytes) {
      throw new Error(`File size (${stats.size} bytes) exceeds the maximum allowed size (${effectiveMaxBytes} bytes).`);
    }
    
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: options?.ignoreAttributes ?? false,
      preserveOrder: options?.preserveOrder ?? true,
      // Add other options as needed
    };
    
    const parser = new XMLParser(parserOptions);
    const jsonObj = parser.parse(xmlContent);
    
    // Format JSON if requested
    const format = options?.format ?? true;
    const indentSize = options?.indentSize ?? 2;
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
    // Ensure parent dir exists before writing the JSON file
    const jsonParentDir = path.dirname(validJsonPath);
    await fs.mkdir(jsonParentDir, { recursive: true }); // Ensure parent exists
    await fs.writeFile(validJsonPath, jsonContent, "utf-8");
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully converted XML from ${xmlPath} to JSON at ${jsonPath}`
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
  
  const { xmlPath, maxBytes, options } = parsed.data;
  const validXmlPath = await validatePath(xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Check file size before reading
    const stats = await fs.stat(validXmlPath);
    const effectiveMaxBytes = maxBytes ?? (10 * 1024); // Default 10KB
    if (stats.size > effectiveMaxBytes) {
      throw new Error(`File size (${stats.size} bytes) exceeds the maximum allowed size (${effectiveMaxBytes} bytes).`);
    }
    
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: options?.ignoreAttributes ?? false,
      preserveOrder: options?.preserveOrder ?? true,
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

export function handleListAllowedDirectories(
  args: unknown,
  allowedDirectories: string[]
): { content: [{ type: string; text: string }] } {
  return {
    content: [{
      type: "text",
      text: `Allowed directories:\n${allowedDirectories.join('\n')}`
    }],
  };
}

export async function handleRegexSearchContent(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = RegexSearchContentArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for regex_search_content: ${parsed.error}`);
  }
  const {
    path: startPath,
    regex,
    filePattern,
    maxDepth,
    maxFileSize,
    maxResults
  } = parsed.data;

  const validPath = await validatePath(startPath, allowedDirectories, symlinksMap, noFollowSymlinks);

  try {
    const results = await regexSearchContent(
      validPath,
      regex,
      filePattern,
      maxDepth,
      maxFileSize,
      maxResults
    );

    if (results.length === 0) {
      return { content: [{ type: "text", text: "No matches found for the given regex pattern." }] };
    }

    // Format the output
    const formattedResults = results.map(fileResult => {
      const matchesText = fileResult.matches
        .map(match => `  Line ${match.lineNumber}: ${match.lineContent.trim()}`)
        .join('\n');
      return `File: ${fileResult.path}\n${matchesText}`;
    }).join('\n\n');

    return {
      content: [{ type: "text", text: formattedResults }],
    };
  } catch (error: any) {
    // Catch errors from regexSearchContent (e.g., invalid regex)
    throw new Error(`Error during regex content search: ${error.message}`);
  }
}