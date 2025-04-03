import { z } from "zod";

export const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const DirectoryTreeArgsSchema = z.object({
  path: z.string(),
  depth: z.number().int().positive().optional().describe('Maximum depth to traverse. If omitted, traverses indefinitely.'),
  excludePatterns: z.array(z.string()).optional().default([]).describe('Glob patterns for files/directories to exclude (e.g., "*.log", "node_modules").')
});

export const DeleteDirectoryArgsSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
}); 