import { Type, Static } from "@sinclair/typebox";

// Schema definitions moved from index.ts

export const ReadFileArgsSchema = Type.Object({
  path: Type.String(),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type ReadFileArgs = Static<typeof ReadFileArgsSchema>;

export const ReadMultipleFilesArgsSchema = Type.Object({
  paths: Type.Array(Type.String()),
  maxBytesPerFile: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read per file. Must be a positive integer. Handler default: 10KB.'
  })
});
export type ReadMultipleFilesArgs = Static<typeof ReadMultipleFilesArgsSchema>;

// Note: WriteFileArgsSchema is used by both create_file and modify_file
export const WriteFileArgsSchema = Type.Object({
  path: Type.String(),
  content: Type.String(),
  // No maxBytes here as it's about writing, not reading limit
});
export type WriteFileArgs = Static<typeof WriteFileArgsSchema>;

export const EditOperation = Type.Object({
  oldText: Type.String({ description: 'Text to search for - must match exactly' }),
  newText: Type.String({ description: 'Text to replace with' })
});
export type EditOperationType = Static<typeof EditOperation>;

export const EditFileArgsSchema = Type.Object({
  path: Type.String(),
  edits: Type.Array(EditOperation),
  dryRun: Type.Boolean({
    default: false,
    description: 'Preview changes using git-style diff format'
  }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the file before editing. Must be a positive integer. Handler default: 10KB.'
  })
});
export type EditFileArgs = Static<typeof EditFileArgsSchema>;

export const GetFileInfoArgsSchema = Type.Object({
  path: Type.String(),
});
export type GetFileInfoArgs = Static<typeof GetFileInfoArgsSchema>;

export const MoveFileArgsSchema = Type.Object({
  source: Type.String(),
  destination: Type.String(),
});
export type MoveFileArgs = Static<typeof MoveFileArgsSchema>;

export const DeleteFileArgsSchema = Type.Object({
  path: Type.String(),
});
export type DeleteFileArgs = Static<typeof DeleteFileArgsSchema>;

export const RenameFileArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the file to be renamed' }),
  newName: Type.String({ description: 'New name for the file (without path)' })
});
export type RenameFileArgs = Static<typeof RenameFileArgsSchema>;

// Schemas previously defined in index.ts but related to other files (kept here for reference during refactor, but should be removed from index.ts)
// export const GetPermissionsArgsSchema = z.object({}); // Moved to utility-operations.ts
// export const CreateDirectoryArgsSchema = z.object({ path: z.string() }); // Moved to directory-operations.ts
// export const ListDirectoryArgsSchema = z.object({ path: z.string() }); // Moved to directory-operations.ts
// export const DirectoryTreeArgsSchema = z.object({ path: z.string() }); // Moved to directory-operations.ts
// export const SearchFilesArgsSchema = z.object({ path: z.string(), pattern: z.string(), excludePatterns: z.array(z.string()).optional().default([]) }); // Moved to utility-operations.ts
// export const FindFilesByExtensionArgsSchema = z.object({ path: z.string(), extension: z.string().describe('File extension...'), excludePatterns: z.array(z.string()).optional().default([]) }); // Moved to utility-operations.ts
// export const DeleteDirectoryArgsSchema = z.object({ path: z.string(), recursive: z.boolean().default(false).describe('Whether to recursively delete...') }); // Moved to directory-operations.ts
// export const XmlToJsonArgsSchema = z.object({ /* ... */ }); // Moved to utility-operations.ts
// export const XmlToJsonStringArgsSchema = z.object({ /* ... */ }); // Moved to utility-operations.ts
