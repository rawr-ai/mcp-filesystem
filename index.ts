#!/usr/bin/env bun

import { FastMCP } from "fastmcp";
import fs from "fs/promises";
import path from "path";
import {
  expandHome,
  normalizePath,
  validatePath,
} from "./src/utils/path-utils.js";
import { toolSchemas } from "./src/schemas/index.js";
import { toStandardSchema } from "./src/utils/typebox-standard.js";
import {
  handleReadFile,
  handleReadMultipleFiles,
  handleCreateFile,
  handleModifyFile,
  handleEditFile,
  handleGetFileInfo,
  handleMoveFile,
  handleDeleteFile,
  handleRenameFile,
} from "./src/handlers/file-handlers.js";
import {
  handleCreateDirectory,
  handleListDirectory,
  handleDirectoryTree,
  handleDeleteDirectory,
} from "./src/handlers/directory-handlers.js";
import {
  handleSearchFiles,
  handleFindFilesByExtension,
  handleGetPermissions,
  handleXmlToJson,
  handleXmlToJsonString,
  handleListAllowedDirectories,
  handleRegexSearchContent,
} from "./src/handlers/utility-handlers.js";
import {
  handleXmlQuery,
  handleXmlStructure,
} from "./src/handlers/xml-handlers.js";
import {
  handleJsonQuery,
  handleJsonFilter,
  handleJsonGetValue,
  handleJsonTransform,
  handleJsonStructure,
  handleJsonSample,
  handleJsonValidate,
  handleJsonSearchKv,
} from "./src/handlers/json-handlers.js";

// parse command line
const args = process.argv.slice(2);
const readonlyFlag = args.includes("--readonly");
const noFollowSymlinks = args.includes("--no-follow-symlinks");
const fullAccessFlag = args.includes("--full-access");
const allowCreate = args.includes("--allow-create");
const allowEdit = args.includes("--allow-edit");
const allowMove = args.includes("--allow-move");
const allowDelete = args.includes("--allow-delete");
const allowRename = args.includes("--allow-rename");
const httpFlagIndex = args.indexOf("--http");
const useHttp = httpFlagIndex !== -1;
if (useHttp) args.splice(httpFlagIndex, 1);
let port = 8080;
const portIndex = args.indexOf("--port");
if (portIndex !== -1) {
  port = parseInt(args[portIndex + 1], 10);
  args.splice(portIndex, 2);
}

if (readonlyFlag) args.splice(args.indexOf("--readonly"), 1);
if (noFollowSymlinks) args.splice(args.indexOf("--no-follow-symlinks"), 1);
if (fullAccessFlag) args.splice(args.indexOf("--full-access"), 1);
if (allowCreate) args.splice(args.indexOf("--allow-create"), 1);
if (allowEdit) args.splice(args.indexOf("--allow-edit"), 1);
if (allowMove) args.splice(args.indexOf("--allow-move"), 1);
if (allowDelete) args.splice(args.indexOf("--allow-delete"), 1);
if (allowRename) args.splice(args.indexOf("--allow-rename"), 1);

const useCwdFlag = args.includes("--cwd");
if (useCwdFlag) {
  args.splice(args.indexOf("--cwd"), 1);
}

// If no explicit allowed directories, use cwd if --cwd was passed or no directory was passed at all
let allowedDirectories: string[];
if (args.length === 0 || useCwdFlag) {
  allowedDirectories = [normalizePath(process.cwd())];
} else {
  allowedDirectories = args.map((dir) =>
    normalizePath(path.resolve(expandHome(dir))),
  );
}

if (!useCwdFlag && args.length === 0) {
  console.warn(
    "No allowed directory specified. Using current working directory as root.",
  );
  console.warn(
    "Usage: mcp-server-filesystem [flags] <allowed-directory> [additional-directories...]\n       mcp-server-filesystem --cwd [flags]",
  );
}

// duplicate declaration removed; `allowedDirectories` already defined above
const symlinksMap = new Map<string, string>();

await Promise.all(
  allowedDirectories.map(async (dir) => {
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        console.error(`Error: ${dir} is not a directory`);
        process.exit(1);
      }
      try {
        const realPath = await fs.realpath(dir);
        if (realPath !== dir) {
          const normalizedDir = normalizePath(path.resolve(expandHome(dir)));
          const normalizedRealPath = normalizePath(realPath);
          symlinksMap.set(normalizedRealPath, normalizedDir);
          if (!allowedDirectories.includes(normalizedRealPath))
            allowedDirectories.push(normalizedRealPath);
          await validatePath(
            normalizedRealPath,
            allowedDirectories,
            symlinksMap,
            noFollowSymlinks,
          );
        }
        await validatePath(
          dir,
          allowedDirectories,
          symlinksMap,
          noFollowSymlinks,
        );
      } catch (error) {
        console.error(
          `Warning: Could not resolve real path for ${dir}:`,
          error,
        );
      }
    } catch (error) {
      console.error(`Error accessing directory ${dir}:`, error);
      process.exit(1);
    }
  }),
);

const permissions = {
  create: !readonlyFlag && (fullAccessFlag || allowCreate),
  edit: !readonlyFlag && (fullAccessFlag || allowEdit),
  move: !readonlyFlag && (fullAccessFlag || allowMove),
  delete: !readonlyFlag && (fullAccessFlag || allowDelete),
  rename: !readonlyFlag && (fullAccessFlag || allowRename),
  fullAccess: !readonlyFlag && fullAccessFlag,
};

const server = new FastMCP({
  name: "secure-filesystem-server",
  version: "0.2.0",
});

const toolHandlers = {
  read_file: (a: unknown) =>
    handleReadFile(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  read_multiple_files: (a: unknown) =>
    handleReadMultipleFiles(
      a,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  create_file: (a: unknown) =>
    handleCreateFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  modify_file: (a: unknown) =>
    handleModifyFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  edit_file: (a: unknown) =>
    handleEditFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  create_directory: (a: unknown) =>
    handleCreateDirectory(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  list_directory: (a: unknown) =>
    handleListDirectory(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  directory_tree: (a: unknown) =>
    handleDirectoryTree(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  move_file: (a: unknown) =>
    handleMoveFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  rename_file: (a: unknown) =>
    handleRenameFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  delete_directory: (a: unknown) =>
    handleDeleteDirectory(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  search_files: (a: unknown) =>
    handleSearchFiles(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  find_files_by_extension: (a: unknown) =>
    handleFindFilesByExtension(
      a,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  get_file_info: (a: unknown) =>
    handleGetFileInfo(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  list_allowed_directories: (a: unknown) =>
    handleListAllowedDirectories(a, allowedDirectories),
  get_permissions: (a: unknown) =>
    handleGetPermissions(
      a,
      permissions,
      readonlyFlag,
      noFollowSymlinks,
      allowedDirectories,
    ),
  xml_query: (a: unknown) =>
    handleXmlQuery(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  xml_structure: (a: unknown) =>
    handleXmlStructure(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  xml_to_json: (a: unknown) =>
    handleXmlToJson(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  xml_to_json_string: (a: unknown) =>
    handleXmlToJsonString(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  delete_file: (a: unknown) =>
    handleDeleteFile(
      a,
      permissions,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
  json_query: (a: unknown) =>
    handleJsonQuery(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_structure: (a: unknown) =>
    handleJsonStructure(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_filter: (a: unknown) =>
    handleJsonFilter(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_get_value: (a: unknown) =>
    handleJsonGetValue(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_transform: (a: unknown) =>
    handleJsonTransform(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_sample: (a: unknown) =>
    handleJsonSample(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_validate: (a: unknown) =>
    handleJsonValidate(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  json_search_kv: (a: unknown) =>
    handleJsonSearchKv(a, allowedDirectories, symlinksMap, noFollowSymlinks),
  regex_search_content: (a: unknown) =>
    handleRegexSearchContent(
      a,
      allowedDirectories,
      symlinksMap,
      noFollowSymlinks,
    ),
} as const;

const allTools = [
  { name: "read_file", description: "Read file contents" },
  { name: "read_multiple_files", description: "Read multiple files" },
  { name: "list_directory", description: "List directory contents" },
  { name: "directory_tree", description: "Directory tree view" },
  { name: "search_files", description: "Search files by name" },
  { name: "find_files_by_extension", description: "Find files by extension" },
  { name: "get_file_info", description: "Get file metadata" },
  { name: "list_allowed_directories", description: "List allowed directories" },
  { name: "get_permissions", description: "Get server permissions" },
  { name: "create_file", description: "Create a new file" },
  { name: "modify_file", description: "Replace file contents" },
  { name: "edit_file", description: "Edit part of a file" },
  { name: "create_directory", description: "Create a directory" },
  { name: "move_file", description: "Move a file" },
  { name: "rename_file", description: "Rename a file" },
  { name: "delete_directory", description: "Delete a directory" },
  { name: "xml_query", description: "Query XML" },
  { name: "xml_structure", description: "Analyze XML structure" },
  { name: "xml_to_json", description: "Convert XML to JSON" },
  { name: "xml_to_json_string", description: "XML to JSON string" },
  { name: "delete_file", description: "Delete a file" },
  { name: "json_query", description: "Query JSON" },
  { name: "json_structure", description: "JSON structure" },
  { name: "json_filter", description: "Filter JSON" },
  { name: "json_get_value", description: "Get value from JSON" },
  { name: "json_transform", description: "Transform JSON" },
  { name: "json_sample", description: "Sample JSON data" },
  { name: "json_validate", description: "Validate JSON" },
  { name: "json_search_kv", description: "Search key/value in JSON" },
  {
    name: "regex_search_content",
    description: "Search file content with regex",
  },
];

const tools = !permissions.fullAccess
  ? allTools.filter((t) => {
      if (
        [
          "read_file",
          "read_multiple_files",
          "list_directory",
          "directory_tree",
          "search_files",
          "find_files_by_extension",
          "get_file_info",
          "list_allowed_directories",
          "xml_to_json_string",
          "get_permissions",
          "xml_query",
          "xml_structure",
          "json_query",
          "json_filter",
          "json_get_value",
          "json_transform",
          "json_structure",
          "json_sample",
          "json_validate",
          "json_search_kv",
          "regex_search_content",
        ].includes(t.name)
      ) {
        return true;
      }
      if (
        permissions.create &&
        ["create_file", "create_directory", "xml_to_json"].includes(t.name)
      )
        return true;
      if (permissions.edit && ["modify_file", "edit_file"].includes(t.name))
        return true;
      if (permissions.move && t.name === "move_file") return true;
      if (permissions.rename && t.name === "rename_file") return true;
      if (
        permissions.delete &&
        ["delete_file", "delete_directory"].includes(t.name)
      )
        return true;
      return false;
    })
  : allTools;

for (const tool of tools) {
  const execute = toolHandlers[tool.name as keyof typeof toolHandlers];
  const schema = (toolSchemas as Record<string, any>)[tool.name];
  server.addTool({
    name: tool.name,
    description: tool.description,
    parameters: schema ? toStandardSchema(schema) : undefined,
    execute: async (a) => execute(a) as any,
  });
}

async function runServer() {
  if (useHttp) {
    await server.start({ transportType: "httpStream", httpStream: { port } });
    console.error(
      `Secure MCP Filesystem Server running on HTTP stream port ${port}`,
    );
  } else {
    await server.start({ transportType: "stdio" });
    console.error("Secure MCP Filesystem Server running on stdio");
  }
  console.error("Allowed directories:", allowedDirectories);
  const permState = [] as string[];
  if (readonlyFlag) {
    console.error(
      "Server running in read-only mode (--readonly flag overrides all other permissions)",
    );
  } else if (permissions.fullAccess) {
    console.error(
      "Server running with full access (all operations enabled via --full-access)",
    );
  } else {
    if (permissions.create) permState.push("create");
    if (permissions.edit) permState.push("edit");
    if (permissions.move) permState.push("move");
    if (permissions.rename) permState.push("rename");
    if (permissions.delete) permState.push("delete");
    if (permState.length === 0) {
      console.error(
        "Server running in default read-only mode (use --full-access or specific --allow-* flags to enable write operations)",
      );
    } else {
      console.error(
        `Server running with specific permissions enabled: ${permState.join(", ")}`,
      );
    }
  }
  if (noFollowSymlinks) {
    console.error("Server running with symlink following disabled");
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
