import { z } from "zod";
import { Type } from "@sinclair/typebox";

export const CreateDirectoryArgsSchema = Type.Object({
  path: Type.String(),
});

export const CreateDirectoryArgsZod = z.object({
  path: z.string(),
});

export const ListDirectoryArgsSchema = Type.Object({
  path: Type.String(),
});

export const ListDirectoryArgsZod = z.object({
  path: z.string(),
});

export const DirectoryTreeArgsSchema = Type.Object({
  path: Type.String(),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'Maximum depth to traverse. Must be a positive integer. Handler default: 2.'
  }),
  excludePatterns: Type.Optional(
    Type.Array(Type.String(), {
      default: [],
      description: 'Glob patterns for files/directories to exclude (e.g., "*.log", "node_modules").'
    })
  )
});

export const DirectoryTreeArgsZod = z.object({
  path: z.string(),
  maxDepth: z.number().int().positive().describe('Maximum depth to traverse. Must be a positive integer. Handler default: 2.'),
  excludePatterns: z.array(z.string()).optional().default([]).describe('Glob patterns for files/directories to exclude (e.g., "*.log", "node_modules").')
});

export const DeleteDirectoryArgsSchema = Type.Object({
  path: Type.String(),
  recursive: Type.Optional(
    Type.Boolean({ default: false, description: 'Whether to recursively delete the directory and all contents' })
  )
});

export const DeleteDirectoryArgsZod = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
});
