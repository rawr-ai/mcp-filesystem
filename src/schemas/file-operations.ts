import { z } from "zod";
import { Type } from "@sinclair/typebox";

// Schema definitions moved from index.ts

// TypeBox schema used for tool definitions
export const ReadFileArgsSchema = Type.Object({
  path: Type.String(),
  maxBytes: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'
    })
  )
});

// Zod schema used for runtime validation
export const ReadFileArgsZod = z.object({
  path: z.string(),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.')
});

export const ReadMultipleFilesArgsSchema = Type.Object({
  paths: Type.Array(Type.String()),
  maxBytesPerFile: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: 'Maximum bytes to read per file. Must be a positive integer. Handler default: 10KB.'
    })
  )
});

export const ReadMultipleFilesArgsZod = z.object({
  paths: z.array(z.string()),
  maxBytesPerFile: z.number().int().positive().describe('Maximum bytes to read per file. Must be a positive integer. Handler default: 10KB.')
});

// Note: WriteFileArgsSchema is used by both create_file and modify_file
export const WriteFileArgsSchema = Type.Object({
  path: Type.String(),
  content: Type.String(),
});

export const WriteFileArgsZod = z.object({
  path: z.string(),
  content: z.string(),
  // No maxBytes here as it's about writing, not reading limit
});

export const EditOperation = Type.Object({
  oldText: Type.String({ description: 'Text to search for - must match exactly' }),
  newText: Type.String({ description: 'Text to replace with' })
});

export const EditOperationZod = z.object({
  oldText: z.string().describe('Text to search for - must match exactly'),
  newText: z.string().describe('Text to replace with')
});

export const EditFileArgsSchema = Type.Object({
  path: Type.String(),
  edits: Type.Array(EditOperation),
  dryRun: Type.Optional(Type.Boolean({ default: false, description: 'Preview changes using git-style diff format' })),
  maxBytes: Type.Integer({ minimum: 1, description: 'Maximum bytes to read from the file before editing. Must be a positive integer. Handler default: 10KB.' })
});

export const EditFileArgsZod = z.object({
  path: z.string(),
  edits: z.array(EditOperationZod),
  dryRun: z.boolean().default(false).describe('Preview changes using git-style diff format'),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the file before editing. Must be a positive integer. Handler default: 10KB.')
});

export const GetFileInfoArgsSchema = Type.Object({
  path: Type.String(),
});

export const GetFileInfoArgsZod = z.object({
  path: z.string(),
});

export const MoveFileArgsSchema = Type.Object({
  source: Type.String(),
  destination: Type.String(),
});

export const MoveFileArgsZod = z.object({
  source: z.string(),
  destination: z.string(),
});

export const DeleteFileArgsSchema = Type.Object({
  path: Type.String(),
});

export const DeleteFileArgsZod = z.object({
  path: z.string(),
});

export const RenameFileArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the file to be renamed' }),
  newName: Type.String({ description: 'New name for the file (without path)' })
});

export const RenameFileArgsZod = z.object({
  path: z.string().describe('Path to the file to be renamed'),
  newName: z.string().describe('New name for the file (without path)')
});

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