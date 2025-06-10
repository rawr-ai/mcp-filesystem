import { Type, Static } from "@sinclair/typebox";

export const CreateDirectoryArgsSchema = Type.Object({
  path: Type.String(),
});
export type CreateDirectoryArgs = Static<typeof CreateDirectoryArgsSchema>;

export const ListDirectoryArgsSchema = Type.Object({
  path: Type.String(),
});
export type ListDirectoryArgs = Static<typeof ListDirectoryArgsSchema>;

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
export type DirectoryTreeArgs = Static<typeof DirectoryTreeArgsSchema>;

export const DeleteDirectoryArgsSchema = Type.Object({
  path: Type.String(),
  recursive: Type.Boolean({
    default: false,
    description: 'Whether to recursively delete the directory and all contents'
  })
});
export type DeleteDirectoryArgs = Static<typeof DeleteDirectoryArgsSchema>;
