import { z } from "zod";

export const GetPermissionsArgsSchema = z.object({});

export const SearchFilesArgsSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional().default([])
});

export const FindFilesByExtensionArgsSchema = z.object({
  path: z.string(),
  extension: z.string().describe('File extension to search for (e.g., "xml", "json", "ts")'),
  excludePatterns: z.array(z.string()).optional().default([])
});

export const XmlToJsonArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  jsonPath: z.string().describe('Path where the JSON should be saved'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties'),
    format: z.boolean().default(true).describe('Whether to format the JSON output'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation')
  }).optional().default({})
});

export const XmlToJsonStringArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties')
  }).optional().default({})
}); 