import { z } from "zod";

// Schema definitions moved from index.ts

export const ReadFileArgsSchema = z.object({
  path: z.string(),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.')
});

export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
  maxBytesPerFile: z.number().int().positive().describe('Maximum bytes to read per file. Must be a positive integer. Handler default: 10KB.')
});

// Note: WriteFileArgsSchema is used by both create_file and modify_file
export const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
  // No maxBytes here as it's about writing, not reading limit
});

export const EditOperation = z.object({
  oldText: z.string().describe('Text to search for - must match exactly'),
  newText: z.string().describe('Text to replace with')
});

export const EditFileArgsSchema = z.object({
  path: z.string(),
  edits: z.array(EditOperation),
  dryRun: z.boolean().default(false).describe('Preview changes using git-style diff format'),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the file before editing. Must be a positive integer. Handler default: 10KB.')
});

export const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

export const MoveFileArgsSchema = z.object({
  source: z.string(),
  destination: z.string(),
});

export const DeleteFileArgsSchema = z.object({
  path: z.string(),
});

export const RenameFileArgsSchema = z.object({
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