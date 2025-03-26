#!/usr/bin/env node

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
import { zodToJsonSchema } from "zod-to-json-schema";
import { diffLines, createTwoFilesPatch } from 'diff';
import { minimatch } from 'minimatch';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// Command line argument parsing
const args = process.argv.slice(2);
// Parse flags
const readonlyFlag = args.includes('--readonly');
const noFollowSymlinks = args.includes('--no-follow-symlinks');

// Granular permission flags
const allowCreate = args.includes('--allow-create');
const allowEdit = args.includes('--allow-edit');
const allowMove = args.includes('--allow-move');
const allowDelete = args.includes('--allow-delete');

// Permission calculation (readonly overrides allow flags)
const permissions = {
  // If readonly is true, all permissions are false regardless of allow flags
  create: !readonlyFlag && allowCreate,
  edit: !readonlyFlag && allowEdit,
  move: !readonlyFlag && allowMove,
  delete: !readonlyFlag && allowDelete,
  // If no permission flags are set and not readonly, allow everything
  fullAccess: !readonlyFlag && !allowCreate && !allowEdit && !allowMove && !allowDelete
};

// Remove flags from args
if (readonlyFlag) {
  args.splice(args.indexOf('--readonly'), 1);
}
if (noFollowSymlinks) {
  args.splice(args.indexOf('--no-follow-symlinks'), 1);
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

if (args.length === 0) {
  console.error("Usage: mcp-server-filesystem [--readonly] [--no-follow-symlinks] [--allow-create] [--allow-edit] [--allow-move] [--allow-delete] <allowed-directory> [additional-directories...]");
  process.exit(1);
}

// Normalize all paths consistently
function normalizePath(p: string): string {
  return path.normalize(p);
}

function expandHome(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
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
      }
    } catch (error) {
      // If we can't resolve the real path, just continue
      console.error(`Warning: Could not resolve real path for ${dir}:`, error);
    }
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    process.exit(1);
  }
}));

// Security utilities
async function validatePath(requestedPath: string): Promise<string> {
  const expandedPath = expandHome(requestedPath);
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(process.cwd(), expandedPath);

  const normalizedRequested = normalizePath(absolute);

  // Check if path is within allowed directories
  const isAllowed = allowedDirectories.some(dir => normalizedRequested.startsWith(dir));
  if (!isAllowed) {
    // Check if it's a real path that matches a symlink we know about
    const matchingSymlink = Array.from(symlinksMap.entries()).find(([realPath, symlinkPath]) => 
      normalizedRequested.startsWith(realPath)
    );
    
    if (matchingSymlink) {
      const [realPath, symlinkPath] = matchingSymlink;
      // Convert the path from real path to symlink path
      const relativePath = normalizedRequested.substring(realPath.length);
      const symlinkEquivalent = path.join(symlinkPath, relativePath);
      
      // Return the symlink path instead
      return symlinkEquivalent;
    }
    
    throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`);
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = normalizePath(realPath);
    
    // If the real path is different from the requested path, it's a symlink
    if (normalizedReal !== normalizedRequested) {
      // Store this mapping for future reference
      symlinksMap.set(normalizedReal, normalizedRequested);
      
      // Make sure the real path is also allowed
      const isRealPathAllowed = allowedDirectories.some(dir => normalizedReal.startsWith(dir));
      if (!isRealPathAllowed) {
        throw new Error("Access denied - symlink target outside allowed directories");
      }
      
      // If no-follow-symlinks is true, return the original path
      if (noFollowSymlinks) {
        return absolute;
      }
    }
    
    return realPath;
  } catch (error) {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = normalizePath(realParentPath);
      const isParentAllowed = allowedDirectories.some(dir => normalizedParent.startsWith(dir));
      if (!isParentAllowed) {
        throw new Error("Access denied - parent directory outside allowed directories");
      }
      return absolute;
    } catch {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }
  }
}

// Schema definitions
const ReadFileArgsSchema = z.object({
  path: z.string(),
});

const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const EditOperation = z.object({
  oldText: z.string().describe('Text to search for - must match exactly'),
  newText: z.string().describe('Text to replace with')
});

const EditFileArgsSchema = z.object({
  path: z.string(),
  edits: z.array(EditOperation),
  dryRun: z.boolean().default(false).describe('Preview changes using git-style diff format')
});

const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

const DirectoryTreeArgsSchema = z.object({
  path: z.string(),
});

const MoveFileArgsSchema = z.object({
  source: z.string(),
  destination: z.string(),
});

const SearchFilesArgsSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional().default([])
});

const FindFilesByExtensionArgsSchema = z.object({
  path: z.string(),
  extension: z.string().describe('File extension to search for (e.g., "xml", "json", "ts")'),
  excludePatterns: z.array(z.string()).optional().default([])
});

const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

const DeleteFileArgsSchema = z.object({
  path: z.string(),
});

const DeleteDirectoryArgsSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
});

const XmlToJsonArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  jsonPath: z.string().describe('Path where the JSON should be saved'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties'),
    format: z.boolean().default(true).describe('Whether to format the JSON output'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation')
  }).optional().default({})
});

const XmlToJsonStringArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties')
  }).optional().default({})
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

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

// Tool implementations
async function getFileStats(filePath: string): Promise<FileInfo> {
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    permissions: stats.mode.toString(8).slice(-3),
  };
}

async function searchFiles(
  rootPath: string,
  pattern: string,
  excludePatterns: string[] = []
): Promise<string[]> {
  const results: string[] = [];

  async function search(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      try {
        // Validate each path before processing
        await validatePath(fullPath);

        // Check if path matches any exclude pattern
        const relativePath = path.relative(rootPath, fullPath);
        const shouldExclude = excludePatterns.some(pattern => {
          const globPattern = pattern.includes('*') ? pattern : `**/${pattern}/**`;
          return minimatch(relativePath, globPattern, { dot: true });
        });

        if (shouldExclude) {
          continue;
        }

        if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(fullPath);
        }

        if (entry.isDirectory()) {
          await search(fullPath);
        }
      } catch (error) {
        // Skip invalid paths during search
        continue;
      }
    }
  }

  await search(rootPath);
  return results;
}

// Add a new function for finding files by extension
async function findFilesByExtension(
  rootPath: string,
  extension: string,
  excludePatterns: string[] = []
): Promise<string[]> {
  const results: string[] = [];
  
  // Normalize the extension (remove leading dot if present)
  let normalizedExtension = extension.toLowerCase();
  if (normalizedExtension.startsWith('.')) {
    normalizedExtension = normalizedExtension.substring(1);
  }
  
  async function searchDirectory(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      try {
        // Validate each path before processing
        await validatePath(fullPath);

        // Check if path matches any exclude pattern
        const relativePath = path.relative(rootPath, fullPath);
        const shouldExclude = excludePatterns.some(pattern => {
          const globPattern = pattern.includes('*') ? pattern : `**/${pattern}/**`;
          return minimatch(relativePath, globPattern, { dot: true });
        });

        if (shouldExclude) {
          continue;
        }

        if (entry.isFile()) {
          // Check if file has the requested extension
          const fileExtension = path.extname(entry.name).toLowerCase().substring(1);
          if (fileExtension === normalizedExtension) {
            results.push(fullPath);
          }
        } else if (entry.isDirectory()) {
          // Recursively search subdirectories
          await searchDirectory(fullPath);
        }
      } catch (error) {
        // Skip invalid paths during search
        continue;
      }
    }
  }

  await searchDirectory(rootPath);
  return results;
}

// file editing and diffing utilities
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function createUnifiedDiff(originalContent: string, newContent: string, filepath: string = 'file'): string {
  // Ensure consistent line endings for diff
  const normalizedOriginal = normalizeLineEndings(originalContent);
  const normalizedNew = normalizeLineEndings(newContent);

  return createTwoFilesPatch(
    filepath,
    filepath,
    normalizedOriginal,
    normalizedNew,
    'original',
    'modified'
  );
}

async function applyFileEdits(
  filePath: string,
  edits: Array<{oldText: string, newText: string}>,
  dryRun = false
): Promise<string> {
  // Read file content and normalize line endings
  const content = normalizeLineEndings(await fs.readFile(filePath, 'utf-8'));

  // Apply edits sequentially
  let modifiedContent = content;
  for (const edit of edits) {
    const normalizedOld = normalizeLineEndings(edit.oldText);
    const normalizedNew = normalizeLineEndings(edit.newText);

    // If exact match exists, use it
    if (modifiedContent.includes(normalizedOld)) {
      modifiedContent = modifiedContent.replace(normalizedOld, normalizedNew);
      continue;
    }

    // Otherwise, try line-by-line matching with flexibility for whitespace
    const oldLines = normalizedOld.split('\n');
    const contentLines = modifiedContent.split('\n');
    let matchFound = false;

    for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
      const potentialMatch = contentLines.slice(i, i + oldLines.length);

      // Compare lines with normalized whitespace
      const isMatch = oldLines.every((oldLine, j) => {
        const contentLine = potentialMatch[j];
        return oldLine.trim() === contentLine.trim();
      });

      if (isMatch) {
        // Preserve original indentation of first line
        const originalIndent = contentLines[i].match(/^\s*/)?.[0] || '';
        const newLines = normalizedNew.split('\n').map((line, j) => {
          if (j === 0) return originalIndent + line.trimStart();
          // For subsequent lines, try to preserve relative indentation
          const oldIndent = oldLines[j]?.match(/^\s*/)?.[0] || '';
          const newIndent = line.match(/^\s*/)?.[0] || '';
          if (oldIndent && newIndent) {
            const relativeIndent = newIndent.length - oldIndent.length;
            return originalIndent + ' '.repeat(Math.max(0, relativeIndent)) + line.trimStart();
          }
          return line;
        });

        contentLines.splice(i, oldLines.length, ...newLines);
        modifiedContent = contentLines.join('\n');
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      throw new Error(`Could not find exact match for edit:\n${edit.oldText}`);
    }
  }

  // Create unified diff
  const diff = createUnifiedDiff(content, modifiedContent, filePath);

  // Format diff with appropriate number of backticks
  let numBackticks = 3;
  while (diff.includes('`'.repeat(numBackticks))) {
    numBackticks++;
  }
  const formattedDiff = `${'`'.repeat(numBackticks)}diff\n${diff}${'`'.repeat(numBackticks)}\n\n`;

  if (!dryRun) {
    await fs.writeFile(filePath, modifiedContent, 'utf-8');
  }

  return formattedDiff;
}

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
        "the contents of a single file. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ReadFileArgsSchema) as ToolInput,
    },
    {
      name: "read_multiple_files",
      description:
        "Read the contents of multiple files simultaneously. This is more " +
        "efficient than reading files one by one when you need to analyze " +
        "or compare multiple files. Each file's content is returned with its " +
        "path as a reference. Failed reads for individual files won't stop " +
        "the entire operation. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ReadMultipleFilesArgsSchema) as ToolInput,
    },
    {
      name: "list_directory",
      description:
        "Get a detailed listing of all files and directories in a specified path. " +
        "Results clearly distinguish between files and directories with [FILE] and [DIR] " +
        "prefixes. This tool is essential for understanding directory structure and " +
        "finding specific files within a directory. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ListDirectoryArgsSchema) as ToolInput,
    },
    {
      name: "directory_tree",
      description:
          "Get a recursive tree view of files and directories as a JSON structure. " +
          "Each entry includes 'name', 'type' (file/directory), and 'children' for directories. " +
          "Files have no children array, while directories always have a children array (which may be empty). " +
          "The output is formatted with 2-space indentation for readability. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(DirectoryTreeArgsSchema) as ToolInput,
    },
    {
      name: "search_files",
      description:
        "Recursively search for files and directories matching a pattern. " +
        "Searches through all subdirectories from the starting path. The search " +
        "is case-insensitive and matches partial names. Returns full paths to all " +
        "matching items. Great for finding files when you don't know their exact location. " +
        "Only searches within allowed directories.",
      inputSchema: zodToJsonSchema(SearchFilesArgsSchema) as ToolInput,
    },
    {
      name: "find_files_by_extension",
      description:
        "Recursively find all files with a specific extension. " +
        "Searches through all subdirectories from the starting path. " +
        "Extension matching is case-insensitive. Returns full paths to all " +
        "matching files. Perfect for finding all XML, JSON, or other file types " +
        "in a directory structure. Only searches within allowed directories.",
      inputSchema: zodToJsonSchema(FindFilesByExtensionArgsSchema) as ToolInput,
    },
    {
      name: "get_file_info",
      description:
        "Retrieve detailed metadata about a file or directory. Returns comprehensive " +
        "information including size, creation time, last modified time, permissions, " +
        "and type. This tool is perfect for understanding file characteristics " +
        "without reading the actual content. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(GetFileInfoArgsSchema) as ToolInput,
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
    
    // Write tools (filtered based on permissions)
    {
      name: "create_file",
      description:
        "Create a new file with the specified content. " +
        "Will fail if the file already exists. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput,
    },
    {
      name: "modify_file",
      description:
        "Modify an existing file with new content. " +
        "Will fail if the file does not exist. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput,
    },
    {
      name: "edit_file",
      description:
        "Make line-based edits to a text file. Each edit replaces exact line sequences " +
        "with new content. Returns a git-style diff showing the changes made. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: zodToJsonSchema(EditFileArgsSchema) as ToolInput,
    },
    {
      name: "create_directory",
      description:
        "Create a new directory or ensure a directory exists. Can create multiple " +
        "nested directories in one operation. If the directory already exists, " +
        "this operation will succeed silently. Perfect for setting up directory " +
        "structures for projects or ensuring required paths exist. Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: zodToJsonSchema(CreateDirectoryArgsSchema) as ToolInput,
    },
    {
      name: "move_file",
      description:
        "Move or rename files and directories. Can move files between directories " +
        "and rename them in a single operation. If the destination exists, the " +
        "operation will fail. Works across different directories and can be used " +
        "for simple renaming within the same directory. Both source and destination must be within allowed directories. " +
        "This tool requires the --allow-move permission.",
      inputSchema: zodToJsonSchema(MoveFileArgsSchema) as ToolInput,
    },
    {
      name: "xml_to_json",
      description:
        "Convert an XML file to JSON format and optionally save it to a new file. " +
        "Uses fast-xml-parser for efficient and reliable conversion. " +
        "Supports various options like preserving attribute information " +
        "and formatting the output. Both input and output paths must be " +
        "within allowed directories. " +
        "NOTE: This tool is always available for parsing XML, but saving the output " +
        "to a file requires the --allow-create permission. Use xml_to_json_string for " +
        "read-only operations.",
      inputSchema: zodToJsonSchema(XmlToJsonArgsSchema) as ToolInput,
    },
    {
      name: "xml_to_json_string",
      description:
        "Convert an XML file to a JSON string and return it directly. " +
        "This is useful for quickly inspecting XML content as JSON without " +
        "creating a new file. Uses fast-xml-parser for conversion. " +
        "The input path must be within allowed directories. " +
        "This tool is fully functional in both readonly and write modes since " +
        "it only reads the XML file and returns the parsed data.",
      inputSchema: zodToJsonSchema(XmlToJsonStringArgsSchema) as ToolInput,
    },
    {
      name: "delete_file",
      description:
        "Delete a file at the specified path. " +
        "Will fail if the file does not exist. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: zodToJsonSchema(DeleteFileArgsSchema) as ToolInput,
    },
    {
      name: "delete_directory",
      description:
        "Delete a directory at the specified path. " +
        "Can optionally delete recursively with all contents. " +
        "Will fail if the directory is not empty and recursive is false. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: zodToJsonSchema(DeleteDirectoryArgsSchema) as ToolInput,
    },
  ];

  // Filter tools based on permissions
  const tools = !permissions.fullAccess ? allTools.filter(tool => {
    // These tools are always available
    if (['read_file', 'read_multiple_files', 'list_directory', 'directory_tree', 
         'search_files', 'find_files_by_extension', 'get_file_info', 
         'list_allowed_directories', 'xml_to_json_string'].includes(tool.name)) {
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
        const parsed = ReadFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for read_file: ${parsed.error}`);
        }
        const validPath = await validatePath(parsed.data.path);
        const content = await fs.readFile(validPath, "utf-8");
        return {
          content: [{ type: "text", text: content }],
        };
      }

      case "read_multiple_files": {
        const parsed = ReadMultipleFilesArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for read_multiple_files: ${parsed.error}`);
        }
        const results = await Promise.all(
          parsed.data.paths.map(async (filePath: string) => {
            try {
              const validPath = await validatePath(filePath);
              const content = await fs.readFile(validPath, "utf-8");
              return `${filePath}:\n${content}\n`;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              return `${filePath}: Error - ${errorMessage}`;
            }
          }),
        );
        return {
          content: [{ type: "text", text: results.join("\n---\n") }],
        };
      }

      case "create_file": {
        const parsed = WriteFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for create_file: ${parsed.error}`);
        }
        
        const validPath = await validatePath(parsed.data.path);
        
        // Check if file exists
        try {
          await fs.access(validPath);
          throw new Error('Cannot create file: file already exists');
        } catch (error) {
          // File doesn't exist - proceed with creation
          if (!permissions.create && !permissions.fullAccess) {
            throw new Error('Cannot create new file: create permission not granted (requires --allow-create)');
          }
          
          await fs.writeFile(validPath, parsed.data.content, "utf-8");
          return {
            content: [{ type: "text", text: `Successfully created ${parsed.data.path}` }],
          };
        }
      }

      case "modify_file": {
        const parsed = WriteFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for modify_file: ${parsed.error}`);
        }
        
        const validPath = await validatePath(parsed.data.path);
        
        // Check if file exists
        try {
          await fs.access(validPath);
          
          if (!permissions.edit && !permissions.fullAccess) {
            throw new Error('Cannot modify file: edit permission not granted (requires --allow-edit)');
          }
          
          await fs.writeFile(validPath, parsed.data.content, "utf-8");
          return {
            content: [{ type: "text", text: `Successfully modified ${parsed.data.path}` }],
          };
        } catch (error) {
          throw new Error('Cannot modify file: file does not exist');
        }
      }

      case "edit_file": {
        const parsed = EditFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for edit_file: ${parsed.error}`);
        }
        
        // Enforce permission checks
        if (!permissions.edit && !permissions.fullAccess) {
          throw new Error('Cannot edit file: edit permission not granted (requires --allow-edit)');
        }
        
        const validPath = await validatePath(parsed.data.path);
        const result = await applyFileEdits(validPath, parsed.data.edits, parsed.data.dryRun);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "create_directory": {
        const parsed = CreateDirectoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for create_directory: ${parsed.error}`);
        }
        
        // Enforce permission checks
        if (!permissions.create && !permissions.fullAccess) {
          throw new Error('Cannot create directory: create permission not granted (requires --allow-create)');
        }
        
        const validPath = await validatePath(parsed.data.path);
        await fs.mkdir(validPath, { recursive: true });
        return {
          content: [{ type: "text", text: `Successfully created directory ${parsed.data.path}` }],
        };
      }

      case "list_directory": {
        const parsed = ListDirectoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for list_directory: ${parsed.error}`);
        }
        const validPath = await validatePath(parsed.data.path);
        const entries = await fs.readdir(validPath, { withFileTypes: true });
        const formatted = entries
          .map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`)
          .join("\n");
        return {
          content: [{ type: "text", text: formatted }],
        };
      }

        case "directory_tree": {
            const parsed = DirectoryTreeArgsSchema.safeParse(args);
            if (!parsed.success) {
                throw new Error(`Invalid arguments for directory_tree: ${parsed.error}`);
            }

            interface TreeEntry {
                name: string;
                type: 'file' | 'directory';
                children?: TreeEntry[];
            }

            async function buildTree(currentPath: string): Promise<TreeEntry[]> {
                const validPath = await validatePath(currentPath);
                const entries = await fs.readdir(validPath, {withFileTypes: true});
                const result: TreeEntry[] = [];

                for (const entry of entries) {
                    const entryData: TreeEntry = {
                        name: entry.name,
                        type: entry.isDirectory() ? 'directory' : 'file'
                    };

                    if (entry.isDirectory()) {
                        const subPath = path.join(currentPath, entry.name);
                        entryData.children = await buildTree(subPath);
                    }

                    result.push(entryData);
                }

                return result;
            }

            const treeData = await buildTree(parsed.data.path);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(treeData, null, 2)
                }],
            };
        }

      case "move_file": {
        const parsed = MoveFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for move_file: ${parsed.error}`);
        }
        
        // Enforce permission checks
        if (!permissions.move && !permissions.fullAccess) {
          throw new Error('Cannot move file: move permission not granted (requires --allow-move)');
        }
        
        const validSourcePath = await validatePath(parsed.data.source);
        const validDestPath = await validatePath(parsed.data.destination);
        await fs.rename(validSourcePath, validDestPath);
        return {
          content: [{ type: "text", text: `Successfully moved ${parsed.data.source} to ${parsed.data.destination}` }],
        };
      }

      case "search_files": {
        const parsed = SearchFilesArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for search_files: ${parsed.error}`);
        }
        const validPath = await validatePath(parsed.data.path);
        const results = await searchFiles(validPath, parsed.data.pattern, parsed.data.excludePatterns);
        return {
          content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matches found" }],
        };
      }

      case "find_files_by_extension": {
        const parsed = FindFilesByExtensionArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for find_files_by_extension: ${parsed.error}`);
        }
        const validPath = await validatePath(parsed.data.path);
        const results = await findFilesByExtension(
          validPath, 
          parsed.data.extension, 
          parsed.data.excludePatterns
        );
        return {
          content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matching files found" }],
        };
      }

      case "get_file_info": {
        const parsed = GetFileInfoArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for get_file_info: ${parsed.error}`);
        }
        const validPath = await validatePath(parsed.data.path);
        const info = await getFileStats(validPath);
        return {
          content: [{ type: "text", text: Object.entries(info)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n") }],
        };
      }

      case "list_allowed_directories": {
        return {
          content: [{
            type: "text",
            text: `Allowed directories:\n${allowedDirectories.join('\n')}`
          }],
        };
      }

      case "xml_to_json": {
        const parsed = XmlToJsonArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for xml_to_json: ${parsed.error}`);
        }
        
        const validXmlPath = await validatePath(parsed.data.xmlPath);
        const validJsonPath = await validatePath(parsed.data.jsonPath);
        
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
      
      case "xml_to_json_string": {
        const parsed = XmlToJsonStringArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for xml_to_json_string: ${parsed.error}`);
        }
        
        const validXmlPath = await validatePath(parsed.data.xmlPath);
        
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

      case "delete_file": {
        const parsed = DeleteFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for delete_file: ${parsed.error}`);
        }
        
        // Enforce permission checks
        if (!permissions.delete && !permissions.fullAccess) {
          throw new Error('Cannot delete file: delete permission not granted (requires --allow-delete)');
        }
        
        const validPath = await validatePath(parsed.data.path);
        
        try {
          // Check if file exists
          await fs.access(validPath);
          await fs.unlink(validPath);
          return {
            content: [{ type: "text", text: `Successfully deleted ${parsed.data.path}` }],
          };
        } catch (error) {
          throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      case "delete_directory": {
        const parsed = DeleteDirectoryArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for delete_directory: ${parsed.error}`);
        }
        
        // Enforce permission checks
        if (!permissions.delete && !permissions.fullAccess) {
          throw new Error('Cannot delete directory: delete permission not granted (requires --allow-delete)');
        }
        
        const validPath = await validatePath(parsed.data.path);
        
        try {
          if (parsed.data.recursive) {
            // Safety confirmation for recursive delete
            await fs.rm(validPath, { recursive: true, force: true });
            return {
              content: [{ type: "text", text: `Successfully deleted directory ${parsed.data.path} and all its contents` }],
            };
          } else {
            // Non-recursive directory delete
            await fs.rmdir(validPath);
            return {
              content: [{ type: "text", text: `Successfully deleted directory ${parsed.data.path}` }],
            };
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes('ENOTEMPTY')) {
            throw new Error(`Cannot delete directory: directory is not empty. Use recursive=true to delete with contents.`);
          }
          throw new Error(`Failed to delete directory: ${msg}`);
        }
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
  if (readonlyFlag) {
    console.error("Server running in read-only mode");
  } else {
    // Log permission state
    const permState = [];
    if (permissions.fullAccess) {
      permState.push("full access (create, edit, move, delete)");
    } else {
      if (permissions.create) permState.push("create");
      if (permissions.edit) permState.push("edit");
      if (permissions.move) permState.push("move");
      if (permissions.delete) permState.push("delete");
      if (permState.length === 0) permState.push("read-only");
    }
    console.error(`Server running with permissions: ${permState.join(", ")}`);
  }
  if (noFollowSymlinks) {
    console.error("Server running with symlink following disabled");
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
