import fs from 'fs/promises';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import { getFileStats, applyFileEdits } from '../utils/file-utils.js';
import {
  ReadFileArgsSchema,
  ReadMultipleFilesArgsSchema,
  WriteFileArgsSchema,
  EditFileArgsSchema,
  GetFileInfoArgsSchema,
  MoveFileArgsSchema,
  DeleteFileArgsSchema
} from '../schemas/file-operations.js';

export async function handleReadFile(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ReadFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for read_file: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const content = await fs.readFile(validPath, "utf-8");
  return {
    content: [{ type: "text", text: content }],
  };
}

export async function handleReadMultipleFiles(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ReadMultipleFilesArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for read_multiple_files: ${parsed.error}`);
  }
  const results = await Promise.all(
    parsed.data.paths.map(async (filePath: string) => {
      try {
        const validPath = await validatePath(filePath, allowedDirectories, symlinksMap, noFollowSymlinks);
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

export async function handleCreateFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = WriteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for create_file: ${parsed.error}`);
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
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

export async function handleModifyFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = WriteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for modify_file: ${parsed.error}`);
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
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

export async function handleEditFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = EditFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for edit_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.edit && !permissions.fullAccess) {
    throw new Error('Cannot edit file: edit permission not granted (requires --allow-edit)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const result = await applyFileEdits(validPath, parsed.data.edits, parsed.data.dryRun);
  return {
    content: [{ type: "text", text: result }],
  };
}

export async function handleGetFileInfo(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = GetFileInfoArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for get_file_info: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const info = await getFileStats(validPath);
  return {
    content: [{ type: "text", text: Object.entries(info)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n") }],
  };
}

export async function handleMoveFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = MoveFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for move_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.move && !permissions.fullAccess) {
    throw new Error('Cannot move file: move permission not granted (requires --allow-move)');
  }
  
  const validSourcePath = await validatePath(parsed.data.source, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validDestPath = await validatePath(parsed.data.destination, allowedDirectories, symlinksMap, noFollowSymlinks);
  await fs.rename(validSourcePath, validDestPath);
  return {
    content: [{ type: "text", text: `Successfully moved ${parsed.data.source} to ${parsed.data.destination}` }],
  };
}

export async function handleDeleteFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DeleteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for delete_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.delete && !permissions.fullAccess) {
    throw new Error('Cannot delete file: delete permission not granted (requires --allow-delete)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
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