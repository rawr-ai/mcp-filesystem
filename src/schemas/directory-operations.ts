import { z } from "zod";

export const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const DirectoryTreeArgsSchema = z.object({
  path: z.string(),
  maxDepth: z.number().int().positive().describe('Maximum depth to traverse. Must be a positive integer. Handler default: 2.'),
  excludePatterns: z.array(z.string()).optional().default([]).describe('Glob patterns for files/directories to exclude (e.g., "*.log", "node_modules").')
});

export const DeleteDirectoryArgsSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
}); 