#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import os from 'os';
import { z } from "zod";
import { diffLines, createTwoFilesPatch } from 'diff';
import { minimatch } from 'minimatch';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { handleXmlQuery, handleXmlStructure } from './src/handlers/xml-handlers.js';
import {
  XmlQueryArgsSchema,
  XmlStructureArgsSchema,
  SearchFilesArgsSchema,
  FindFilesByExtensionArgsSchema,
  GetPermissionsArgsSchema,
  XmlToJsonArgsSchema,
  XmlToJsonStringArgsSchema, // Added comma here
  RegexSearchContentArgsSchema
} from './src/schemas/utility-operations.js';
import { searchFiles, findFilesByExtension, FileInfo } from './src/utils/file-utils.js';
import { normalizePath, expandHome, validatePath } from './src/utils/path-utils.js';
import {
  handleJsonQuery,
  handleJsonFilter,
  handleJsonGetValue,
  handleJsonTransform,
  handleJsonStructure,
  handleJsonSample,
  handleJsonValidate,
  handleJsonSearchKv
} from './src/handlers/json-handlers.js';
import {
  JsonQueryArgsSchema,
  JsonFilterArgsSchema,
  JsonGetValueArgsSchema,
  JsonTransformArgsSchema,
  JsonStructureArgsSchema,
  JsonSampleArgsSchema,
  JsonValidateArgsSchema,
  JsonSearchKvArgsSchema
} from './src/schemas/json-operations.js';
import {
  ReadFileArgsSchema,
  ReadMultipleFilesArgsSchema,
  WriteFileArgsSchema,
  EditFileArgsSchema,
  GetFileInfoArgsSchema,
  MoveFileArgsSchema,
  DeleteFileArgsSchema,
  RenameFileArgsSchema
} from './src/schemas/file-operations.js';
import {
  handleReadFile,
  handleReadMultipleFiles,
  handleCreateFile,
  handleModifyFile,
  handleEditFile,
  handleGetFileInfo,
  handleMoveFile,
  handleDeleteFile,
  handleRenameFile
} from './src/handlers/file-handlers.js';
import {
  handleCreateDirectory,
  handleListDirectory,
  handleDirectoryTree,
  handleDeleteDirectory
} from './src/handlers/directory-handlers.js';
import {
  CreateDirectoryArgsSchema,
  ListDirectoryArgsSchema,
  DirectoryTreeArgsSchema,
  DeleteDirectoryArgsSchema
} from './src/schemas/directory-operations.js';
import {
  handleSearchFiles,
  handleFindFilesByExtension,
  handleGetPermissions,
  handleXmlToJson,
  handleXmlToJsonString,
  handleListAllowedDirectories, // Added comma here
  handleRegexSearchContent
} from './src/handlers/utility-handlers.js';

// Command line argument parsing
const args = process.argv.slice(2);
// Parse flags
const readonlyFlag = args.includes('--readonly');
const noFollowSymlinks = args.includes('--no-follow-symlinks');
const fullAccessFlag = args.includes('--full-access');

// Granular permission flags
const allowCreate = args.includes('--allow-create');
const allowEdit = args.includes('--allow-edit');
const allowMove = args.includes('--allow-move');
const allowDelete = args.includes('--allow-delete');
const allowRename = args.includes('--allow-rename');

// Permission calculation
// readonly flag overrides all other permissions as a safety mechanism
// fullAccess enables all permissions unless readonly is set
// individual allow flags enable specific permissions unless readonly is set
const permissions = {
  create: !readonlyFlag && (fullAccessFlag || allowCreate),
  edit: !readonlyFlag && (fullAccessFlag || allowEdit),
  move: !readonlyFlag && (fullAccessFlag || allowMove),
  delete: !readonlyFlag && (fullAccessFlag || allowDelete),
  rename: !readonlyFlag && (fullAccessFlag || allowRename),
  // fullAccess is true only if the flag is explicitly set and not in readonly mode
  fullAccess: !readonlyFlag && fullAccessFlag
};

// Remove flags from args
if (readonlyFlag) {
  args.splice(args.indexOf('--readonly'), 1);
}
if (noFollowSymlinks) {
  args.splice(args.indexOf('--no-follow-symlinks'), 1);
}
if (fullAccessFlag) {
  args.splice(args.indexOf('--full-access'), 1);
}
if (allowCreate) {
  args.splice(args.indexOf('--allow-create'), 1);
}
if (allowEdit) {
  args.splice(args.indexOf('--allow-edit'), 1);
}
if (allowMove) {
  args.splice(args.indexOf('--allow-move'), 1);
}
if (allowDelete) {
  args.splice(args.indexOf('--allow-delete'), 1);
}
if (allowRename) {
  args.splice(args.indexOf('--allow-rename'), 1);
}

if (args.length === 0) {
  console.error("Usage: mcp-server-filesystem [--full-access] [--readonly] [--no-follow-symlinks] [--allow-create] [--allow-edit] [--allow-move] [--allow-delete] [--allow-rename] <allowed-directory> [additional-directories...]");
  process.exit(1);
}

// Store allowed directories in normalized form
const allowedDirectories = args.map(dir =>
  normalizePath(path.resolve(expandHome(dir)))
);

// Create a map to store the mapping between symlinks and their real paths
const symlinksMap = new Map<string, string>();

// Validate that all directories exist and are accessible
await Promise.all(args.map(async (dir) => {
  try {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      console.error(`Error: ${dir} is not a directory`);
      process.exit(1);
    }
    
    // Store symlink mappings for all provided directories
    try {
      const realPath = await fs.realpath(dir);
      if (realPath !== dir) {
        const normalizedDir = normalizePath(path.resolve(expandHome(dir)));
        const normalizedRealPath = normalizePath(realPath);
        symlinksMap.set(normalizedRealPath, normalizedDir);
        // Also add the real path to allowed directories if it's a symlink
        if (!allowedDirectories.includes(normalizedRealPath)) {
          allowedDirectories.push(normalizedRealPath);
        }
        // Validate the real path
        await validatePath(normalizedRealPath, allowedDirectories, symlinksMap, noFollowSymlinks);
      }
      // Validate the original path
      await validatePath(dir, allowedDirectories, symlinksMap, noFollowSymlinks);
    } catch (error) {
      // If we can't resolve the real path, just continue
      console.error(`Warning: Could not resolve real path for ${dir}:`, error);
    }
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    process.exit(1);
  }
}));

// Schema definitions are now imported from src/schemas/*
const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Server setup
const server = new Server(
  {
    name: "secure-filesystem-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Define all tools
  const allTools = [
    // Read-only tools
    {
      name: "read_file",
      description:
        "Read the complete contents of a file from the file system. " +
        "Handles various text encodings and provides detailed error messages " +
        "if the file cannot be read. Use this tool when you need to examine " +
        "the contents of a single file. Requires `maxBytes` parameter. Only works within allowed directories.",
      inputSchema: ReadFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "read_multiple_files",
      description:
        "Read the contents of multiple files simultaneously. This is more " +
        "efficient than reading files one by one when you need to analyze " +
        "or compare multiple files. Each file's content is returned with its " +
        "path as a reference. Failed reads for individual files won't stop " +
        "the entire operation. Requires `maxBytesPerFile` parameter. Only works within allowed directories.",
      inputSchema: ReadMultipleFilesArgsSchema as unknown as ToolInput,
    },
    {
      name: "list_directory",
      description:
        "Get a detailed listing of all files and directories in a specified path. " +
        "Results clearly distinguish between files and directories with [FILE] and [DIR] " +
        "prefixes. This tool is essential for understanding directory structure and " +
        "finding specific files within a directory. Only works within allowed directories.",
      inputSchema: ListDirectoryArgsSchema as unknown as ToolInput,
    },
    {
      name: "directory_tree",
      description:
          "Get a recursive tree view of files and directories as a JSON structure. " +
          "Supports depth limiting to control traversal depth and exclusion patterns using glob syntax. " +
          "Each entry includes 'name', 'type' (file/directory), and 'children' for directories. " +
          "Files have no children array, while directories always have a children array (which may be empty). " +
          "Requires `maxDepth` parameter (default 2) to limit recursion. Use excludePatterns to filter out unwanted files/directories. " +
          "The output is formatted with 2-space indentation for readability. Only works within allowed directories.",
      inputSchema: DirectoryTreeArgsSchema as unknown as ToolInput,
    },
    {
      name: "search_files",
      description:
        "Recursively search for files and directories matching a pattern. " +
        "Searches through all subdirectories from the starting path. The search " +
        "is case-insensitive and matches partial names. Returns full paths to all " +
        "matching items. Requires `maxDepth` (default 2) and `maxResults` (default 10) parameters. Great for finding files when you don't know their exact location. " +
        "Only searches within allowed directories.",
      inputSchema: SearchFilesArgsSchema as unknown as ToolInput,
    },
    {
      name: "find_files_by_extension",
      description:
        "Recursively find all files with a specific extension. " +
        "Searches through all subdirectories from the starting path. " +
        "Extension matching is case-insensitive. Returns full paths to all " +
        "matching files. Requires `maxDepth` (default 2) and `maxResults` (default 10) parameters. Perfect for finding all XML, JSON, or other file types " +
        "in a directory structure. Only searches within allowed directories.",
      inputSchema: FindFilesByExtensionArgsSchema as unknown as ToolInput,
    },
    {
      name: "get_file_info",
      description:
        "Retrieve detailed metadata about a file or directory. Returns comprehensive " +
        "information including size, creation time, last modified time, permissions, " +
        "and type. This tool is perfect for understanding file characteristics " +
        "without reading the actual content. Only works within allowed directories.",
      inputSchema: GetFileInfoArgsSchema as unknown as ToolInput,
    },
    {
      name: "list_allowed_directories",
      description:
        "Returns the list of directories that this server is allowed to access. " +
        "Use this to understand which directories are available before trying to access files.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    
    // New get_permissions tool
    {
      name: "get_permissions",
      description:
        "Returns the current permission state of the server, including which operations " +
        "are allowed (create, edit, move, delete) and whether the server is in read-only mode " +
        "or has full access. Use this to understand what operations are permitted before " +
        "attempting them.",
      inputSchema: GetPermissionsArgsSchema as unknown as ToolInput,
    },
    
    // Write tools (filtered based on permissions)
    {
      name: "create_file",
      description:
        "Create a new file with the specified content. " +
        "Will fail if the file already exists. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: WriteFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "modify_file",
      description:
        "COMPLETELY REPLACE the contents of an existing file with new content. " +
        "Use this tool when you need to overwrite an entire file, not for making partial changes. " +
        "COMPARE WITH edit_file: modify_file replaces the entire file content while edit_file makes targeted changes to specific sections. " +
        "Will fail if the file does not exist. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: WriteFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "edit_file",
      description:
        "Make TARGETED CHANGES to specific parts of a text file while preserving the rest. " +
        "Each edit operation finds and replaces specific text sequences with new content. " +
        "COMPARE WITH modify_file: edit_file makes partial changes while modify_file completely replaces file content. " +
        "Returns a git-style diff showing the changes made. Requires `maxBytes` parameter (default 10KB) to limit initial read size. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: EditFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "create_directory",
      description:
        "Create a new directory structure at the specified path. " +
        "Can create multiple nested directories in one operation (mkdir -p behavior). " +
        "If the directory already exists, this operation will succeed silently. " +
        "COMPARE WITH move_file: create_directory creates new directories while move_file moves existing files/directories. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: CreateDirectoryArgsSchema as unknown as ToolInput,
    },
    {
      name: "move_file",
      description:
        "Move or rename files and directories to a new location. " +
        "IMPORTANT: The destination parent directory must already exist - this tool doesn't create directories. " +
        "COMPARE WITH create_directory: move_file relocates existing files/directories but doesn't create new directory structures. " +
        "If the destination path already exists, the operation will fail. " +
        "Both source and destination must be within allowed directories. " +
        "This tool requires the --allow-move permission.",
      inputSchema: MoveFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "rename_file",
      description:
        "Rename a file within its current directory. " +
        "COMPARE WITH move_file: rename_file only changes the filename while keeping it in the same directory. " +
        "Will fail if a file with the new name already exists in the directory. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-rename permission.",
      inputSchema: RenameFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "xml_query",
      description:
        "Query XML file using XPath expressions. Provides powerful search " +
        "capabilities without reading the entire file into memory. " +
        "Supports standard XPath 1.0 query syntax for finding elements, attributes, " +
        "and text content. Requires `maxBytes` parameter (default 10KB). Can be used to extract specific data from large XML files " +
        "with precise queries. The path must be within allowed directories.",
      inputSchema: XmlQueryArgsSchema as unknown as ToolInput,
    },
    {
      name: "xml_structure",
      description:
        "Analyze XML file structure without reading the entire file. " +
        "Returns statistical information about element counts, attribute usage, " +
        "namespaces, and hierarchical structure. Useful for understanding the " +
        "structure of large XML files before performing detailed queries. Requires `maxBytes` (default 10KB) and `maxDepth` (default 2) parameters. " +
        "The path must be within allowed directories.",
      inputSchema: XmlStructureArgsSchema as unknown as ToolInput,
    },
    {
      name: "xml_to_json",
      description:
        "Convert an XML file to JSON format and optionally save it to a new file. " +
        "Uses fast-xml-parser for efficient and reliable conversion. " +
        "Supports various options like preserving attribute information " +
        "and formatting the output. Requires `maxBytes` parameter (default 10KB) for reading the input XML. Both input and output paths must be " +
        "within allowed directories. " +
        "NOTE: Saving the output to a file requires the --allow-create or --allow-edit permission. Use xml_to_json_string for " +
        "read-only operations.",
      inputSchema: XmlToJsonArgsSchema as unknown as ToolInput,
    },
    {
      name: "xml_to_json_string",
      description:
        "Convert an XML file to a JSON string and return it directly. " +
        "This is useful for quickly inspecting XML content as JSON without " +
        "creating a new file. Requires `maxBytes` parameter (default 10KB). Uses fast-xml-parser for conversion. " +
        "The input path must be within allowed directories. " +
        "This tool is fully functional in both readonly and write modes (respecting maxBytes) since " +
        "it only reads the XML file and returns the parsed data.",
      inputSchema: XmlToJsonStringArgsSchema as unknown as ToolInput,
    },
    {
      name: "delete_file",
      description:
        "Delete a SINGLE FILE at the specified path. " +
        "COMPARE WITH delete_directory: delete_file only works on individual files and will fail if used on directories. " +
        "Will fail if the file does not exist or if the path points to a directory. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: DeleteFileArgsSchema as unknown as ToolInput,
    },
    {
      name: "delete_directory",
      description:
        "Delete a DIRECTORY at the specified path. " +
        "COMPARE WITH delete_file: delete_directory is for removing directories while delete_file is for individual files. " +
        "By default, will fail if the directory is not empty - set recursive=true to delete all contents. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: DeleteDirectoryArgsSchema as unknown as ToolInput,
    },
    // JSON tools
    {
      name: "json_query",
      description:
        "Query JSON data using JSONPath expressions. Provides powerful search " +
        "capabilities for selecting data within JSON structures. Supports standard " +
        "JSONPath syntax for finding values, arrays, and nested structures. Requires `maxBytes` parameter (default 10KB). " +
        "The path must be within allowed directories.",
      inputSchema: JsonQueryArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_structure",
      description:
        "Get the structure of a JSON file by analyzing its top-level keys and their types. " +
        "Returns a mapping of key names to their corresponding data types (string, number, array, etc). " +
        "For arrays, it also indicates the type of the first element if available. " +
        "This is useful for understanding the shape of large JSON files without loading their entire content. Requires `maxBytes` (default 10KB) and `maxDepth` (default 2) parameters. " +
        "The path must be within allowed directories.",
      inputSchema: JsonStructureArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_filter",
      description:
        "Filter JSON array data using flexible conditions. Supports various comparison " +
        "operators (equals, greater than, contains, etc.) and can combine multiple " +
        "conditions with AND/OR logic. Requires `maxBytes` parameter (default 10KB). Perfect for filtering collections of objects " +
        "based on their properties. The path must be within allowed directories.",
      inputSchema: JsonFilterArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_get_value",
      description:
        "Get a specific value from a JSON file using a field path. Supports dot notation " +
        "for accessing nested properties and array indices. Requires `maxBytes` parameter (default 10KB). Returns the value directly, " +
        "properly formatted. The path must be within allowed directories.",
      inputSchema: JsonGetValueArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_transform",
      description:
        "Transform JSON data using a sequence of operations. Supports operations like " +
        "mapping array elements, grouping by fields, sorting, flattening nested arrays, " +
        "and picking/omitting fields. Requires `maxBytes` parameter (default 10KB). Operations are applied in sequence to transform " +
        "the data structure. The path must be within allowed directories.",
      inputSchema: JsonTransformArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_sample",
      description:
        "Sample JSON data from a JSON file. Requires `maxBytes` parameter (default 10KB). Returns a random sample of data from the JSON file. " +
        "The path must be within allowed directories.",
      inputSchema: JsonSampleArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_validate",
      description:
        "Validate JSON data against a JSON schema. Requires `maxBytes` parameter (default 10KB) for the data file. Returns true if the JSON data is valid against the schema, " +
        "or false if it is not. The path must be within allowed directories.",
      inputSchema: JsonValidateArgsSchema as unknown as ToolInput,
    },
    {
      name: "json_search_kv",
      description:
        "Search for key-value pairs in JSON files within a directory. Requires `maxBytes` (default 10KB), `maxDepth` (default 2), and `maxResults` (default 10) parameters. Returns all key-value pairs that match the search pattern. " +
        "The path must be within allowed directories.",
      inputSchema: JsonSearchKvArgsSchema as unknown as ToolInput,
    },
    {
      name: "regex_search_content",
      description:
        "Recursively search file content using a regex pattern. " +
        "Searches through subdirectories from the starting path. " +
        "Returns a list of files containing matches, including line numbers and matching lines. " +
        "Requires `regex` pattern. Optional: `path`, `filePattern`, `maxDepth`, `maxFileSize`, `maxResults`. " +
        "Only searches within allowed directories.",
      inputSchema: RegexSearchContentArgsSchema as unknown as ToolInput,
    },
  ];

  // Filter tools based on permissions
  const tools = !permissions.fullAccess ? allTools.filter(tool => {
    // These tools are always available
    if (['read_file', 'read_multiple_files', 'list_directory', 'directory_tree', 
         'search_files', 'find_files_by_extension', 'get_file_info', 
         'list_allowed_directories', 'xml_to_json_string', 'get_permissions',
         'xml_query', 'xml_structure',
         'json_query', 'json_filter', 'json_get_value', 'json_transform', 'json_structure', 'json_sample', 'json_validate', 'json_search_kv', 'regex_search_content'].includes(tool.name)) { // Added regex_search_content
      return true;
    }

    // Split write_file into two separate tools
    if (permissions.create && tool.name === 'create_file') {
      return true;
    }

    if (permissions.edit && tool.name === 'modify_file') {
      return true;
    }

    // Other permission tools remain the same
    if (permissions.create && ['create_directory', 'xml_to_json'].includes(tool.name)) {
      return true;
    }

    if (permissions.edit && ['edit_file'].includes(tool.name)) {
      return true;
    }

    if (permissions.move && ['move_file'].includes(tool.name)) {
      return true;
    }
    
    if (permissions.rename && ['rename_file'].includes(tool.name)) {
      return true;
    }

    if (permissions.delete && ['delete_file', 'delete_directory'].includes(tool.name)) {
      return true;
    }

    return false;
  }) : allTools;

  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_file": {
        return await handleReadFile(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "read_multiple_files": {
        return await handleReadMultipleFiles(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "create_file": {
        return await handleCreateFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "modify_file": {
        return await handleModifyFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "edit_file": {
        return await handleEditFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "create_directory": {
        return await handleCreateDirectory(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "list_directory": {
        return await handleListDirectory(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "directory_tree": {
        return await handleDirectoryTree(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "move_file": {
        return await handleMoveFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "rename_file": {
        return await handleRenameFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "delete_directory": {
        return await handleDeleteDirectory(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "search_files": {
        return await handleSearchFiles(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "find_files_by_extension": {
        return await handleFindFilesByExtension(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "get_file_info": {
        return await handleGetFileInfo(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "list_allowed_directories": {
        return handleListAllowedDirectories(args, allowedDirectories);
      }

      case "get_permissions": {
        return handleGetPermissions(args, permissions, readonlyFlag, noFollowSymlinks, allowedDirectories);
      }

      case "xml_query": {
        return await handleXmlQuery(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "xml_structure": {
        return await handleXmlStructure(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "xml_to_json": {
        return await handleXmlToJson(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }
      
      case "xml_to_json_string": {
        return await handleXmlToJsonString(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "delete_file": {
        return await handleDeleteFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_query": {
        return await handleJsonQuery(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_structure": {
        return await handleJsonStructure(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_filter": {
        return await handleJsonFilter(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_get_value": {
        return await handleJsonGetValue(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_transform": {
        return await handleJsonTransform(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_sample": {
        return await handleJsonSample(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_validate": {
        return await handleJsonValidate(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_search_kv": {
        return await handleJsonSearchKv(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "regex_search_content": {
        return await handleRegexSearchContent(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Secure MCP Filesystem Server running on stdio");
  console.error("Allowed directories:", allowedDirectories);
  
  // Log permission state
  const permState = [];
  if (readonlyFlag) {
    console.error("Server running in read-only mode (--readonly flag overrides all other permissions)");
  } else if (permissions.fullAccess) {
    console.error("Server running with full access (all operations enabled via --full-access)");
  } else {
    if (permissions.create) permState.push("create");
    if (permissions.edit) permState.push("edit");
    if (permissions.move) permState.push("move");
    if (permissions.rename) permState.push("rename");
    if (permissions.delete) permState.push("delete");
    if (permState.length === 0) {
      console.error("Server running in default read-only mode (use --full-access or specific --allow-* flags to enable write operations)");
    } else {
      console.error(`Server running with specific permissions enabled: ${permState.join(", ")}`);
    }
  }
  
  if (noFollowSymlinks) {
    console.error("Server running with symlink following disabled");
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
