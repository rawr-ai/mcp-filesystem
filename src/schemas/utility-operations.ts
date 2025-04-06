import { z } from "zod";

export const GetPermissionsArgsSchema = z.object({});

export const SearchFilesArgsSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional().default([]),
  maxDepth: z.number().int().positive().describe('Maximum directory depth to search. Must be a positive integer. Handler default: 2.'),
  maxResults: z.number().int().positive().describe('Maximum number of results to return. Must be a positive integer. Handler default: 10.')
});

export const FindFilesByExtensionArgsSchema = z.object({
  path: z.string(),
  extension: z.string().describe('File extension to search for (e.g., "xml", "json", "ts")'),
  excludePatterns: z.array(z.string()).optional().default([]),
  maxDepth: z.number().int().positive().describe('Maximum directory depth to search. Must be a positive integer. Handler default: 2.'),
  maxResults: z.number().int().positive().describe('Maximum number of results to return. Must be a positive integer. Handler default: 10.')
});

export const XmlToJsonArgsSchema = z.object({
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

export const XmlToJsonStringArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  maxBytes: z.number().int().positive().describe('Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties')
  }).optional().default({})
});

export const XmlQueryArgsSchema = z.object({
  path: z.string().describe('Path to the XML file to query'),
  query: z.string().optional().describe('XPath query to execute against the XML file'),
  structureOnly: z.boolean().optional().default(false)
    .describe('If true, returns only tag names and structure instead of executing query'),
  maxBytes: z.number().int().positive()
    .describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information in the results')
});

export const XmlStructureArgsSchema = z.object({
  path: z.string().describe('Path to the XML file to analyze'),
  maxDepth: z.number().int().positive()
    .describe('How deep to analyze the hierarchy. Must be a positive integer. Handler default: 2.'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information'),
  maxBytes: z.number().int().positive()
    .describe('Maximum bytes to read from the file. Must be a positive integer. Handler default: 10KB.')
});

export const RegexSearchContentArgsSchema = z.object({
  path: z.string().describe('Directory path to start the search from.'),
  regex: z.string().describe('The regular expression pattern to search for within file content.'),
  filePattern: z.string().optional().default('*').describe('Glob pattern to filter files to search within (e.g., "*.ts", "data/**.json"). Defaults to searching all files.'),
  maxDepth: z.number().int().positive().optional().default(2).describe('Maximum directory depth to search recursively. Defaults to 2.'),
  maxFileSize: z.number().int().positive().optional().default(10 * 1024 * 1024).describe('Maximum file size in bytes to read for searching. Defaults to 10MB.'),
  maxResults: z.number().int().positive().optional().default(50).describe('Maximum number of files with matches to return. Defaults to 50.')
});