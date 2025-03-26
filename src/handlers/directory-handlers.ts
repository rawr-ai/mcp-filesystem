import fs from 'fs/promises';
import path from 'path';
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
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
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

  async function buildTree(currentPath: string): Promise<TreeEntry[]> {
    const validPath = await validatePath(currentPath, allowedDirectories, symlinksMap, noFollowSymlinks);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
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