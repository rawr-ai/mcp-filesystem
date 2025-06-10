import { z } from "zod";
import { Type } from "@sinclair/typebox";

export const GetPermissionsArgsSchema = Type.Object({});
export const GetPermissionsArgsZod = z.object({});

export const SearchFilesArgsSchema = Type.Object({
  path: Type.String(),
  pattern: Type.String(),
  excludePatterns: Type.Optional(Type.Array(Type.String(), { default: [] })),
  maxDepth: Type.Integer({ minimum: 1, description: 'Maximum directory depth to search. Must be a positive integer. Handler default: 2.' }),
  maxResults: Type.Integer({ minimum: 1, description: 'Maximum number of results to return. Must be a positive integer. Handler default: 10.' })
});

export const SearchFilesArgsZod = z.object({
  path: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional().default([]),
  maxDepth: z.number().int().positive().describe('Maximum directory depth to search. Must be a positive integer. Handler default: 2.'),
  maxResults: z.number().int().positive().describe('Maximum number of results to return. Must be a positive integer. Handler default: 10.')
});

export const FindFilesByExtensionArgsSchema = Type.Object({
  path: Type.String(),
  extension: Type.String({ description: 'File extension to search for (e.g., "xml", "json", "ts")' }),
  excludePatterns: Type.Optional(Type.Array(Type.String(), { default: [] })),
  maxDepth: Type.Integer({ minimum: 1, description: 'Maximum directory depth to search. Must be a positive integer. Handler default: 2.' }),
  maxResults: Type.Integer({ minimum: 1, description: 'Maximum number of results to return. Must be a positive integer. Handler default: 10.' })
});

export const FindFilesByExtensionArgsZod = z.object({
  path: z.string(),
  extension: z.string().describe('File extension to search for (e.g., "xml", "json", "ts")'),
  excludePatterns: z.array(z.string()).optional().default([]),
  maxDepth: z.number().int().positive().describe('Maximum directory depth to search. Must be a positive integer. Handler default: 2.'),
  maxResults: z.number().int().positive().describe('Maximum number of results to return. Must be a positive integer. Handler default: 10.')
});

export const XmlToJsonArgsSchema = Type.Object({
  xmlPath: Type.String({ description: 'Path to the XML file to convert' }),
  jsonPath: Type.String({ description: 'Path where the JSON should be saved' }),
  maxBytes: Type.Integer({ minimum: 1, description: 'Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.' }),
  options: Type.Optional(Type.Object({
    ignoreAttributes: Type.Boolean({ default: false, description: 'Whether to ignore attributes in XML' }),
    preserveOrder: Type.Boolean({ default: true, description: 'Whether to preserve the order of properties' }),
    format: Type.Boolean({ default: true, description: 'Whether to format the JSON output' }),
    indentSize: Type.Integer({ default: 2, description: 'Number of spaces for indentation' })
  }, { default: {} }))
});

export const XmlToJsonArgsZod = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  jsonPath: z.string().describe('Path where the JSON should be saved'),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties'),
    format: z.boolean().default(true).describe('Whether to format the JSON output'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation')
  }).optional().default({})
});

export const XmlToJsonStringArgsSchema = Type.Object({
  xmlPath: Type.String({ description: 'Path to the XML file to convert' }),
  maxBytes: Type.Integer({ minimum: 1, description: 'Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.' }),
  options: Type.Optional(Type.Object({
    ignoreAttributes: Type.Boolean({ default: false, description: 'Whether to ignore attributes in XML' }),
    preserveOrder: Type.Boolean({ default: true, description: 'Whether to preserve the order of properties' })
  }, { default: {} }))
});

export const XmlToJsonStringArgsZod = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties')
  }).optional().default({})
});

export const XmlQueryArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the XML file to query' }),
  query: Type.Optional(Type.String({ description: 'XPath query to execute against the XML file' })),
  structureOnly: Type.Optional(Type.Boolean({ default: false, description: 'If true, returns only tag names and structure instead of executing query' })),
  maxBytes: Type.Integer({ minimum: 1, description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.' }),
  includeAttributes: Type.Optional(Type.Boolean({ default: true, description: 'Whether to include attribute information in the results' }))
});

export const XmlQueryArgsZod = z.object({
  path: z.string().describe('Path to the XML file to query'),
  query: z.string().optional().describe('XPath query to execute against the XML file'),
  structureOnly: z.boolean().optional().default(false)
    .describe('If true, returns only tag names and structure instead of executing query'),
  maxBytes: z.number().int().positive()
    .describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information in the results')
});

export const XmlStructureArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the XML file to analyze' }),
  maxDepth: Type.Integer({ minimum: 1, description: 'How deep to analyze the hierarchy. Must be a positive integer. Handler default: 2.' }),
  includeAttributes: Type.Optional(Type.Boolean({ default: true, description: 'Whether to include attribute information' })),
  maxBytes: Type.Integer({ minimum: 1, description: 'Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.' })
});

export const XmlStructureArgsZod = z.object({
  path: z.string().describe('Path to the XML file to analyze'),
  maxDepth: z.number().int().positive()
    .describe('How deep to analyze the hierarchy. Must be a positive integer. Handler default: 2.'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information'),
  maxBytes: z.number().int().positive()
    .describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.')
});

export const RegexSearchContentArgsSchema = Type.Object({
  path: Type.String({ description: 'Directory path to start the search from.' }),
  regex: Type.String({ description: 'The regular expression pattern to search for within file content.' }),
  filePattern: Type.Optional(Type.String({ default: '*', description: 'Glob pattern to filter files to search within (e.g., "*.ts", "data/**.json"). Defaults to searching all files.' })),
  maxDepth: Type.Optional(Type.Integer({ minimum: 1, default: 2, description: 'Maximum directory depth to search recursively. Defaults to 2.' })),
  maxFileSize: Type.Optional(Type.Integer({ minimum: 1, default: 10 * 1024 * 1024, description: 'Maximum file size in bytes to read for searching. Defaults to 10MB.' })),
  maxResults: Type.Optional(Type.Integer({ minimum: 1, default: 50, description: 'Maximum number of files with matches to return. Defaults to 50.' }))
});

export const RegexSearchContentArgsZod = z.object({
  path: z.string().describe('Directory path to start the search from.'),
  regex: z.string().describe('The regular expression pattern to search for within file content.'),
  filePattern: z.string().optional().default('*').describe('Glob pattern to filter files to search within (e.g., "*.ts", "data/**.json"). Defaults to searching all files.'),
  maxDepth: z.number().int().positive().optional().default(2).describe('Maximum directory depth to search recursively. Defaults to 2.'),
  maxFileSize: z.number().int().positive().optional().default(10 * 1024 * 1024).describe('Maximum file size in bytes to read for searching. Defaults to 10MB.'),
  maxResults: z.number().int().positive().optional().default(50).describe('Maximum number of files with matches to return. Defaults to 50.')
});