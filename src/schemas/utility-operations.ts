import { Type, Static } from "@sinclair/typebox";

export const GetPermissionsArgsSchema = Type.Object({});
export type GetPermissionsArgs = Static<typeof GetPermissionsArgsSchema>;

export const SearchFilesArgsSchema = Type.Object({
  path: Type.String(),
  pattern: Type.String(),
  excludePatterns: Type.Optional(
    Type.Array(Type.String(), { default: [] })
  ),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'Maximum directory depth to search. Must be a positive integer. Handler default: 2.'
  }),
  maxResults: Type.Integer({
    minimum: 1,
    description: 'Maximum number of results to return. Must be a positive integer. Handler default: 10.'
  })
});
export type SearchFilesArgs = Static<typeof SearchFilesArgsSchema>;

export const FindFilesByExtensionArgsSchema = Type.Object({
  path: Type.String(),
  extension: Type.String({ description: 'File extension to search for (e.g., "xml", "json", "ts")' }),
  excludePatterns: Type.Optional(
    Type.Array(Type.String(), { default: [] })
  ),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'Maximum directory depth to search. Must be a positive integer. Handler default: 2.'
  }),
  maxResults: Type.Integer({
    minimum: 1,
    description: 'Maximum number of results to return. Must be a positive integer. Handler default: 10.'
  })
});
export type FindFilesByExtensionArgs = Static<typeof FindFilesByExtensionArgsSchema>;

export const XmlToJsonArgsSchema = Type.Object({
  xmlPath: Type.String({ description: 'Path to the XML file to convert' }),
  jsonPath: Type.String({ description: 'Path where the JSON should be saved' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.'
  }),
  options: Type.Optional(
    Type.Object({
      ignoreAttributes: Type.Boolean({ default: false, description: 'Whether to ignore attributes in XML' }),
      preserveOrder: Type.Boolean({ default: true, description: 'Whether to preserve the order of properties' }),
      format: Type.Boolean({ default: true, description: 'Whether to format the JSON output' }),
      indentSize: Type.Number({ default: 2, description: 'Number of spaces for indentation' })
    }, { default: {} })
  )
});
export type XmlToJsonArgs = Static<typeof XmlToJsonArgsSchema>;

export const XmlToJsonStringArgsSchema = Type.Object({
  xmlPath: Type.String({ description: 'Path to the XML file to convert' }),
  maxBytes: Type.Integer({
    minimum: 1,
    description: 'Maximum bytes to read from the XML file. Must be a positive integer. Handler default: 10KB.'
  }),
  options: Type.Optional(
    Type.Object({
      ignoreAttributes: Type.Boolean({ default: false, description: 'Whether to ignore attributes in XML' }),
      preserveOrder: Type.Boolean({ default: true, description: 'Whether to preserve the order of properties' })
    }, { default: {} })
  )
});
export type XmlToJsonStringArgs = Static<typeof XmlToJsonStringArgsSchema>;

export const XmlQueryArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the XML file to query' }),
  query: Type.Optional(Type.String({ description: 'XPath query to execute against the XML file' })),
  structureOnly: Type.Optional(Type.Boolean({ default: false, description: 'If true, returns only tag names and structure instead of executing query' })),
  maxBytes: Type.Optional(Type.Integer({
    minimum: 1,
    description: '[Deprecated semantics] Previously limited file bytes read; now treated as a response size cap in bytes.'
  })),
  maxResponseBytes: Type.Optional(Type.Integer({
    minimum: 1,
    description: 'Maximum size, in bytes, of the returned content. Parsing reads full file; response may be truncated to respect this limit.'
  })),
  includeAttributes: Type.Optional(Type.Boolean({ default: true, description: 'Whether to include attribute information in the results' }))
});
export type XmlQueryArgs = Static<typeof XmlQueryArgsSchema>;

export const XmlStructureArgsSchema = Type.Object({
  path: Type.String({ description: 'Path to the XML file to analyze' }),
  maxDepth: Type.Integer({
    minimum: 1,
    description: 'How deep to analyze the hierarchy. Must be a positive integer. Handler default: 2.'
  }),
  includeAttributes: Type.Optional(Type.Boolean({ default: true, description: 'Whether to include attribute information' })),
  maxBytes: Type.Optional(Type.Integer({
    minimum: 1,
    description: '[Deprecated semantics] Previously limited file bytes read; now treated as a response size cap in bytes.'
  })),
  maxResponseBytes: Type.Optional(Type.Integer({
    minimum: 1,
    description: 'Maximum size, in bytes, of the returned content. Parsing reads full file; response may be truncated to respect this limit.'
  }))
});
export type XmlStructureArgs = Static<typeof XmlStructureArgsSchema>;

export const RegexSearchContentArgsSchema = Type.Object({
  path: Type.String({ description: 'Directory path to start the search from.' }),
  regex: Type.String({ description: 'The regular expression pattern to search for within file content.' }),
  filePattern: Type.Optional(Type.String({ default: '*', description: 'Glob pattern to filter files to search within (e.g., "*.ts", "data/**.json"). Defaults to searching all files.' })),
  maxDepth: Type.Optional(Type.Integer({ minimum: 1, default: 2, description: 'Maximum directory depth to search recursively. Defaults to 2.' })),
  maxFileSize: Type.Optional(Type.Integer({ minimum: 1, default: 10 * 1024 * 1024, description: 'Maximum file size in bytes to read for searching. Defaults to 10MB.' })),
  maxResults: Type.Optional(Type.Integer({ minimum: 1, default: 50, description: 'Maximum number of files with matches to return. Defaults to 50.' }))
});
export type RegexSearchContentArgs = Static<typeof RegexSearchContentArgsSchema>;
