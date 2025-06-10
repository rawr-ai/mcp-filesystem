import { Type, Static, TSchema } from '@sinclair/typebox';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import * as FileSchemas from './file-operations.js';
import * as DirSchemas from './directory-operations.js';
import * as UtilSchemas from './utility-operations.js';
import * as JsonSchemas from './json-operations.js';

function toTypeBox<T extends z.ZodTypeAny>(schema: T): TSchema {
  return Type.Unsafe<z.infer<T>>(zodToJsonSchema(schema));
}

export const toolSchemas = {
  read_file: toTypeBox(FileSchemas.ReadFileArgsSchema),
  read_multiple_files: toTypeBox(FileSchemas.ReadMultipleFilesArgsSchema),
  list_directory: toTypeBox(DirSchemas.ListDirectoryArgsSchema),
  directory_tree: toTypeBox(DirSchemas.DirectoryTreeArgsSchema),
  search_files: toTypeBox(UtilSchemas.SearchFilesArgsSchema),
  find_files_by_extension: toTypeBox(UtilSchemas.FindFilesByExtensionArgsSchema),
  get_file_info: toTypeBox(FileSchemas.GetFileInfoArgsSchema),
  list_allowed_directories: Type.Object({}),
  get_permissions: toTypeBox(UtilSchemas.GetPermissionsArgsSchema),
  create_file: toTypeBox(FileSchemas.WriteFileArgsSchema),
  modify_file: toTypeBox(FileSchemas.WriteFileArgsSchema),
  edit_file: toTypeBox(FileSchemas.EditFileArgsSchema),
  create_directory: toTypeBox(DirSchemas.CreateDirectoryArgsSchema),
  move_file: toTypeBox(FileSchemas.MoveFileArgsSchema),
  rename_file: toTypeBox(FileSchemas.RenameFileArgsSchema),
  xml_query: toTypeBox(UtilSchemas.XmlQueryArgsSchema),
  xml_structure: toTypeBox(UtilSchemas.XmlStructureArgsSchema),
  xml_to_json: toTypeBox(UtilSchemas.XmlToJsonArgsSchema),
  xml_to_json_string: toTypeBox(UtilSchemas.XmlToJsonStringArgsSchema),
  delete_file: toTypeBox(FileSchemas.DeleteFileArgsSchema),
  delete_directory: toTypeBox(DirSchemas.DeleteDirectoryArgsSchema),
  json_query: toTypeBox(JsonSchemas.JsonQueryArgsSchema),
  json_structure: toTypeBox(JsonSchemas.JsonStructureArgsSchema),
  json_filter: toTypeBox(JsonSchemas.JsonFilterArgsSchema),
  json_get_value: toTypeBox(JsonSchemas.JsonGetValueArgsSchema),
  json_transform: toTypeBox(JsonSchemas.JsonTransformArgsSchema),
  json_sample: toTypeBox(JsonSchemas.JsonSampleArgsSchema),
  json_validate: toTypeBox(JsonSchemas.JsonValidateArgsSchema),
  json_search_kv: toTypeBox(JsonSchemas.JsonSearchKvArgsSchema),
  regex_search_content: toTypeBox(UtilSchemas.RegexSearchContentArgsSchema),
} as const;

export type ToolArgsMap = {
  [K in keyof typeof toolSchemas]: Static<(typeof toolSchemas)[K]>;
};

export {
  FileSchemas,
  DirSchemas,
  UtilSchemas,
  JsonSchemas,
};
