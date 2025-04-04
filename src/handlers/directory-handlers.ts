import fs from 'fs/promises';
import path from 'path';
import { minimatch } from 'minimatch';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import {
  CreateDirectoryArgsSchema,
  ListDirectoryArgsSchema,
  DirectoryTreeArgsSchema,
  DeleteDirectoryArgsSchema
} from '../schemas/directory-operations.js';

interface TreeEntry {
  name: string;
  type: 'file' | 'directory';
  children?: TreeEntry[];
}

export async function handleCreateDirectory(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = CreateDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for create_directory: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.create && !permissions.fullAccess) {
    throw new Error('Cannot create directory: create permission not granted (requires --allow-create)');
  }
  
  const validPath = await validatePath(
    parsed.data.path,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks,
    { checkParentExists: false } // Add this option
  );
  await fs.mkdir(validPath, { recursive: true });
  return {
    content: [{ type: "text", text: `Successfully created directory ${parsed.data.path}` }],
  };
}

export async function handleListDirectory(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ListDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for list_directory: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const entries = await fs.readdir(validPath, { withFileTypes: true });
  const formatted = entries
    .map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`)
    .join("\n");
  return {
    content: [{ type: "text", text: formatted }],
  };
}

export async function handleDirectoryTree(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DirectoryTreeArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for directory_tree: ${parsed.error}`);
  }

  const { path: startPath, maxDepth, excludePatterns } = parsed.data; // maxDepth is mandatory (handler default: 2)
  const validatedStartPath = await validatePath(startPath, allowedDirectories, symlinksMap, noFollowSymlinks);

  async function buildTree(
    currentPath: string,
    basePath: string,
    currentDepth: number,
    maxDepth?: number,
    excludePatterns?: string[]
  ): Promise<TreeEntry[]> {
    // Depth check
    if (maxDepth !== undefined && currentDepth >= maxDepth) {
      return []; // Stop traversal if max depth is reached
    }

    const validPath = await validatePath(currentPath, allowedDirectories, symlinksMap, noFollowSymlinks);
    
    let entries;
    try {
      entries = await fs.readdir(validPath, { withFileTypes: true });
    } catch (error) {
      // Handle cases where directory might not be readable
      console.error(`Error reading directory ${validPath}: ${error}`);
      return [];
    }
    
    const result: TreeEntry[] = [];

    for (const entry of entries) {
      const entryFullPath = path.join(currentPath, entry.name);
      const entryRelativePath = path.relative(basePath, entryFullPath);

      // Exclusion check using minimatch
      if (excludePatterns && excludePatterns.length > 0) {
        const shouldExclude = excludePatterns.some(pattern =>
          minimatch(entryRelativePath, pattern, { dot: true, matchBase: true })
        );
        if (shouldExclude) {
          continue; // Skip this entry if it matches any exclude pattern
        }
      }

      const entryData: TreeEntry = {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file'
      };

      if (entry.isDirectory()) {
        // Recursive call with incremented depth
        entryData.children = await buildTree(
          entryFullPath,
          basePath,
          currentDepth + 1,
          maxDepth,
          excludePatterns
        );
      }

      result.push(entryData);
    }

    return result;
  }

  // Initial call to buildTree with base parameters
  const treeData = await buildTree(
    validatedStartPath, 
    validatedStartPath, 
    0, 
    maxDepth, 
    excludePatterns
  );
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify(treeData, null, 2)
    }],
  };
}

export async function handleDeleteDirectory(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DeleteDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for delete_directory: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.delete && !permissions.fullAccess) {
    throw new Error('Cannot delete directory: delete permission not granted (requires --allow-delete)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
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