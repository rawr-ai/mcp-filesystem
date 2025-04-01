This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **/dist/**, **/node_modules/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
.ai/
  rules/
    filesystem-mcp-server-usage.md
.cursor/
  rules/
    graphiti/
      graphiti-filesystem-schema.mdc
    creating-cursor-rules.mdc
  mcp.json
ai/
  graph/
    entities/
      Tool.py
    mcp-config.yaml
src/
  config/
    permissions.ts
  handlers/
    directory-handlers.ts
    file-handlers.ts
    index.ts
    json-handlers.ts
    utility-handlers.ts
    xml-handlers.ts
  schemas/
    directory-operations.ts
    file-operations.ts
    index.ts
    json-operations.ts
    utility-operations.ts
  utils/
    file-utils.ts
    path-utils.ts
test/
  json/
    users.json
  sample.xml
.gitignore
.repomixignore
Dockerfile
index.ts
package.json
README.md
repomix.config.json
tsconfig.json
```

# Files

## File: .cursor/rules/graphiti/graphiti-filesystem-schema.mdc
`````
---
description: Use this rule when working specifically within the 'filesystem' project context to understand its unique entities, relationships, and extraction guidelines.
globs: # Add relevant globs for your project files, e.g., src/**/*.py
alwaysApply: false
---

# Graphiti Schema: filesystem Project

This document outlines the specific knowledge graph schema for the 'filesystem' project.

**Core Rules Reference:** For general Graphiti tool usage and foundational entity extraction principles, refer to `@graphiti-mcp-core-rules.mdc`.

**Maintenance:** For rules on how to update *this* schema file, refer to `@graphiti-knowledge-graph-maintenance.mdc`.

---

## 1. Defined Entity Types

*Add definitions for entities specific to the 'filesystem' project here.*
*Reference the entity definition files (e.g., Python classes) if applicable.*

Example:
*   **`MyEntity`**: Description of what this entity represents.
    *   Reference: `@path/to/your/entity/definition.py` (if applicable)
    *   Fields: `field1` (type), `field2` (type)

---

## 2. Defined Relationships (Facts)

*Define the key relationships (subject-predicate-object triples) specific to 'filesystem'.*

Example:
*   **Subject:** `MyEntity`
*   **Predicate:** `RELATED_TO`
*   **Object:** `AnotherEntity`

    *Example Fact:* `(MyEntity: 'Instance A') --[RELATED_TO]-> (AnotherEntity: 'Instance B')`
    *Extraction Rule:* Briefly describe how to identify this relationship.

---

## 3. Project-Specific Extraction Guidelines

*Add any extraction rules or nuances unique to the 'filesystem' project.*
*These guidelines supplement or specialize instructions in entity definitions and core rules.*

Example:
*   **Handling Ambiguity:** How to resolve conflicts when multiple potential entities match.
*   **Inference Rules:** Conditions under which properties can be inferred.

---

## 4. Future Evolution

*Briefly mention potential future directions or areas for schema expansion.*
`````

## File: ai/graph/entities/Tool.py
`````python
"""Example of how to create a custom entity type for Graphiti MCP Server."""

from pydantic import BaseModel, Field


class Tool(BaseModel):
    """
    **AI Persona:** You are an expert entity extraction assistant.
    
    **Task:** Identify and extract information about Tool entities mentioned in the provided text context.
    A Tool represents a specific good or service that a company offers.

    **Context:** The user will provide text containing potential mentions of products.

    **Extraction Instructions:**
    Your goal is to accurately populate the fields (`name`, `description`, `category`) 
    based *only* on information explicitly or implicitly stated in the text.

    1.  **Identify Core Mentions:** Look for explicit mentions of commercial goods or services.
    2.  **Extract Name:** Identify Tool names, especially proper nouns, capitalized words, or terms near trademark symbols (™, ®).
    3.  **Extract Description:** Synthesize a concise description using details about features, purpose, pricing, or availability found *only* in the text.
    4.  **Extract Category:** Determine the product category (e.g., "Software", "Hardware", "Service") based on the description or explicit mentions.
    5.  **Refine Details:** Pay attention to specifications, technical details, stated benefits, unique selling points, variations, or models mentioned, and incorporate relevant details into the description.
    6.  **Handle Ambiguity:** If information for a field is missing or unclear in the text, indicate that rather than making assumptions.

    **Output Format:** Respond with the extracted data structured according to this Pydantic model.
    """

    name: str = Field(
        ...,
        description='The specific name of the product as mentioned in the text.',
    )
    description: str = Field(
        ...,
        description='A concise description of the Tool, synthesized *only* from information present in the provided text context.',
    )
    category: str = Field(
        ...,
        description='The category the Tool belongs to (e.g., "Electronics", "Software", "Service") based on the text.',
    )
`````

## File: ai/graph/mcp-config.yaml
`````yaml
# Configuration for project: filesystem
services:
  - id: filesystem-main  # Service ID (used for default naming)
    # container_name: "custom-name"  # Optional: Specify custom container name
    # port_default: 8001             # Optional: Specify custom host port
    group_id: "filesystem"       # Graph group ID
    entity_dir: "entities"           # Relative path to entity definitions within ai/graph
    # environment:                   # Optional: Add non-secret env vars here
    #   MY_FLAG: "true"
`````

## File: .repomixignore
`````
# Add patterns to ignore here, one per line
# Example:
# *.log
# tmp/
`````

## File: repomix.config.json
`````json
{
  "output": {
    "filePath": "mcp-filesystem-repo.md",
    "style": "markdown",
    "parsableStyle": false,
    "fileSummary": true,
    "directoryStructure": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "compress": false,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "copyToClipboard": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": [
      "**/dist/**",
      "**/node_modules/**"
    ]
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
`````

## File: .ai/rules/filesystem-mcp-server-usage.md
`````markdown
---
description: Guide on using the filesystem MCP server, covering capabilities, permissions, security, use-cases, and efficient tool chaining. Consult before performing filesystem operations.
globs: 
alwaysApply: false
---

# Guide: Using the Filesystem MCP Server

This document provides guidance on interacting with the `mcp-filesystem` server, which facilitates secure and permission-controlled access to the local filesystem via the Model Context Protocol (MCP).

## Overview

The `mcp-filesystem` server is a Node.js application that exposes filesystem operations as MCP tools. It operates within a sandboxed environment, restricting actions to pre-configured directories and enforcing specific permissions.

## Core Capabilities (Tools)

The server offers a range of tools for interacting with files and directories:

**Reading:**
*   `read_file`: Reads the entire content of a single file.
*   `read_multiple_files`: Reads content from multiple files simultaneously.

**Writing & Creation:**
*   `create_file`: Creates a new file with specified content. Requires `create` permission. Fails if the file exists.
*   `modify_file`: Overwrites an existing file with new content. Requires `edit` permission. Fails if the file doesn't exist.
*   `edit_file`: Makes targeted changes to specific parts of a text file while preserving the rest. Requires `edit` permission.

**Deletion:**
*   `delete_file`: Deletes a specific file. Requires `delete` permission.
*   `delete_directory`: Deletes a directory (potentially recursively). Requires `delete` permission.

**Moving & Renaming:**
*   `move_file`: Moves or renames a file or directory. Requires `move` permission.
*   `rename_file`: Renames a file. Requires `rename` permission.

**Listing & Exploration:**
*   `list_directory`: Lists the contents of a directory.
*   `directory_tree`: Provides a tree-like view of a directory structure.

**Searching:**
*   `search_files`: Finds files based on name patterns.
*   `find_files_by_extension`: Finds all files with a specific extension.

**Metadata:**
*   `get_file_info`: Retrieves information about a file or directory (size, type, timestamps).

**System Information:**
*   `list_allowed_directories`: Returns the list of directories that the server is allowed to access.
*   `get_permissions`: Returns the current permission state of the server.

**XML Operations:**
*   `xml_query`: Queries XML file using XPath expressions.
*   `xml_structure`: Analyzes XML file structure.
*   `xml_to_json`: Converts XML file to JSON format and optionally saves to a file.
*   `xml_to_json_string`: Converts XML file to a JSON string and returns it directly.

**JSON Operations:**
*   `json_query`: Queries JSON data using JSONPath expressions.
*   `json_structure`: Gets the structure of a JSON file.
*   `json_filter`: Filters JSON array data using flexible conditions.
*   `json_get_value`: Gets a specific value from a JSON file.
*   `json_transform`: Transforms JSON data using sequence operations.
*   `json_sample`: Samples JSON data from a JSON file.
*   `json_validate`: Validates JSON data against a JSON schema.
*   `json_search_kv`: Searches for key-value pairs in a JSON file.

## Permissions Model

Understanding the active permissions for the server instance is **critical** before attempting operations, especially write operations.

*   **Default:** If no permission flags are specified, the server operates in **read-only** mode.
*   `--readonly`: Explicitly sets read-only mode. **This flag overrides all other permission flags.**
*   `--full-access`: Grants permission for **all** operations (read, create, edit, move, rename, delete).
*   `--allow-create`: Grants permission to create files/directories.
*   `--allow-edit`: Grants permission to modify files.
*   `--allow-move`: Grants permission to move files/directories.
*   `--allow-rename`: Grants permission to rename files/directories.
*   `--allow-delete`: Grants permission to delete files/directories.

**Action:** Always check the server configuration (usually in `.cursor/mcp.json`) to identify the specific server instance being used (e.g., `mcp-test-readonly`, `filesystem`) and determine its active permissions (`--readonly`, `--full-access`, `--allow-*`) and allowed directories. **Do not assume write permissions are available.**

## Security Considerations

*   **Sandboxing:** All operations are strictly confined to the directories specified when the server was launched. Path traversal outside these directories is prevented.
*   **Symlinks:** By default, the server might follow symbolic links. If the `--no-follow-symlinks` flag is used, the server will refuse to operate on or through symlinks, enhancing security. Check the server configuration.
*   **Path Validation:** Input paths are normalized and validated against the allowed directories.
*   **Large File Handling:** Always check file size with `get_file_info` before reading file contents to prevent memory issues with large files. Consider using alternative approaches for very large files, such as targeted searches or incremental processing.
*   **Large Directory Trees:** Use extreme caution when requesting directory trees, especially for root directories or large project folders. Always use `get_file_info` first to check the directory size and entry count. For large directories (e.g., >1000 entries), prefer targeted `list_directory` operations or use search with specific patterns instead of full tree traversal.

## Common Use Cases

*   Reading configuration or data files.
*   Modifying source code within a designated project directory.
*   Creating new components or modules.
*   Searching for specific functions, variables, or text across project files.
*   Refactoring code by moving or renaming files/directories.
*   Cleaning up temporary files or build artifacts.
*   Analyzing the structure of a project directory.

## Efficient Tool Chaining & Workflows

Combine tools strategically for efficient task execution:

1.  **Exploration & Reading:**
    *   Start with `list_directory` to see directory contents.
    *   **Always use `get_file_info` first** to:
        - Check if a path exists and its type (file/directory)
        - Verify file sizes before reading contents
        - Check directory entry counts before requesting trees
    *   For large files (e.g., >5MB), consider if you actually need the entire file content or if targeted operations would be more efficient.
    *   For directories:
        - Start with non-recursive `list_directory` to assess directory size
        - Only use `directory_tree` for manageable directories (<1000 entries)
        - For large directories, use targeted `list_directory` operations
        - Consider using search operations instead of full tree traversal
    *   Use `read_file` for single files or `read_multiple_files` for several files identified via listing/searching.

2.  **Searching:**
    *   Use `search_files` to locate files by name/pattern.
    *   Use `find_files_by_extension` to find files of a specific type.
    *   Follow up with `read_file` or `read_multiple_files` on the search results.

3.  **Modification (Requires Permissions):**
    *   **Verify Permissions:** Check permissions with `get_permissions` first.
    *   Use `get_file_info` to confirm the file exists before attempting modification.
    *   Use `modify_file` for simple overwrites or `edit_file` for targeted changes.
    *   Consider reading the file (`read_file`) first if the modification depends on existing content.

4.  **Creation (Requires Permissions):**
    *   **Verify Permissions:** Check permissions with `get_permissions`.
    *   Use `get_file_info` to ensure the file/directory *does not* already exist.
    *   Use `create_file` or `create_directory`.

5.  **Refactoring (Requires Permissions):**
    *   **Verify Permissions:** Check permissions with `get_permissions`.
    *   Use `list_directory` to identify targets.
    *   Use `move_file` or `rename_file`. Use `get_file_info` first to confirm the source exists and the target doesn't (if renaming/moving to a specific new name).

6.  **Deletion (Requires Permissions):**
    *   **Verify Permissions:** Check permissions with `get_permissions`.
    *   Use `get_file_info` to confirm the target exists.
    *   Use `delete_file` or `delete_directory`. Be cautious with recursive directory deletion.

## Summary

Before using the filesystem server:
1.  **Identify the specific server instance** configured (e.g., in `.cursor/mcp.json`).
2.  **Check its configured allowed directories** using `list_allowed_directories`.
3.  **Check its active permissions** using `get_permissions`.
4.  **Check metadata before heavy operations:**
    - File sizes before reading contents
    - Directory entry counts before tree traversal
5.  **Choose the appropriate tool(s)** for the task.
6.  **Respect the sandbox** and permissions. Do not attempt operations known to be disallowed.
`````

## File: .cursor/rules/creating-cursor-rules.mdc
`````
---
description: Describes how to create or modify cursor rules. Use when the user asks you to create or modify new cursor rules.
globs: 
alwaysApply: false
---

# MDC File Format Guide

MDC (Markdown Configuration) files are used by Cursor to provide context-specific instructions to AI assistants. This guide explains how to create and maintain these files properly.

## File Structure

Each MDC file consists of two main parts:

1. **Frontmatter** - Configuration metadata at the top of the file
2. **Markdown Content** - The actual instructions in Markdown format

### Frontmatter

The frontmatter must be the first thing in the file and must be enclosed between triple-dash lines (`---`). Configuration should be based on the intended behavior:

```
---
# Configure your rule based on desired behavior:

description: Brief description of what the rule does and when it should be used
globs: **/*.js, **/*.ts  # Optional: Comma-separated list, not an array
alwaysApply: false       # Set to true for global rules
---
```

> **Important**: Despite the appearance, the frontmatter is not strictly YAML formatted. The `globs` field is a comma-separated list and should NOT include brackets `[]` or quotes `"`.

#### Guidelines for Setting Fields

> **IMPORTANT**: each of the three below are mutually exclusive. All of them can and should be included, but only one will be used at a time to determine how the rule is invoked. The user will select which method will be used.

- **description**: Should be agent-friendly, concisely describe what the rule is about, and clearly describe when the rule should be invoked. Format as `<topic>: <details>` for best results.
- **globs**:
  - If a rule is only relevant in very specific situations, leave globs empty so it's loaded only when applicable to the user request.
  - If the only glob would match all files (like `**/*`), leave it empty and set `alwaysApply: true` instead.
  - Otherwise, be as specific as possible with glob patterns to ensure rules are only applied with relevant files.
- **alwaysApply**: Use sparingly for truly global guidelines.

#### Glob Pattern Examples

- **/*.js - All JavaScript files
- src/**/*.jsx - in the src directory
- **/components/**/*.vue - All Vue files in any components directory

### Markdown Content

After the frontmatter, the rest of the file should be valid Markdown:

```markdown
# Title of Your Rule

## Section 1
- Guidelines and information
- Code examples

## Section 2
More detailed information...
```

## Special Features

### File References

You can reference other files from within an MDC file using the markdown link syntax:

```
@rule-name.mdc
```

When this rule is activated, the referenced file will also be included in the context.

### Code Blocks

Use fenced code blocks for examples:

````markdown
```javascript
// Example code
function example() {
  return "This is an example";
}
```
````

## Best Practices

1. **Clear Organization**
   - Use numbered prefixes (e.g., `01-workflow.mdc`) for sorting rules logically
   - Place task-specific rules in the `tasks/` subdirectory
   - Use descriptive filenames that indicate the rule's purpose

2. **Frontmatter Specificity**
   - Be specific with glob patterns to ensure rules are only applied in relevant contexts
   - Use `alwaysApply: true` for truly global guidelines
   - Make descriptions clear and concise so AI knows when to apply the rule

3. **Content Structure**
   - Start with a clear title (H1)
   - Use hierarchical headings (H2, H3, etc.) to organize content
   - Include examples where appropriate
   - Keep instructions clear and actionable

4. **File Size Considerations**
   - Keep files focused on a single topic or closely related topics
   - Split very large rule sets into multiple files and link them with references
   - Aim for under 300 lines per file when possible

## Usage in Cursor

When working with files in Cursor, rules are automatically applied when:

're working on matches a rule's glob pattern
2. A rule has `alwaysApply: true` set in its frontmatter
3. The agent thinks the rule's description matches the user request
4. You explicitly reference a rule in a conversation with Cursor's AI

## Creating/Renaming/Removing Rules

   - When a rule file is added/renamed/removed, update also the list under 010-workflow.mdc.
   - When changs are made to multiple `mdc` files from a single request, review also @999-mdc-format) to consider whether to update it too.

## Updating Rules

When updating existing rules:

1. Maintain the frontmatter format
2. Keep the same glob patterns unless intentionally changing the rule's scope
3. Update the description if the purpose of the rule changes
4. Consider whether changes should propagate to related rules (e.g., CE versions)
`````

## File: src/handlers/directory-handlers.ts
`````typescript
import fs from 'fs/promises';
import path from 'path';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import {
  CreateDirectoryArgsSchema,
  ListDirectoryArgsSchema,
  DirectoryTreeArgsSchema,
  DeleteDirectoryArgsSchema
} from '../schemas/directory-operations.js';

interface TreeEntry {
  name: string;
  type: 'file' | 'directory';
  children?: TreeEntry[];
}

export async function handleCreateDirectory(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = CreateDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for create_directory: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.create && !permissions.fullAccess) {
    throw new Error('Cannot create directory: create permission not granted (requires --allow-create)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  await fs.mkdir(validPath, { recursive: true });
  return {
    content: [{ type: "text", text: `Successfully created directory ${parsed.data.path}` }],
  };
}

export async function handleListDirectory(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ListDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for list_directory: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const entries = await fs.readdir(validPath, { withFileTypes: true });
  const formatted = entries
    .map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`)
    .join("\n");
  return {
    content: [{ type: "text", text: formatted }],
  };
}

export async function handleDirectoryTree(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DirectoryTreeArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for directory_tree: ${parsed.error}`);
  }

  async function buildTree(currentPath: string): Promise<TreeEntry[]> {
    const validPath = await validatePath(currentPath, allowedDirectories, symlinksMap, noFollowSymlinks);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
    const result: TreeEntry[] = [];

    for (const entry of entries) {
      const entryData: TreeEntry = {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file'
      };

      if (entry.isDirectory()) {
        const subPath = path.join(currentPath, entry.name);
        entryData.children = await buildTree(subPath);
      }

      result.push(entryData);
    }

    return result;
  }

  const treeData = await buildTree(parsed.data.path);
  return {
    content: [{
      type: "text",
      text: JSON.stringify(treeData, null, 2)
    }],
  };
}

export async function handleDeleteDirectory(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DeleteDirectoryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for delete_directory: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.delete && !permissions.fullAccess) {
    throw new Error('Cannot delete directory: delete permission not granted (requires --allow-delete)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    if (parsed.data.recursive) {
      // Safety confirmation for recursive delete
      await fs.rm(validPath, { recursive: true, force: true });
      return {
        content: [{ type: "text", text: `Successfully deleted directory ${parsed.data.path} and all its contents` }],
      };
    } else {
      // Non-recursive directory delete
      await fs.rmdir(validPath);
      return {
        content: [{ type: "text", text: `Successfully deleted directory ${parsed.data.path}` }],
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('ENOTEMPTY')) {
      throw new Error(`Cannot delete directory: directory is not empty. Use recursive=true to delete with contents.`);
    }
    throw new Error(`Failed to delete directory: ${msg}`);
  }
}
`````

## File: src/handlers/xml-handlers.ts
`````typescript
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { Transform } from 'stream';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import { validatePath } from '../utils/path-utils.js';
import { XmlQueryArgsSchema, XmlStructureArgsSchema } from '../schemas/utility-operations.js';

// Define interfaces for type safety
interface XmlNode {
  type: 'element' | 'text' | 'attribute' | 'unknown';
  name?: string;
  value?: string;
  attributes?: Array<{ name: string; value: string }>;
  children?: XmlNode[];
  nodeType?: number;
}

/**
 * Handler for executing XPath queries on XML files
 */
export async function handleXmlQuery(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const parsed = XmlQueryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_query: ${parsed.error}`);
  }

  const validPath = await validatePath(
    parsed.data.path,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks
  );

  try {
    // Create a streaming parser to handle large files
    const stream = createReadStream(validPath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024, // 64KB chunks
      end: parsed.data.maxBytes - 1
    });

    return new Promise((resolve, reject) => {
      let xmlContent = '';
      
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          xmlContent += chunk;
          callback();
        }
      });

      stream.pipe(transform)
        .on('finish', () => {
          try {
            const result = processXmlContent(
              xmlContent,
              parsed.data.query,
              parsed.data.structureOnly,
              parsed.data.includeAttributes
            );
            resolve(result);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to process XML: ${errorMessage}`));
          }
        })
        .on('error', reject);
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to query XML file: ${errorMessage}`);
  }
}

/**
 * Handler for extracting XML structure information
 */
export async function handleXmlStructure(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const parsed = XmlStructureArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_structure: ${parsed.error}`);
  }

  const validPath = await validatePath(
    parsed.data.path,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks
  );

  try {
    let xmlContent = '';
    const stream = createReadStream(validPath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024,
      end: parsed.data.maxBytes - 1
    });

    return new Promise((resolve, reject) => {
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          xmlContent += chunk;
          callback();
        }
      });

      stream.pipe(transform)
        .on('finish', () => {
          try {
            const parser = new DOMParser({
              errorHandler: {
                warning: () => {},
                error: (msg: string) => console.error(`XML parsing error: ${msg}`),
                fatalError: (msg: string) => { throw new Error(`Fatal XML parsing error: ${msg}`); }
              }
            });
            
            const doc = parser.parseFromString(xmlContent, 'text/xml');
            const structure = extractXmlStructure(
              doc,
              parsed.data.depth,
              parsed.data.includeAttributes
            );

            resolve({
              content: [{
                type: "text",
                text: JSON.stringify(structure, null, 2)
              }]
            });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to extract XML structure: ${errorMessage}`));
          }
        })
        .on('error', reject);
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to analyze XML structure: ${errorMessage}`);
  }
}

/**
 * Process XML content with XPath or structure analysis
 */
function processXmlContent(
  xmlContent: string,
  query?: string,
  structureOnly = false,
  includeAttributes = true
): { content: Array<{ type: string; text: string }> } {
  const parser = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: (msg: string) => console.error(`XML parsing error: ${msg}`),
      fatalError: (msg: string) => { throw new Error(`Fatal XML parsing error: ${msg}`); }
    }
  });

  const doc = parser.parseFromString(xmlContent, 'text/xml');

  if (structureOnly) {
    // Extract only structure information
    const tags = new Set<string>();
    const structureQuery = "//*";
    const nodes = xpath.select(structureQuery, doc);
    
    if (!Array.isArray(nodes)) {
      throw new Error('Unexpected XPath result type');
    }

    nodes.forEach((node: Node) => {
      if (node.nodeName) {
        tags.add(node.nodeName);
      }
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          tags: Array.from(tags),
          count: nodes.length,
          rootElement: doc.documentElement?.nodeName
        }, null, 2)
      }]
    };
  } else if (query) {
    // Execute specific XPath query
    const nodes = xpath.select(query, doc);
    const results = Array.isArray(nodes)
      ? nodes.map(node => formatNode(node, includeAttributes))
      : [formatNode(nodes, includeAttributes)];

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  } else {
    throw new Error('Either structureOnly or query must be specified');
  }
}

/**
 * Format a DOM node for output
 */
function formatNode(node: any, includeAttributes = true): XmlNode {
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return { type: 'text', value: String(node) };
  }

  if (!node || !node.nodeType) {
    return { type: 'unknown', value: String(node) };
  }

  // Text node
  if (node.nodeType === 3) {
    return {
      type: 'text',
      value: node.nodeValue?.trim()
    };
  }

  // Element node
  if (node.nodeType === 1) {
    const result: XmlNode = {
      type: 'element',
      name: node.nodeName,
      value: node.textContent?.trim()
    };

    if (includeAttributes && node.attributes && node.attributes.length > 0) {
      result.attributes = Array.from(node.attributes).map((attr: any) => ({
        name: attr.nodeName,
        value: attr.nodeValue
      }));
    }

    return result;
  }

  // Attribute node
  if (node.nodeType === 2) {
    return {
      type: 'attribute',
      name: node.nodeName,
      value: node.nodeValue
    };
  }

  return {
    type: 'unknown',
    nodeType: node.nodeType,
    value: node.toString()
  };
}

/**
 * Extract structured information about XML document
 */
function extractXmlStructure(doc: Document, maxDepth = 2, includeAttributes = true) {
  const structure: any = {
    rootElement: doc.documentElement?.nodeName,
    elements: {},
    attributes: includeAttributes ? {} : undefined,
    namespaces: extractNamespaces(doc),
  };

  // Get all element names and counts
  const elementQuery = "//*";
  const elements = xpath.select(elementQuery, doc) as Node[];

  elements.forEach((element: any) => {
    const name = element.nodeName;
    structure.elements[name] = (structure.elements[name] || 0) + 1;

    if (includeAttributes && element.attributes && element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrKey = `${name}@${attr.nodeName}`;
        if (structure.attributes) {
          structure.attributes[attrKey] = (structure.attributes[attrKey] || 0) + 1;
        }
      }
    }
  });

  // Get child relationship structure up to maxDepth
  if (maxDepth > 0 && doc.documentElement) {
    structure.hierarchy = buildHierarchy(doc.documentElement, maxDepth);
  }

  return structure;
}

/**
 * Extract namespaces used in the document
 */
function extractNamespaces(doc: Document) {
  const namespaces: Record<string, string> = {};
  const nsQuery = "//*[namespace-uri()]";

  try {
    const nsNodes = xpath.select(nsQuery, doc) as Node[];
    nsNodes.forEach((node: any) => {
      if (node.namespaceURI) {
        const prefix = node.prefix || '';
        namespaces[prefix] = node.namespaceURI;
      }
    });
  } catch (err) {
    // Some documents might not support namespace queries
    console.error('Error extracting namespaces:', err instanceof Error ? err.message : String(err));
  }

  return namespaces;
}

/**
 * Build element hierarchy up to maxDepth
 */
function buildHierarchy(element: Node, maxDepth: number, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    return { name: element.nodeName, hasChildren: element.childNodes.length > 0 };
  }

  const result: any = {
    name: element.nodeName,
    children: []
  };

  // Only process element nodes (type 1)
  const childElements = Array.from(element.childNodes)
    .filter(node => node.nodeType === 1);

  if (childElements.length > 0) {
    const processedChildren = new Set<string>();

    childElements.forEach(child => {
      // Only add unique child element types
      if (!processedChildren.has(child.nodeName)) {
        processedChildren.add(child.nodeName);
        result.children.push(
          buildHierarchy(child, maxDepth, currentDepth + 1)
        );
      }
    });
  }

  return result;
}
`````

## File: src/schemas/directory-operations.ts
`````typescript
import { z } from "zod";

export const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const DirectoryTreeArgsSchema = z.object({
  path: z.string(),
});

export const DeleteDirectoryArgsSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
});
`````

## File: src/utils/file-utils.ts
`````typescript
import fs from 'fs/promises';
import { createTwoFilesPatch } from 'diff';
import { minimatch } from 'minimatch';
import path from 'path';

export interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

export async function getFileStats(filePath: string): Promise<FileInfo> {
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    permissions: stats.mode.toString(8).slice(-3),
  };
}

export async function searchFiles(
  rootPath: string,
  pattern: string,
  excludePatterns: string[] = []
): Promise<string[]> {
  const results: string[] = [];

  async function search(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Check if path matches any exclude pattern
      const relativePath = path.relative(rootPath, fullPath);
      const shouldExclude = excludePatterns.some(pattern => {
        const globPattern = pattern.includes('*') ? pattern : `**/${pattern}/**`;
        return minimatch(relativePath, globPattern, { dot: true });
      });

      if (shouldExclude) {
        continue;
      }

      if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
        results.push(fullPath);
      }

      if (entry.isDirectory()) {
        await search(fullPath);
      }
    }
  }

  await search(rootPath);
  return results;
}

export async function findFilesByExtension(
  rootPath: string,
  extension: string,
  excludePatterns: string[] = []
): Promise<string[]> {
  const results: string[] = [];
  
  // Normalize the extension (remove leading dot if present)
  let normalizedExtension = extension.toLowerCase();
  if (normalizedExtension.startsWith('.')) {
    normalizedExtension = normalizedExtension.substring(1);
  }
  
  async function searchDirectory(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Check if path matches any exclude pattern
      const relativePath = path.relative(rootPath, fullPath);
      const shouldExclude = excludePatterns.some(pattern => {
        const globPattern = pattern.includes('*') ? pattern : `**/${pattern}/**`;
        return minimatch(relativePath, globPattern, { dot: true });
      });

      if (shouldExclude) {
        continue;
      }

      if (entry.isFile()) {
        // Check if file has the requested extension
        const fileExtension = path.extname(entry.name).toLowerCase().substring(1);
        if (fileExtension === normalizedExtension) {
          results.push(fullPath);
        }
      } else if (entry.isDirectory()) {
        // Recursively search subdirectories
        await searchDirectory(fullPath);
      }
    }
  }

  await searchDirectory(rootPath);
  return results;
}

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

export function createUnifiedDiff(originalContent: string, newContent: string, filepath: string = 'file'): string {
  // Ensure consistent line endings for diff
  const normalizedOriginal = normalizeLineEndings(originalContent);
  const normalizedNew = normalizeLineEndings(newContent);

  return createTwoFilesPatch(
    filepath,
    filepath,
    normalizedOriginal,
    normalizedNew,
    'original',
    'modified'
  );
}

export async function applyFileEdits(
  filePath: string,
  edits: Array<{oldText: string, newText: string}>,
  dryRun = false
): Promise<string> {
  // Read file content and normalize line endings
  const content = normalizeLineEndings(await fs.readFile(filePath, 'utf-8'));

  // Apply edits sequentially
  let modifiedContent = content;
  for (const edit of edits) {
    const normalizedOld = normalizeLineEndings(edit.oldText);
    const normalizedNew = normalizeLineEndings(edit.newText);

    // If exact match exists, use it
    if (modifiedContent.includes(normalizedOld)) {
      modifiedContent = modifiedContent.replace(normalizedOld, normalizedNew);
      continue;
    }

    // Otherwise, try line-by-line matching with flexibility for whitespace
    const oldLines = normalizedOld.split('\n');
    const contentLines = modifiedContent.split('\n');
    let matchFound = false;

    for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
      const potentialMatch = contentLines.slice(i, i + oldLines.length);

      // Compare lines with normalized whitespace
      const isMatch = oldLines.every((oldLine, j) => {
        const contentLine = potentialMatch[j];
        return oldLine.trim() === contentLine.trim();
      });

      if (isMatch) {
        // Preserve original indentation of first line
        const originalIndent = contentLines[i].match(/^\s*/)?.[0] || '';
        const newLines = normalizedNew.split('\n').map((line, j) => {
          if (j === 0) return originalIndent + line.trimStart();
          // For subsequent lines, try to preserve relative indentation
          const oldIndent = oldLines[j]?.match(/^\s*/)?.[0] || '';
          const newIndent = line.match(/^\s*/)?.[0] || '';
          if (oldIndent && newIndent) {
            const relativeIndent = newIndent.length - oldIndent.length;
            return originalIndent + ' '.repeat(Math.max(0, relativeIndent)) + line.trimStart();
          }
          return line;
        });

        contentLines.splice(i, oldLines.length, ...newLines);
        modifiedContent = contentLines.join('\n');
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      throw new Error(`Could not find exact match for edit:\n${edit.oldText}`);
    }
  }

  // Create unified diff
  const diff = createUnifiedDiff(content, modifiedContent, filePath);

  // Format diff with appropriate number of backticks
  let numBackticks = 3;
  while (diff.includes('`'.repeat(numBackticks))) {
    numBackticks++;
  }
  const formattedDiff = `${'`'.repeat(numBackticks)}diff\n${diff}${'`'.repeat(numBackticks)}\n\n`;

  if (!dryRun) {
    await fs.writeFile(filePath, modifiedContent, 'utf-8');
  }

  return formattedDiff;
}
`````

## File: src/utils/path-utils.ts
`````typescript
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Normalize all paths consistently
export function normalizePath(p: string): string {
  return path.normalize(p);
}

export function expandHome(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

export async function validatePath(
  requestedPath: string,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
): Promise<string> {
  const expandedPath = expandHome(requestedPath);
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(process.cwd(), expandedPath);

  const normalizedRequested = normalizePath(absolute);

  // Check if path is within allowed directories
  const isAllowed = allowedDirectories.some(dir => normalizedRequested.startsWith(dir));
  if (!isAllowed) {
    // Check if it's a real path that matches a symlink we know about
    const matchingSymlink = Array.from(symlinksMap.entries()).find(([realPath, symlinkPath]) => 
      normalizedRequested.startsWith(realPath)
    );
    
    if (matchingSymlink) {
      const [realPath, symlinkPath] = matchingSymlink;
      // Convert the path from real path to symlink path
      const relativePath = normalizedRequested.substring(realPath.length);
      const symlinkEquivalent = path.join(symlinkPath, relativePath);
      
      // Return the symlink path instead
      return symlinkEquivalent;
    }
    
    throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`);
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = normalizePath(realPath);
    
    // If the real path is different from the requested path, it's a symlink
    if (normalizedReal !== normalizedRequested) {
      // Store this mapping for future reference
      symlinksMap.set(normalizedReal, normalizedRequested);
      
      // Make sure the real path is also allowed
      const isRealPathAllowed = allowedDirectories.some(dir => normalizedReal.startsWith(dir));
      if (!isRealPathAllowed) {
        throw new Error("Access denied - symlink target outside allowed directories");
      }
      
      // If no-follow-symlinks is true, return the original path
      if (noFollowSymlinks) {
        return absolute;
      }
    }
    
    return realPath;
  } catch (error) {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = normalizePath(realParentPath);
      const isParentAllowed = allowedDirectories.some(dir => normalizedParent.startsWith(dir));
      if (!isParentAllowed) {
        throw new Error("Access denied - parent directory outside allowed directories");
      }
      return absolute;
    } catch {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }
  }
}
`````

## File: test/json/users.json
`````json
{"users": [{"id": 1, "name": "John", "age": 30, "address": {"city": "New York"}}, {"id": 2, "name": "Jane", "age": 25, "address": {"city": "Boston"}}, {"id": 3, "name": "Bob", "age": 35, "address": {"city": "New York"}}]}
`````

## File: test/sample.xml
`````xml
<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns="http://example.org/catalog">
  <book id="bk101" category="fiction">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating applications with XML.</description>
  </book>
  <book id="bk102" category="fiction">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former architect battles corporate zombies, an evil sorceress, and her own childhood to become queen of the world.</description>
  </book>
  <book id="bk103" category="non-fiction">
    <author>Corets, Eva</author>
    <title>Maeve Ascendant</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-11-17</publish_date>
    <description>After the collapse of a nanotechnology society, the young survivors lay the foundation for a new society.</description>
  </book>
  <magazine id="mg101" frequency="monthly">
    <title>Programming Today</title>
    <publisher>Tech Media</publisher>
    <price>6.50</price>
    <issue>125</issue>
    <publish_date>2023-01-15</publish_date>
    <articles>
      <article>
        <author>Jane Smith</author>
        <title>Modern XML Processing</title>
      </article>
      <article>
        <author>John Doe</author>
        <title>XPath Deep Dive</title>
      </article>
    </articles>
  </magazine>
</catalog>
`````

## File: Dockerfile
`````dockerfile
FROM node:22.12-alpine AS builder

WORKDIR /app

COPY src/filesystem /app
COPY tsconfig.json /tsconfig.json

RUN --mount=type=cache,target=/root/.npm npm install

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev


FROM node:22-alpine AS release

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

RUN npm ci --ignore-scripts --omit-dev

ENTRYPOINT ["node", "/app/dist/index.js"]
`````

## File: src/config/permissions.ts
`````typescript
export interface Permissions {
  create: boolean;
  edit: boolean;
  move: boolean;
  delete: boolean;
  rename: boolean;
  fullAccess: boolean;
}

export interface ServerConfig {
  readonlyFlag: boolean;
  noFollowSymlinks: boolean;
  permissions: Permissions;
  allowedDirectories: string[];
}

export function parseCommandLineArgs(args: string[]): ServerConfig {
  // Remove flags from args and store them
  const readonlyFlag = args.includes('--readonly');
  const noFollowSymlinks = args.includes('--no-follow-symlinks');
  const fullAccessFlag = args.includes('--full-access');
  
  // Granular permission flags
  const allowCreate = args.includes('--allow-create');
  const allowEdit = args.includes('--allow-edit');
  const allowMove = args.includes('--allow-move');
  const allowDelete = args.includes('--allow-delete');
  const allowRename = args.includes('--allow-rename');

  // Permission calculation
  // readonly flag overrides all other permissions as a safety mechanism
  // fullAccess enables all permissions unless readonly is set
  // individual allow flags enable specific permissions unless readonly is set
  const permissions: Permissions = {
    create: !readonlyFlag && (fullAccessFlag || allowCreate),
    edit: !readonlyFlag && (fullAccessFlag || allowEdit),
    move: !readonlyFlag && (fullAccessFlag || allowMove),
    delete: !readonlyFlag && (fullAccessFlag || allowDelete),
    rename: !readonlyFlag && (fullAccessFlag || allowRename),
    // fullAccess is true only if the flag is explicitly set and not in readonly mode
    fullAccess: !readonlyFlag && fullAccessFlag
  };

  // Remove flags from args
  const cleanArgs = args.filter(arg => !arg.startsWith('--'));

  if (cleanArgs.length === 0) {
    throw new Error(
      "Usage: mcp-server-filesystem [--full-access] [--readonly] [--no-follow-symlinks] " +
      "[--allow-create] [--allow-edit] [--allow-move] [--allow-delete] [--allow-rename] " +
      "<allowed-directory> [additional-directories...]"
    );
  }

  return {
    readonlyFlag,
    noFollowSymlinks,
    permissions,
    allowedDirectories: cleanArgs
  };
}
`````

## File: src/handlers/file-handlers.ts
`````typescript
import fs from 'fs/promises';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import { getFileStats, applyFileEdits } from '../utils/file-utils.js';
import {
  ReadFileArgsSchema,
  ReadMultipleFilesArgsSchema,
  WriteFileArgsSchema,
  EditFileArgsSchema,
  GetFileInfoArgsSchema,
  MoveFileArgsSchema,
  DeleteFileArgsSchema,
  RenameFileArgsSchema
} from '../schemas/file-operations.js';
import path from 'path';

export async function handleReadFile(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ReadFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for read_file: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const content = await fs.readFile(validPath, "utf-8");
  return {
    content: [{ type: "text", text: content }],
  };
}

export async function handleReadMultipleFiles(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = ReadMultipleFilesArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for read_multiple_files: ${parsed.error}`);
  }
  const results = await Promise.all(
    parsed.data.paths.map(async (filePath: string) => {
      try {
        const validPath = await validatePath(filePath, allowedDirectories, symlinksMap, noFollowSymlinks);
        const content = await fs.readFile(validPath, "utf-8");
        return `${filePath}:\n${content}\n`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `${filePath}: Error - ${errorMessage}`;
      }
    }),
  );
  return {
    content: [{ type: "text", text: results.join("\n---\n") }],
  };
}

export async function handleCreateFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = WriteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for create_file: ${parsed.error}`);
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  // Check if file exists
  try {
    await fs.access(validPath);
    throw new Error('Cannot create file: file already exists');
  } catch (error) {
    // File doesn't exist - proceed with creation
    if (!permissions.create && !permissions.fullAccess) {
      throw new Error('Cannot create new file: create permission not granted (requires --allow-create)');
    }
    
    await fs.writeFile(validPath, parsed.data.content, "utf-8");
    return {
      content: [{ type: "text", text: `Successfully created ${parsed.data.path}` }],
    };
  }
}

export async function handleModifyFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = WriteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for modify_file: ${parsed.error}`);
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  // Check if file exists
  try {
    await fs.access(validPath);
    
    if (!permissions.edit && !permissions.fullAccess) {
      throw new Error('Cannot modify file: edit permission not granted (requires --allow-edit)');
    }
    
    await fs.writeFile(validPath, parsed.data.content, "utf-8");
    return {
      content: [{ type: "text", text: `Successfully modified ${parsed.data.path}` }],
    };
  } catch (error) {
    throw new Error('Cannot modify file: file does not exist');
  }
}

export async function handleEditFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = EditFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for edit_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.edit && !permissions.fullAccess) {
    throw new Error('Cannot edit file: edit permission not granted (requires --allow-edit)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const result = await applyFileEdits(validPath, parsed.data.edits, parsed.data.dryRun);
  return {
    content: [{ type: "text", text: result }],
  };
}

export async function handleGetFileInfo(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = GetFileInfoArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for get_file_info: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const info = await getFileStats(validPath);
  return {
    content: [{ type: "text", text: Object.entries(info)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n") }],
  };
}

export async function handleMoveFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = MoveFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for move_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.move && !permissions.fullAccess) {
    throw new Error('Cannot move file: move permission not granted (requires --allow-move)');
  }
  
  const validSourcePath = await validatePath(parsed.data.source, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validDestPath = await validatePath(parsed.data.destination, allowedDirectories, symlinksMap, noFollowSymlinks);
  await fs.rename(validSourcePath, validDestPath);
  return {
    content: [{ type: "text", text: `Successfully moved ${parsed.data.source} to ${parsed.data.destination}` }],
  };
}

export async function handleDeleteFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = DeleteFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for delete_file: ${parsed.error}`);
  }
  
  // Enforce permission checks
  if (!permissions.delete && !permissions.fullAccess) {
    throw new Error('Cannot delete file: delete permission not granted (requires --allow-delete)');
  }
  
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Check if file exists
    await fs.access(validPath);
    await fs.unlink(validPath);
    return {
      content: [{ type: "text", text: `Successfully deleted ${parsed.data.path}` }],
    };
  } catch (error) {
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleRenameFile(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = RenameFileArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for rename_file: ${parsed.error}`);
  }
  
  // Enforce permission checks - rename requires the rename permission
  if (!permissions.rename && !permissions.fullAccess) {
    throw new Error('Cannot rename file: rename permission not granted (requires --allow-rename)');
  }
  
  const validSourcePath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  // Get the directory from the source path
  const directory = path.dirname(validSourcePath);
  
  // Create the destination path using the same directory and the new name
  const destinationPath = path.join(directory, parsed.data.newName);
  
  // Validate the destination path
  const validDestPath = await validatePath(destinationPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  // Check if destination already exists
  try {
    await fs.access(validDestPath);
    throw new Error(`Cannot rename file: a file with name "${parsed.data.newName}" already exists in the directory`);
  } catch (error) {
    // We want this error - it means the destination doesn't exist yet
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Perform the rename operation
  await fs.rename(validSourcePath, validDestPath);
  
  return {
    content: [{ type: "text", text: `Successfully renamed ${parsed.data.path} to ${parsed.data.newName}` }],
  };
}
`````

## File: src/handlers/index.ts
`````typescript
export * from './file-handlers.js';
export * from './directory-handlers.js';
export * from './utility-handlers.js';
export * from './xml-handlers.js';
export * from './json-handlers.js';
`````

## File: src/handlers/json-handlers.ts
`````typescript
import fs from 'fs/promises';
import { JSONPath } from 'jsonpath-plus';
import _ from 'lodash';
import AjvModule, { ErrorObject } from 'ajv';
const Ajv = AjvModule.default || AjvModule;
import path from 'path';
import { validatePath } from '../utils/path-utils.js';
import {
  JsonQueryArgsSchema,
  JsonFilterArgsSchema,
  JsonGetValueArgsSchema,
  JsonTransformArgsSchema,
  JsonStructureArgsSchema,
  JsonSampleArgsSchema,
  JsonValidateArgsSchema,
  JsonSearchKvArgsSchema
} from '../schemas/json-operations.js';

/**
 * Read and parse a JSON file
 */
async function readJsonFile(filePath: string, maxBytes?: number): Promise<any> {
  try {
    const content = await fs.readFile(filePath, {
      encoding: 'utf-8',
      ...(maxBytes ? { length: maxBytes } : {})
    });
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read or parse JSON file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSONPath query operations
 */
export async function handleJsonQuery(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonQueryArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_query: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    const result = JSONPath({ 
      path: parsed.data.query,
      json: jsonData,
      wrap: false // Don't wrap single results in an array
    });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(result, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSONPath query failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON filtering operations
 */
export async function handleJsonFilter(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonFilterArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_filter: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    let dataToFilter: any[] = [];
    
    // Check if arrayPath is provided
    if (parsed.data.arrayPath) {
      // Use JSONPath to locate the target array
      const targetArray = JSONPath({
        path: parsed.data.arrayPath,
        json: jsonData,
        wrap: false
      });

      if (!Array.isArray(targetArray)) {
        throw new Error(`Path "${parsed.data.arrayPath}" did not resolve to an array`);
      }
      
      dataToFilter = targetArray;
    } 
    // No arrayPath provided, use automatic detection for simple cases
    else {
      if (_.isArray(jsonData)) {
        // Direct array case
        dataToFilter = jsonData;
      } else if (_.isPlainObject(jsonData)) {
        // Find all array properties at the top level
        const arrayProps = _.pickBy(jsonData, _.isArray);
        
        if (_.size(arrayProps) === 1) {
          // If exactly one array property, use it automatically
          dataToFilter = _.values(arrayProps)[0] as any[];
        } else if (_.size(arrayProps) > 1) {
          // Multiple arrays found, can't automatically determine which to use
          throw new Error(
            'Multiple arrays found in the JSON data. ' +
            'Please provide the "arrayPath" parameter to specify which array to filter. ' +
            'Example: "$.items" or "$.data.resources"'
          );
        } else {
          // No arrays found at the top level
          throw new Error(
            'No arrays found in the JSON data. ' +
            'Please provide the "arrayPath" parameter to specify the path to the array to filter. ' +
            'Example: "$.items" or "$.data.resources"'
          );
        }
      } else {
        // Not an object or array
        throw new Error(
          'The JSON data is not an array or an object containing arrays. ' +
          'Please provide valid JSON data with arrays to filter.'
        );
      }
    }
    
    // If we still couldn't find an array to filter, throw a helpful error
    if (!_.isArray(dataToFilter) || _.isEmpty(dataToFilter)) {
      throw new Error(
        'Could not find a valid array to filter in the JSON data. ' +
        'Please make sure the file contains an array or specify the correct arrayPath parameter.'
      );
    }

    // Now filter the array using lodash predicates
    const filtered = _.filter(dataToFilter, (item) => {
      const results = _.map(parsed.data.conditions, condition => {
        const value = _.get(item, condition.field);
        
        switch (condition.operator) {
          case 'eq':
            return _.isEqual(value, condition.value);
          case 'neq':
            return !_.isEqual(value, condition.value);
          case 'gt':
            return value > condition.value;
          case 'gte':
            return value >= condition.value;
          case 'lt':
            return value < condition.value;
          case 'lte':
            return value <= condition.value;
          case 'contains':
            return _.isString(value) 
              ? _.includes(value, String(condition.value))
              : _.isArray(value) && _.some(value, v => _.isEqual(v, condition.value));
          case 'startsWith':
            return _.isString(value) && _.startsWith(value, String(condition.value));
          case 'endsWith':
            return _.isString(value) && _.endsWith(value, String(condition.value));
          case 'exists':
            return !_.isUndefined(value);
          case 'type':
            return typeof value === condition.value;
          default:
            return false;
        }
      });

      return parsed.data.match === 'all' 
        ? _.every(results)
        : _.some(results);
    });

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(filtered, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON filtering failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle getting a specific value from a JSON file
 */
export async function handleJsonGetValue(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonGetValueArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_get_value: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    const value = _.get(jsonData, parsed.data.field);
    if (value === undefined) {
      throw new Error(`Field "${parsed.data.field}" not found in JSON data`);
    }

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(value, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get JSON value: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON transformation operations
 */
export async function handleJsonTransform(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonTransformArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_transform: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  let jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    // Apply operations in sequence
    for (const op of parsed.data.operations) {
      switch (op.type) {
        case 'map':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for map operation');
          }
          if (!op.field) {
            throw new Error('Field is required for map operation');
          }
          jsonData = jsonData.map(item => _.get(item, op.field!));
          break;

        case 'groupBy':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for groupBy operation');
          }
          if (!op.field) {
            throw new Error('Field is required for groupBy operation');
          }
          jsonData = _.groupBy(jsonData, op.field);
          break;

        case 'sort':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for sort operation');
          }
          if (!op.field) {
            throw new Error('Field is required for sort operation');
          }
          jsonData = _.orderBy(
            jsonData,
            [op.field],
            [op.order || 'asc']
          );
          break;

        case 'flatten':
          if (!Array.isArray(jsonData)) {
            throw new Error('Data must be an array for flatten operation');
          }
          jsonData = _.flattenDeep(jsonData);
          break;

        case 'pick':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for pick operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => _.pick(item, op.fields!));
          } else {
            jsonData = _.pick(jsonData, op.fields);
          }
          break;

        case 'omit':
          if (!op.fields || !op.fields.length) {
            throw new Error('Fields array is required for omit operation');
          }
          if (Array.isArray(jsonData)) {
            jsonData = jsonData.map(item => _.omit(item, op.fields!));
          } else {
            jsonData = _.omit(jsonData, op.fields);
          }
          break;
      }
    }

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(jsonData, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON transformation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the structure of a JSON file with configurable depth and array type analysis
 */
export async function handleJsonStructure(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonStructureArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_structure: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);
  const { depth = 1, detailedArrayTypes = false } = parsed.data;

  try {
    // Define a type that includes our custom type strings
    type ValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | `array<${string}>` | 'null' | 'undefined';
    
    /**
     * Analyze the type of a value, including detailed array analysis if requested
     */
    function analyzeType(value: any, currentDepth: number = 0): { type: ValueType; structure?: Record<string, any> } {
      // Handle null and undefined
      if (value === null) return { type: 'null' };
      if (value === undefined) return { type: 'undefined' };

      // Handle arrays
      if (_.isArray(value)) {
        if (value.length === 0) return { type: 'array<empty>' as ValueType };
        
        if (detailedArrayTypes) {
          // Analyze all elements for mixed types
          const elementTypes = new Set<string>();
          value.forEach(item => {
            const itemType = analyzeType(item, currentDepth + 1);
            elementTypes.add(itemType.type);
          });
          
          const typeString = Array.from(elementTypes).join('|');
          return { type: `array<${typeString}>` as ValueType };
        } else {
          // Just analyze first element
          const firstType = analyzeType(value[0], currentDepth + 1);
          return { type: `array<${firstType.type}>` as ValueType };
        }
      }

      // Handle objects
      if (_.isPlainObject(value)) {
        const type = 'object' as ValueType;
        // If we haven't reached depth limit and object isn't empty, analyze structure
        if ((depth === -1 || currentDepth < depth) && !_.isEmpty(value)) {
          const structure: Record<string, any> = {};
          for (const [key, val] of Object.entries(value)) {
            structure[key] = analyzeType(val, currentDepth + 1);
          }
          return { type, structure };
        }
        return { type };
      }

      // Handle primitives
      if (_.isString(value)) return { type: 'string' };
      if (_.isNumber(value)) return { type: 'number' };
      if (_.isBoolean(value)) return { type: 'boolean' };

      // Fallback
      return { type: typeof value as ValueType };
    }

    // Analyze the root structure
    const structure = _.isArray(jsonData)
      ? { type: 'array', elements: analyzeType(jsonData, 0) }
      : _.transform(jsonData, (result: Record<string, any>, value, key: string) => {
          result[key] = analyzeType(value, 0);
        }, {} as Record<string, any>);

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(structure, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON structure analysis failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON array sampling operations
 */
export async function handleJsonSample(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonSampleArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_sample: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const jsonData = await readJsonFile(validPath, parsed.data.maxBytes);

  try {
    // Use JSONPath to locate the target array
    const targetArray = JSONPath({
      path: parsed.data.arrayPath,
      json: jsonData,
      wrap: false
    });

    if (!Array.isArray(targetArray)) {
      throw new Error(`Path "${parsed.data.arrayPath}" did not resolve to an array`);
    }

    if (targetArray.length === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify([], null, 2)
        }],
      };
    }

    let sampledData: any[];
    if (parsed.data.method === 'random') {
      // Use Lodash's sampleSize for efficient random sampling
      sampledData = _.sampleSize(targetArray, Math.min(parsed.data.count, targetArray.length));
    } else {
      // Take first N elements
      sampledData = _.take(targetArray, parsed.data.count);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(sampledData, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON sampling failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle JSON Schema validation operations
 */
export async function handleJsonValidate(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonValidateArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_validate: ${parsed.error}`);
  }

  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validSchemaPath = await validatePath(parsed.data.schemaPath, allowedDirectories, symlinksMap, noFollowSymlinks);

  try {
    // Read both the data and schema files
    const [jsonData, schemaData] = await Promise.all([
      readJsonFile(validPath, parsed.data.maxBytes),
      readJsonFile(validSchemaPath)
    ]);

    // Configure Ajv instance
    const ajv = new Ajv({
      allErrors: parsed.data.allErrors,
      strict: parsed.data.strict,
      validateSchema: true, // Validate the schema itself
      verbose: true // Include more detailed error information
    });

    try {
      // Compile and validate the schema itself first
      const validateSchema = ajv.compile(schemaData);
      
      // Validate the data
      const isValid = validateSchema(jsonData);

      // Prepare the validation result
      const result = {
        isValid,
        errors: isValid ? null : (validateSchema.errors as ErrorObject[])?.map(error => ({
          path: error.instancePath,
          keyword: error.keyword,
          message: error.message,
          params: error.params,
          schemaPath: error.schemaPath
        }))
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }],
      };
    } catch (validationError) {
      // Handle schema compilation errors
      if (validationError instanceof Error) {
        throw new Error(`Schema validation failed: ${validationError.message}`);
      }
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handle searching for JSON files containing specific key/value pairs
 */
export async function handleJsonSearchKv(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = JsonSearchKvArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for json_search_kv: ${parsed.error}`);
  }

  const validDirPath = await validatePath(parsed.data.directoryPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  const { key, value, recursive = true, matchType = 'exact', maxBytes, maxResults = 100 } = parsed.data;

  /**
   * Check if a value matches the search criteria
   */
  function isValueMatch(foundValue: any): boolean {
    if (value === undefined) return true;
    
    if (typeof foundValue === 'string' && typeof value === 'string') {
      switch (matchType) {
        case 'contains':
          return foundValue.includes(value);
        case 'startsWith':
          return foundValue.startsWith(value);
        case 'endsWith':
          return foundValue.endsWith(value);
        default:
          return foundValue === value;
      }
    }
    
    return _.isEqual(foundValue, value);
  }

  /**
   * Search for key/value pairs in a JSON object
   */
  function searchInObject(obj: any, currentPath: string[] = []): string[] {
    const matches: string[] = [];

    if (_.isPlainObject(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k];
        
        // Check if this key matches
        if (k === key && isValueMatch(v)) {
          matches.push(newPath.join('.'));
        }
        
        // Recursively search in nested objects and arrays
        if (_.isPlainObject(v) || _.isArray(v)) {
          matches.push(...searchInObject(v, newPath));
        }
      }
    } else if (_.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = [...currentPath, index.toString()];
        matches.push(...searchInObject(item, newPath));
      });
    }

    return matches;
  }

  /**
   * Process a single JSON file
   */
  async function processFile(filePath: string): Promise<{ file: string; matches: string[] } | null> {
    try {
      const jsonData = await readJsonFile(filePath, maxBytes);
      const matches = searchInObject(jsonData);
      return matches.length > 0 ? { file: filePath, matches } : null;
    } catch (error) {
      // Skip files that can't be read or aren't valid JSON
      return null;
    }
  }

  /**
   * Recursively get all JSON files in directory
   */
  async function getJsonFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const validSubPath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(...await getJsonFiles(validSubPath));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const validFilePath = await validatePath(fullPath, allowedDirectories, symlinksMap, noFollowSymlinks);
        files.push(validFilePath);
      }
    }

    return files;
  }

  try {
    // Get all JSON files in the directory
    const jsonFiles = await getJsonFiles(validDirPath);
    
    // Process files and collect results
    const results = [];
    for (const file of jsonFiles) {
      if (results.length >= maxResults) break;
      
      const result = await processFile(file);
      if (result) {
        results.push(result);
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          totalFiles: jsonFiles.length,
          matchingFiles: results.length,
          results
        }, null, 2)
      }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JSON key/value search failed: ${error.message}`);
    }
    throw error;
  }
}
`````

## File: src/handlers/utility-handlers.ts
`````typescript
import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { Permissions } from '../config/permissions.js';
import { validatePath } from '../utils/path-utils.js';
import { searchFiles, findFilesByExtension } from '../utils/file-utils.js';
import {
  GetPermissionsArgsSchema,
  SearchFilesArgsSchema,
  FindFilesByExtensionArgsSchema,
  XmlToJsonArgsSchema,
  XmlToJsonStringArgsSchema
} from '../schemas/utility-operations.js';

export function handleGetPermissions(
  args: unknown,
  permissions: Permissions,
  readonlyFlag: boolean,
  noFollowSymlinks: boolean,
  allowedDirectories: string[]
) {
  const parsed = GetPermissionsArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for get_permissions: ${parsed.error}`);
  }

  return {
    content: [{
      type: "text",
      text: `Current permission state:
readOnly: ${readonlyFlag}
followSymlinks: ${!noFollowSymlinks}
fullAccess: ${permissions.fullAccess}

Operations allowed:
- create: ${permissions.create}
- edit: ${permissions.edit}
- move: ${permissions.move}
- rename: ${permissions.rename}
- delete: ${permissions.delete}

Server was started with ${allowedDirectories.length} allowed ${allowedDirectories.length === 1 ? 'directory' : 'directories'}.
Use 'list_allowed_directories' to see them.`
    }],
  };
}

export async function handleSearchFiles(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = SearchFilesArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for search_files: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const results = await searchFiles(validPath, parsed.data.pattern, parsed.data.excludePatterns);
  return {
    content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matches found" }],
  };
}

export async function handleFindFilesByExtension(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = FindFilesByExtensionArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for find_files_by_extension: ${parsed.error}`);
  }
  const validPath = await validatePath(parsed.data.path, allowedDirectories, symlinksMap, noFollowSymlinks);
  const results = await findFilesByExtension(
    validPath, 
    parsed.data.extension, 
    parsed.data.excludePatterns
  );
  return {
    content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matching files found" }],
  };
}

export async function handleXmlToJson(
  args: unknown,
  permissions: Permissions,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = XmlToJsonArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_to_json: ${parsed.error}`);
  }
  
  const validXmlPath = await validatePath(parsed.data.xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  const validJsonPath = await validatePath(parsed.data.jsonPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: parsed.data.options?.ignoreAttributes ?? false,
      preserveOrder: parsed.data.options?.preserveOrder ?? true,
      // Add other options as needed
    };
    
    const parser = new XMLParser(parserOptions);
    const jsonObj = parser.parse(xmlContent);
    
    // Format JSON if requested
    const format = parsed.data.options?.format ?? true;
    const indentSize = parsed.data.options?.indentSize ?? 2;
    const jsonContent = format 
      ? JSON.stringify(jsonObj, null, indentSize) 
      : JSON.stringify(jsonObj);
    
    // Check if JSON file exists to determine if this is a create operation
    let fileExists = false;
    try {
      await fs.access(validJsonPath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist - this is a create operation
    }
    
    // Enforce permission checks for writing
    if (fileExists && !permissions.edit && !permissions.fullAccess) {
      throw new Error('Cannot write to existing JSON file: edit permission not granted (requires --allow-edit)');
    }
    
    if (!fileExists && !permissions.create && !permissions.fullAccess) {
      throw new Error('Cannot create new JSON file: create permission not granted (requires --allow-create)');
    }
    
    // Write JSON to file
    await fs.writeFile(validJsonPath, jsonContent, "utf-8");
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully converted XML from ${parsed.data.xmlPath} to JSON at ${parsed.data.jsonPath}` 
      }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert XML to JSON: ${errorMessage}`);
  }
}

export async function handleXmlToJsonString(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
) {
  const parsed = XmlToJsonStringArgsSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments for xml_to_json_string: ${parsed.error}`);
  }
  
  const validXmlPath = await validatePath(parsed.data.xmlPath, allowedDirectories, symlinksMap, noFollowSymlinks);
  
  try {
    // Read the XML file
    const xmlContent = await fs.readFile(validXmlPath, "utf-8");
    
    // Parse XML to JSON
    const parserOptions = {
      ignoreAttributes: parsed.data.options?.ignoreAttributes ?? false,
      preserveOrder: parsed.data.options?.preserveOrder ?? true,
      // Add other options as needed
    };
    
    const parser = new XMLParser(parserOptions);
    const jsonObj = parser.parse(xmlContent);
    
    // Return the JSON as a string
    const jsonContent = JSON.stringify(jsonObj, null, 2);
    
    return {
      content: [{ type: "text", text: jsonContent }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert XML to JSON: ${errorMessage}`);
  }
}

export function handleListAllowedDirectories(
  args: unknown,
  allowedDirectories: string[]
): { content: [{ type: string; text: string }] } {
  return {
    content: [{
      type: "text",
      text: `Allowed directories:\n${allowedDirectories.join('\n')}`
    }],
  };
}
`````

## File: src/schemas/file-operations.ts
`````typescript
import { z } from "zod";

export const ReadFileArgsSchema = z.object({
  path: z.string(),
});

export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

export const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const EditOperation = z.object({
  oldText: z.string().describe('Text to search for - must match exactly'),
  newText: z.string().describe('Text to replace with')
});

export const EditFileArgsSchema = z.object({
  path: z.string(),
  edits: z.array(EditOperation),
  dryRun: z.boolean().default(false).describe('Preview changes using git-style diff format')
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
`````

## File: src/schemas/index.ts
`````typescript
export * from './file-operations.js';
export * from './directory-operations.js';
export * from './utility-operations.js';
export * from './json-operations.js';
`````

## File: src/schemas/json-operations.ts
`````typescript
import { z } from "zod";

// Schema for JSONPath query operations
export const JsonQueryArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to query'),
  query: z.string().describe('JSONPath expression to execute against the JSON data'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for filtering JSON arrays
export const JsonFilterArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to filter'),
  arrayPath: z.string().optional()
    .describe('Optional JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")'),
  conditions: z.array(z.object({
    field: z.string().describe('Path to the field to check (e.g., "address.city" or "tags[0]")'),
    operator: z.enum([
      'eq', 'neq',  // equals, not equals
      'gt', 'gte',  // greater than, greater than or equal
      'lt', 'lte',  // less than, less than or equal
      'contains',   // string/array contains
      'startsWith', // string starts with
      'endsWith',   // string ends with
      'exists',     // field exists
      'type'        // check value type
    ]).describe('Comparison operator'),
    value: z.any().describe('Value to compare against'),
  })).min(1).describe('Array of filter conditions'),
  match: z.enum(['all', 'any'])
    .default('all')
    .describe('How to combine multiple conditions - "all" for AND, "any" for OR'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for getting a specific value from a JSON file
export const JsonGetValueArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file'),
  field: z.string().describe('Path to the field to retrieve (e.g., "user.address.city" or "items[0].name")'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for transforming JSON data
export const JsonTransformArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to transform'),
  operations: z.array(z.object({
    type: z.enum([
      'map',      // Transform array elements
      'groupBy',  // Group array elements
      'sort',     // Sort array elements
      'flatten',  // Flatten nested arrays
      'pick',     // Pick specific fields
      'omit'      // Omit specific fields
    ]).describe('Type of transformation operation'),
    field: z.string().optional().describe('Field to operate on (if applicable)'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order (if applicable)'),
    fields: z.array(z.string()).optional().describe('Fields to pick/omit (if applicable)'),
  })).min(1).describe('Array of transformation operations to apply in sequence'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
});

// Schema for getting JSON structure
export const JsonStructureArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to analyze'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
  depth: z.number().int().positive().optional().default(1)
    .describe('How deep to analyze the structure (default: 1, use -1 for unlimited)'),
  detailedArrayTypes: z.boolean().optional().default(false)
    .describe('Whether to analyze all array elements for mixed types (default: false)')
});

// Schema for sampling JSON array elements
export const JsonSampleArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file containing the array'),
  arrayPath: z.string().describe('JSONPath expression to locate the target array (e.g., "$.items" or "$.data.records")'),
  count: z.number().int().positive().describe('Number of elements to sample'),
  method: z.enum(['first', 'random']).optional().default('first')
    .describe('Sampling method - "first" for first N elements, "random" for random sampling'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)')
});

// Schema for JSON Schema validation
export const JsonValidateArgsSchema = z.object({
  path: z.string().describe('Path to the JSON file to validate'),
  schemaPath: z.string().describe('Path to the JSON Schema file'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
  strict: z.boolean().optional().default(false)
    .describe('Whether to enable strict mode validation (additionalProperties: false)'),
  allErrors: z.boolean().optional().default(true)
    .describe('Whether to collect all validation errors or stop at first error')
});

// Schema for searching JSON files by key/value pairs
export const JsonSearchKvArgsSchema = z.object({
  directoryPath: z.string().describe('Directory to search in'),
  key: z.string().describe('Key to search for'),
  value: z.any().optional().describe('Optional value to match against the key'),
  recursive: z.boolean().optional().default(true)
    .describe('Whether to search recursively in subdirectories'),
  matchType: z.enum(['exact', 'contains', 'startsWith', 'endsWith']).optional().default('exact')
    .describe('How to match values - only applies if value is provided'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from each file (default: 1MB)'),
  maxResults: z.number().int().positive().optional().default(100)
    .describe('Maximum number of results to return (default: 100)')
});
`````

## File: src/schemas/utility-operations.ts
`````typescript
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

export const XmlQueryArgsSchema = z.object({
  path: z.string().describe('Path to the XML file to query'),
  query: z.string().optional().describe('XPath query to execute against the XML file'),
  structureOnly: z.boolean().optional().default(false)
    .describe('If true, returns only tag names and structure instead of executing query'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information in the results')
});

export const XmlStructureArgsSchema = z.object({
  path: z.string().describe('Path to the XML file to analyze'),
  depth: z.number().optional().default(2)
    .describe('How deep to analyze the hierarchy (default: 2)'),
  includeAttributes: z.boolean().optional().default(true)
    .describe('Whether to include attribute information'),
  maxBytes: z.number().optional().default(1024 * 1024)
    .describe('Maximum bytes to read from the file (default: 1MB)')
});
`````

## File: .gitignore
`````
# Build output
dist/
 
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.test

# IDE files
.vscode/

# Logs and temporary files
*.log
*.tmp

.vscode/
`````

## File: tsconfig.json
`````json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "rootDir": "."
  },
  "include": [
    "./**/*.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
`````

## File: README.md
`````markdown
# Filesystem MCP Server

Node.js server implementing Model Context Protocol (MCP) for filesystem operations with comprehensive permission controls and enhanced functionality.

## Features

- Granular permission controls (read-only, full access, or specific operation permissions)
- Secure file operations within allowed directories
- File operations:
  - Read/write/modify files
  - Create/list/delete directories
  - Move files/directories
  - Search files by name or extension
  - Get file metadata
- Directory operations:
  - Tree view of directory structures
  - Recursive operations with exclusion patterns
- Utility functions:
  - XML to JSON conversion
  - Multiple file operations in one call
  - Advanced file editing with pattern matching
- Security features:
  - Symlink control
  - Path validation
  - Sandboxed operations

**Note**: The server will only allow operations within directories specified via `args` and according to the configured permissions.

## API

### Resources

- `file://system`: File system operations interface

### Tools

- **read_file**
  - Read complete contents of a file
  - Input: `path` (string)
  - Reads complete file contents with UTF-8 encoding

- **read_multiple_files**
  - Read multiple files simultaneously
  - Input: `paths` (string[])
  - Failed reads won't stop the entire operation

- **create_file**
  - Create a new file with content
  - Inputs:
    - `path` (string): File location
    - `content` (string): File content
  - Fails if file already exists
  - Requires `create` permission

- **modify_file**
  - Modify an existing file with new content
  - Inputs:
    - `path` (string): File location
    - `content` (string): New file content
  - Fails if file doesn't exist
  - Requires `edit` permission

- **edit_file**
  - Make selective edits using pattern matching and formatting
  - Features:
    - Line-based and multi-line content matching
    - Whitespace normalization with indentation preservation
    - Multiple simultaneous edits with correct positioning
    - Indentation style detection and preservation
    - Git-style diff output with context
    - Preview changes with dry run mode
  - Inputs:
    - `path` (string): File to edit
    - `edits` (array): List of edit operations
      - `oldText` (string): Text to search for (exact match)
      - `newText` (string): Text to replace with
    - `dryRun` (boolean): Preview changes without applying (default: false)
  - Returns detailed diff for dry runs, otherwise applies changes
  - Requires `edit` permission
  - Best Practice: Always use dryRun first to preview changes

- **create_directory**
  - Create new directory or ensure it exists
  - Input: `path` (string)
  - Creates parent directories if needed
  - Succeeds silently if directory exists
  - Requires `create` permission

- **list_directory**
  - List directory contents with [FILE] or [DIR] prefixes
  - Input: `path` (string)
  - Returns detailed listing of files and directories

- **directory_tree**
  - Get recursive tree view of directory structure
  - Input: `path` (string)
  - Returns JSON structure with files and directories
  - Each entry includes name, type, and children (for directories)

- **move_file**
  - Move or rename files and directories
  - Inputs:
    - `source` (string): Source path
    - `destination` (string): Destination path
  - Fails if destination exists
  - Works for both files and directories
  - Requires `move` permission

- **delete_file**
  - Delete a file
  - Input: `path` (string)
  - Fails if file doesn't exist
  - Requires `delete` permission

- **delete_directory**
  - Delete a directory
  - Inputs:
    - `path` (string): Directory to delete
    - `recursive` (boolean): Whether to delete contents (default: false)
  - Fails if directory is not empty and recursive is false
  - Requires `delete` permission

- **search_files**
  - Recursively search for files/directories
  - Inputs:
    - `path` (string): Starting directory
    - `pattern` (string): Search pattern
    - `excludePatterns` (string[]): Exclude patterns (glob format supported)
  - Case-insensitive matching
  - Returns full paths to matches

- **find_files_by_extension**
  - Find all files with specific extension
  - Inputs:
    - `path` (string): Starting directory
    - `extension` (string): File extension to find
    - `excludePatterns` (string[]): Optional exclude patterns
  - Case-insensitive extension matching
  - Returns full paths to matching files

- **get_file_info**
  - Get detailed file/directory metadata
  - Input: `path` (string)
  - Returns:
    - Size
    - Creation time
    - Modified time
    - Access time
    - Type (file/directory)
    - Permissions

- **get_permissions**
  - Get current server permissions
  - No input required
  - Returns:
    - Permission flags (readonly, fullAccess, create, edit, move, delete)
    - Symlink following status
    - Number of allowed directories

- **list_allowed_directories**
  - List all directories the server is allowed to access
  - No input required
  - Returns array of allowed directory paths

- **xml_to_json**
  - Convert XML file to JSON format
  - Inputs:
    - `xmlPath` (string): Source XML file
    - `jsonPath` (string): Destination JSON file
    - `options` (object): Optional settings
      - `ignoreAttributes` (boolean): Skip XML attributes (default: false)
      - `preserveOrder` (boolean): Maintain property order (default: true)
      - `format` (boolean): Pretty print JSON (default: true)
      - `indentSize` (number): JSON indentation (default: 2)
  - Requires `read` permission for XML file
  - Requires `create` or `edit` permission for JSON file

- **xml_to_json_string**
  - Convert XML file to JSON string
  - Inputs:
    - `xmlPath` (string): Source XML file
    - `options` (object): Optional settings
      - `ignoreAttributes` (boolean): Skip XML attributes (default: false)
      - `preserveOrder` (boolean): Maintain property order (default: true)
  - Requires `read` permission for XML file
  - Returns JSON string representation

- **xml_query**
  - Query XML file using XPath expressions
  - Inputs:
    - `path` (string): Path to the XML file
    - `query` (string, optional): XPath query to execute
    - `structureOnly` (boolean, optional): Return only tag structure
    - `maxBytes` (number, optional): Maximum bytes to read (default: 1MB)
    - `includeAttributes` (boolean, optional): Include attribute info (default: true)
  - XPath examples:
    - Get all elements: `//tagname`
    - Get elements with specific attribute: `//tagname[@attr="value"]`
    - Get text content: `//tagname/text()`
  - Memory efficient for large XML files
  - Returns JSON representation of query results or structure

- **xml_structure**
  - Analyze XML structure without reading entire file
  - Inputs:
    - `path` (string): Path to the XML file
    - `depth` (number, optional): How deep to analyze (default: 2)
    - `includeAttributes` (boolean, optional): Include attribute analysis
    - `maxBytes` (number, optional): Maximum bytes to read (default: 1MB)
  - Returns statistical information about elements, attributes, and structure
  - Useful for understanding large XML files before detailed analysis

## Permissions & Security

The server implements a comprehensive security model with granular permission controls:

### Directory Access Control
- Operations are strictly limited to directories specified during startup via `args`
- All operations (including symlink targets) must remain within allowed directories
- Path validation ensures no directory traversal or access outside allowed paths

### Permission Flags
- **--readonly**: Enforces read-only mode, overriding all other permission flags
- **--full-access**: Enables all operations (create, edit, move, delete)
- Individual permission flags (require explicit enabling unless --full-access is set):
  - **--allow-create**: Allow creation of new files and directories
  - **--allow-edit**: Allow modification of existing files
  - **--allow-move**: Allow moving/renaming files and directories
  - **--allow-delete**: Allow deletion of files and directories

**Default Behavior**: If no permission flags are specified, the server runs in read-only mode. To enable any write operations, you must use either `--full-access` or specific `--allow-*` flags.

### Symlink Handling
- By default, symlinks are followed (both link and target must be in allowed directories)
- **--no-follow-symlinks**: Disable symlink following (operations act on the link itself)

## Usage with Claude Desktop and Cursor

Add appropriate configuration to either `claude_desktop_config.json` (for Claude Desktop) or `.cursor/mcp.json` (for Cursor):

### Cursor Configuration

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-filesystem": {
      "command": "node",
      "args": [
        "/path/to/mcp-filesystem/dist/index.js",
        "~/path/to/allowed/directory",
        "--full-access"
      ]
    }
  }
}
```

### Docker Configuration

For Claude Desktop with Docker:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--mount", "type=bind,src=/Users/username/Desktop,dst=/projects/Desktop",
        "--mount", "type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro",
        "--mount", "type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt",
        "mcp/filesystem",
        "--readonly",                    // For read-only access
        "--no-follow-symlinks",         // Optional: prevent symlink following
        "/projects"
      ]
    }
  }
}
```

### NPX Configuration

For either Claude Desktop or Cursor with NPX:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--full-access",                // For full read/write access
        "/Users/username/Desktop",
        "/path/to/other/allowed/dir"
      ]
    }
  }
}
```

### Permission Flag Examples

You can configure the server with various permission combinations:

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "~/path/to/allowed/directory",
  "--readonly"                         // Read-only mode
]
```

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "~/path/to/allowed/directory",
  "--full-access",                    // Full read/write access
  "--no-follow-symlinks"              // Don't follow symlinks
]
```

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "~/path/to/allowed/directory",
  "--allow-create",                   // Selective permissions
  "--allow-edit"                      // Only allow creation and editing
]
```

Note: `--readonly` takes precedence over all other permission flags, and `--full-access` enables all operations unless `--readonly` is specified.

### Multiple Directories and Permissions

When specifying multiple directories, permission flags apply **globally** to all directories:

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "~/first/directory",                // Both directories have the same
  "~/second/directory",               // permission settings (read-only)
  "--readonly"
]
```

If you need different permission levels for different directories, create multiple server configurations:

```json
{
  "mcpServers": {
    "readonly-filesystem": {
      "command": "node",
      "args": [
        "/path/to/mcp-filesystem/dist/index.js",
        "~/sensitive/directory",
        "--readonly"
      ]
    },
    "writeable-filesystem": {
      "command": "node",
      "args": [
        "/path/to/mcp-filesystem/dist/index.js",
        "~/sandbox/directory",
        "--full-access"
      ]
    }
  }
}
```

### Command Line Examples

1. Read-only access:
```bash
npx -y @modelcontextprotocol/server-filesystem --readonly /path/to/dir
```

2. Full access:
```bash
npx -y @modelcontextprotocol/server-filesystem --full-access /path/to/dir
```

3. Specific permissions:
```bash
npx -y @modelcontextprotocol/server-filesystem --allow-create --allow-edit /path/to/dir
```

4. No symlink following:
```bash
npx -y @modelcontextprotocol/server-filesystem --full-access --no-follow-symlinks /path/to/dir
```

## Build

Docker build:

```bash
docker build -t mcp/filesystem -f src/filesystem/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
`````

## File: .cursor/mcp.json
`````json
{
	"mcpServers": {
		"filesystem-mcp-knowledge-graph": {
			"transport": "sse",
			"url": "http://localhost:8001/sse"
		},
		"filesystem-mcp-directory": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/",
				"--no-follow-symlinks",
				"--readonly"
			]
		},
		"mcp-test-readonly": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--readonly"
			]
		},
		"mcp-test-full-access": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--full-access"
			]
		},
		"mcp-test-readonly-override": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--full-access",
				"--readonly"
			]
		},
		"mcp-test-create-only": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-create"
			]
		},
		"mcp-test-edit-only": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-edit"
			]
		},
		"mcp-test-move-only": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-move"
			]
		},
		"mcp-test-rename-tool": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-rename"
			]
		},
		"mcp-test-create-and-edit": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-create",
				"--allow-edit"
			]
		},
		"mcp-test-delete-only": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test",
				"--allow-delete"
			]
		},
		"mcp-test-default": {
			"command": "node",
			"args": [
				"/Users/mateicanavra/Documents/.nosync/DEV/mcp-servers/mcp-filesystem/dist/index.js",
				"~/Desktop/mcp-test"
			]
		}
	}
}
`````

## File: package.json
`````json
{
  "name": "@modelcontextprotocol/server-filesystem",
  "version": "0.6.2",
  "description": "MCP server for filesystem access",
  "license": "MIT",
  "author": "Anthropic, PBC (https://anthropic.com)",
  "homepage": "https://modelcontextprotocol.io",
  "bugs": "https://github.com/modelcontextprotocol/servers/issues",
  "type": "module",
  "bin": {
    "mcp-server-filesystem": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc && shx chmod +x dist/*.js",
    "prepare": "npm run build",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "0.5.0",
    "ajv": "^8.17.1",
    "diff": "^5.1.0",
    "fast-xml-parser": "^5.0.9",
    "glob": "^10.3.10",
    "jsonata": "^2.0.6",
    "jsonpath-plus": "^10.3.0",
    "lodash": "^4.17.21",
    "lodash-es": "^4.17.21",
    "minimatch": "^10.0.1",
    "xmldom": "^0.6.0",
    "xpath": "^0.0.34",
    "zod": "^3.24.2",
    "zod-to-json-schema": "^3.23.5"
  },
  "devDependencies": {
    "@types/diff": "^5.0.9",
    "@types/jsonpath-plus": "^5.0.5",
    "@types/lodash": "^4.17.16",
    "@types/minimatch": "^5.1.2",
    "@types/node": "^22",
    "@types/xmldom": "^0.1.34",
    "shx": "^0.3.4",
    "typescript": "^5.3.3"
  }
}
`````

## File: index.ts
`````typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import os from 'os';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { diffLines, createTwoFilesPatch } from 'diff';
import { minimatch } from 'minimatch';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { handleXmlQuery, handleXmlStructure } from './src/handlers/xml-handlers.js';
import { XmlQueryArgsSchema, XmlStructureArgsSchema } from './src/schemas/utility-operations.js';
import { searchFiles, findFilesByExtension, FileInfo } from './src/utils/file-utils.js';
import { normalizePath, expandHome, validatePath } from './src/utils/path-utils.js';
import {
  handleJsonQuery,
  handleJsonFilter,
  handleJsonGetValue,
  handleJsonTransform,
  handleJsonStructure,
  handleJsonSample,
  handleJsonValidate,
  handleJsonSearchKv
} from './src/handlers/json-handlers.js';
import {
  JsonQueryArgsSchema,
  JsonFilterArgsSchema,
  JsonGetValueArgsSchema,
  JsonTransformArgsSchema,
  JsonStructureArgsSchema,
  JsonSampleArgsSchema,
  JsonValidateArgsSchema,
  JsonSearchKvArgsSchema
} from './src/schemas/json-operations.js';
import {
  handleReadFile,
  handleReadMultipleFiles,
  handleCreateFile,
  handleModifyFile,
  handleEditFile,
  handleGetFileInfo,
  handleMoveFile,
  handleDeleteFile,
  handleRenameFile
} from './src/handlers/file-handlers.js';
import {
  handleCreateDirectory,
  handleListDirectory,
  handleDirectoryTree,
  handleDeleteDirectory
} from './src/handlers/directory-handlers.js';
import {
  handleSearchFiles,
  handleFindFilesByExtension,
  handleGetPermissions,
  handleXmlToJson,
  handleXmlToJsonString,
  handleListAllowedDirectories
} from './src/handlers/utility-handlers.js';

// Command line argument parsing
const args = process.argv.slice(2);
// Parse flags
const readonlyFlag = args.includes('--readonly');
const noFollowSymlinks = args.includes('--no-follow-symlinks');
const fullAccessFlag = args.includes('--full-access');

// Granular permission flags
const allowCreate = args.includes('--allow-create');
const allowEdit = args.includes('--allow-edit');
const allowMove = args.includes('--allow-move');
const allowDelete = args.includes('--allow-delete');
const allowRename = args.includes('--allow-rename');

// Permission calculation
// readonly flag overrides all other permissions as a safety mechanism
// fullAccess enables all permissions unless readonly is set
// individual allow flags enable specific permissions unless readonly is set
const permissions = {
  create: !readonlyFlag && (fullAccessFlag || allowCreate),
  edit: !readonlyFlag && (fullAccessFlag || allowEdit),
  move: !readonlyFlag && (fullAccessFlag || allowMove),
  delete: !readonlyFlag && (fullAccessFlag || allowDelete),
  rename: !readonlyFlag && (fullAccessFlag || allowRename),
  // fullAccess is true only if the flag is explicitly set and not in readonly mode
  fullAccess: !readonlyFlag && fullAccessFlag
};

// Remove flags from args
if (readonlyFlag) {
  args.splice(args.indexOf('--readonly'), 1);
}
if (noFollowSymlinks) {
  args.splice(args.indexOf('--no-follow-symlinks'), 1);
}
if (fullAccessFlag) {
  args.splice(args.indexOf('--full-access'), 1);
}
if (allowCreate) {
  args.splice(args.indexOf('--allow-create'), 1);
}
if (allowEdit) {
  args.splice(args.indexOf('--allow-edit'), 1);
}
if (allowMove) {
  args.splice(args.indexOf('--allow-move'), 1);
}
if (allowDelete) {
  args.splice(args.indexOf('--allow-delete'), 1);
}
if (allowRename) {
  args.splice(args.indexOf('--allow-rename'), 1);
}

if (args.length === 0) {
  console.error("Usage: mcp-server-filesystem [--full-access] [--readonly] [--no-follow-symlinks] [--allow-create] [--allow-edit] [--allow-move] [--allow-delete] [--allow-rename] <allowed-directory> [additional-directories...]");
  process.exit(1);
}

// Store allowed directories in normalized form
const allowedDirectories = args.map(dir =>
  normalizePath(path.resolve(expandHome(dir)))
);

// Create a map to store the mapping between symlinks and their real paths
const symlinksMap = new Map<string, string>();

// Validate that all directories exist and are accessible
await Promise.all(args.map(async (dir) => {
  try {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      console.error(`Error: ${dir} is not a directory`);
      process.exit(1);
    }
    
    // Store symlink mappings for all provided directories
    try {
      const realPath = await fs.realpath(dir);
      if (realPath !== dir) {
        const normalizedDir = normalizePath(path.resolve(expandHome(dir)));
        const normalizedRealPath = normalizePath(realPath);
        symlinksMap.set(normalizedRealPath, normalizedDir);
        // Also add the real path to allowed directories if it's a symlink
        if (!allowedDirectories.includes(normalizedRealPath)) {
          allowedDirectories.push(normalizedRealPath);
        }
        // Validate the real path
        await validatePath(normalizedRealPath, allowedDirectories, symlinksMap, noFollowSymlinks);
      }
      // Validate the original path
      await validatePath(dir, allowedDirectories, symlinksMap, noFollowSymlinks);
    } catch (error) {
      // If we can't resolve the real path, just continue
      console.error(`Warning: Could not resolve real path for ${dir}:`, error);
    }
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    process.exit(1);
  }
}));

// Schema definitions
const ReadFileArgsSchema = z.object({
  path: z.string(),
});

const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

const GetPermissionsArgsSchema = z.object({});

const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const EditOperation = z.object({
  oldText: z.string().describe('Text to search for - must match exactly'),
  newText: z.string().describe('Text to replace with')
});

const EditFileArgsSchema = z.object({
  path: z.string(),
  edits: z.array(EditOperation),
  dryRun: z.boolean().default(false).describe('Preview changes using git-style diff format')
});

const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

const DirectoryTreeArgsSchema = z.object({
  path: z.string(),
});

const MoveFileArgsSchema = z.object({
  source: z.string(),
  destination: z.string(),
});

const SearchFilesArgsSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional().default([])
});

const FindFilesByExtensionArgsSchema = z.object({
  path: z.string(),
  extension: z.string().describe('File extension to search for (e.g., "xml", "json", "ts")'),
  excludePatterns: z.array(z.string()).optional().default([])
});

const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

const DeleteFileArgsSchema = z.object({
  path: z.string(),
});

const DeleteDirectoryArgsSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false).describe('Whether to recursively delete the directory and all contents')
});

const RenameFileArgsSchema = z.object({
  path: z.string().describe('Path to the file to be renamed'),
  newName: z.string().describe('New name for the file (without path)')
});

const XmlToJsonArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  jsonPath: z.string().describe('Path where the JSON should be saved'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties'),
    format: z.boolean().default(true).describe('Whether to format the JSON output'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation')
  }).optional().default({})
});

const XmlToJsonStringArgsSchema = z.object({
  xmlPath: z.string().describe('Path to the XML file to convert'),
  options: z.object({
    ignoreAttributes: z.boolean().default(false).describe('Whether to ignore attributes in XML'),
    preserveOrder: z.boolean().default(true).describe('Whether to preserve the order of properties')
  }).optional().default({})
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Server setup
const server = new Server(
  {
    name: "secure-filesystem-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Define all tools
  const allTools = [
    // Read-only tools
    {
      name: "read_file",
      description:
        "Read the complete contents of a file from the file system. " +
        "Handles various text encodings and provides detailed error messages " +
        "if the file cannot be read. Use this tool when you need to examine " +
        "the contents of a single file. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ReadFileArgsSchema) as ToolInput,
    },
    {
      name: "read_multiple_files",
      description:
        "Read the contents of multiple files simultaneously. This is more " +
        "efficient than reading files one by one when you need to analyze " +
        "or compare multiple files. Each file's content is returned with its " +
        "path as a reference. Failed reads for individual files won't stop " +
        "the entire operation. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ReadMultipleFilesArgsSchema) as ToolInput,
    },
    {
      name: "list_directory",
      description:
        "Get a detailed listing of all files and directories in a specified path. " +
        "Results clearly distinguish between files and directories with [FILE] and [DIR] " +
        "prefixes. This tool is essential for understanding directory structure and " +
        "finding specific files within a directory. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(ListDirectoryArgsSchema) as ToolInput,
    },
    {
      name: "directory_tree",
      description:
          "Get a recursive tree view of files and directories as a JSON structure. " +
          "Each entry includes 'name', 'type' (file/directory), and 'children' for directories. " +
          "Files have no children array, while directories always have a children array (which may be empty). " +
          "The output is formatted with 2-space indentation for readability. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(DirectoryTreeArgsSchema) as ToolInput,
    },
    {
      name: "search_files",
      description:
        "Recursively search for files and directories matching a pattern. " +
        "Searches through all subdirectories from the starting path. The search " +
        "is case-insensitive and matches partial names. Returns full paths to all " +
        "matching items. Great for finding files when you don't know their exact location. " +
        "Only searches within allowed directories.",
      inputSchema: zodToJsonSchema(SearchFilesArgsSchema) as ToolInput,
    },
    {
      name: "find_files_by_extension",
      description:
        "Recursively find all files with a specific extension. " +
        "Searches through all subdirectories from the starting path. " +
        "Extension matching is case-insensitive. Returns full paths to all " +
        "matching files. Perfect for finding all XML, JSON, or other file types " +
        "in a directory structure. Only searches within allowed directories.",
      inputSchema: zodToJsonSchema(FindFilesByExtensionArgsSchema) as ToolInput,
    },
    {
      name: "get_file_info",
      description:
        "Retrieve detailed metadata about a file or directory. Returns comprehensive " +
        "information including size, creation time, last modified time, permissions, " +
        "and type. This tool is perfect for understanding file characteristics " +
        "without reading the actual content. Only works within allowed directories.",
      inputSchema: zodToJsonSchema(GetFileInfoArgsSchema) as ToolInput,
    },
    {
      name: "list_allowed_directories",
      description:
        "Returns the list of directories that this server is allowed to access. " +
        "Use this to understand which directories are available before trying to access files.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    
    // New get_permissions tool
    {
      name: "get_permissions",
      description:
        "Returns the current permission state of the server, including which operations " +
        "are allowed (create, edit, move, delete) and whether the server is in read-only mode " +
        "or has full access. Use this to understand what operations are permitted before " +
        "attempting them.",
      inputSchema: zodToJsonSchema(GetPermissionsArgsSchema) as ToolInput,
    },
    
    // Write tools (filtered based on permissions)
    {
      name: "create_file",
      description:
        "Create a new file with the specified content. " +
        "Will fail if the file already exists. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput,
    },
    {
      name: "modify_file",
      description:
        "COMPLETELY REPLACE the contents of an existing file with new content. " +
        "Use this tool when you need to overwrite an entire file, not for making partial changes. " +
        "COMPARE WITH edit_file: modify_file replaces the entire file content while edit_file makes targeted changes to specific sections. " +
        "Will fail if the file does not exist. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput,
    },
    {
      name: "edit_file",
      description:
        "Make TARGETED CHANGES to specific parts of a text file while preserving the rest. " +
        "Each edit operation finds and replaces specific text sequences with new content. " +
        "COMPARE WITH modify_file: edit_file makes partial changes while modify_file completely replaces file content. " +
        "Returns a git-style diff showing the changes made. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-edit permission.",
      inputSchema: zodToJsonSchema(EditFileArgsSchema) as ToolInput,
    },
    {
      name: "create_directory",
      description:
        "Create a new directory structure at the specified path. " +
        "Can create multiple nested directories in one operation (mkdir -p behavior). " +
        "If the directory already exists, this operation will succeed silently. " +
        "COMPARE WITH move_file: create_directory creates new directories while move_file moves existing files/directories. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-create permission.",
      inputSchema: zodToJsonSchema(CreateDirectoryArgsSchema) as ToolInput,
    },
    {
      name: "move_file",
      description:
        "Move or rename files and directories to a new location. " +
        "IMPORTANT: The destination parent directory must already exist - this tool doesn't create directories. " +
        "COMPARE WITH create_directory: move_file relocates existing files/directories but doesn't create new directory structures. " +
        "If the destination path already exists, the operation will fail. " +
        "Both source and destination must be within allowed directories. " +
        "This tool requires the --allow-move permission.",
      inputSchema: zodToJsonSchema(MoveFileArgsSchema) as ToolInput,
    },
    {
      name: "rename_file",
      description:
        "Rename a file within its current directory. " +
        "COMPARE WITH move_file: rename_file only changes the filename while keeping it in the same directory. " +
        "Will fail if a file with the new name already exists in the directory. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-rename permission.",
      inputSchema: zodToJsonSchema(RenameFileArgsSchema) as ToolInput,
    },
    {
      name: "xml_query",
      description:
        "Query XML file using XPath expressions. Provides powerful search " +
        "capabilities without reading the entire file into memory. " +
        "Supports standard XPath 1.0 query syntax for finding elements, attributes, " +
        "and text content. Can be used to extract specific data from large XML files " +
        "with precise queries. The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(XmlQueryArgsSchema) as ToolInput,
    },
    {
      name: "xml_structure",
      description:
        "Analyze XML file structure without reading the entire file. " +
        "Returns statistical information about element counts, attribute usage, " +
        "namespaces, and hierarchical structure. Useful for understanding the " +
        "structure of large XML files before performing detailed queries. " +
        "The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(XmlStructureArgsSchema) as ToolInput,
    },
    {
      name: "xml_to_json",
      description:
        "Convert an XML file to JSON format and optionally save it to a new file. " +
        "Uses fast-xml-parser for efficient and reliable conversion. " +
        "Supports various options like preserving attribute information " +
        "and formatting the output. Both input and output paths must be " +
        "within allowed directories. " +
        "NOTE: This tool is always available for parsing XML, but saving the output " +
        "to a file requires the --allow-create permission. Use xml_to_json_string for " +
        "read-only operations.",
      inputSchema: zodToJsonSchema(XmlToJsonArgsSchema) as ToolInput,
    },
    {
      name: "xml_to_json_string",
      description:
        "Convert an XML file to a JSON string and return it directly. " +
        "This is useful for quickly inspecting XML content as JSON without " +
        "creating a new file. Uses fast-xml-parser for conversion. " +
        "The input path must be within allowed directories. " +
        "This tool is fully functional in both readonly and write modes since " +
        "it only reads the XML file and returns the parsed data.",
      inputSchema: zodToJsonSchema(XmlToJsonStringArgsSchema) as ToolInput,
    },
    {
      name: "delete_file",
      description:
        "Delete a SINGLE FILE at the specified path. " +
        "COMPARE WITH delete_directory: delete_file only works on individual files and will fail if used on directories. " +
        "Will fail if the file does not exist or if the path points to a directory. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: zodToJsonSchema(DeleteFileArgsSchema) as ToolInput,
    },
    {
      name: "delete_directory",
      description:
        "Delete a DIRECTORY at the specified path. " +
        "COMPARE WITH delete_file: delete_directory is for removing directories while delete_file is for individual files. " +
        "By default, will fail if the directory is not empty - set recursive=true to delete all contents. " +
        "Only works within allowed directories. " +
        "This tool requires the --allow-delete permission.",
      inputSchema: zodToJsonSchema(DeleteDirectoryArgsSchema) as ToolInput,
    },
    // JSON tools
    {
      name: "json_query",
      description:
        "Query JSON data using JSONPath expressions. Provides powerful search " +
        "capabilities for selecting data within JSON structures. Supports standard " +
        "JSONPath syntax for finding values, arrays, and nested structures. " +
        "The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonQueryArgsSchema) as ToolInput,
    },
    {
      name: "json_structure",
      description:
        "Get the structure of a JSON file by analyzing its top-level keys and their types. " +
        "Returns a mapping of key names to their corresponding data types (string, number, array, etc). " +
        "For arrays, it also indicates the type of the first element if available. " +
        "This is useful for understanding the shape of large JSON files without loading their entire content. " +
        "The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonStructureArgsSchema) as ToolInput,
    },
    {
      name: "json_filter",
      description:
        "Filter JSON array data using flexible conditions. Supports various comparison " +
        "operators (equals, greater than, contains, etc.) and can combine multiple " +
        "conditions with AND/OR logic. Perfect for filtering collections of objects " +
        "based on their properties. The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonFilterArgsSchema) as ToolInput,
    },
    {
      name: "json_get_value",
      description:
        "Get a specific value from a JSON file using a field path. Supports dot notation " +
        "for accessing nested properties and array indices. Returns the value directly, " +
        "properly formatted. The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonGetValueArgsSchema) as ToolInput,
    },
    {
      name: "json_transform",
      description:
        "Transform JSON data using a sequence of operations. Supports operations like " +
        "mapping array elements, grouping by fields, sorting, flattening nested arrays, " +
        "and picking/omitting fields. Operations are applied in sequence to transform " +
        "the data structure. The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonTransformArgsSchema) as ToolInput,
    },
    {
      name: "json_sample",
      description:
        "Sample JSON data from a JSON file. Returns a random sample of data from the JSON file. " +
        "The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonSampleArgsSchema) as ToolInput,
    },
    {
      name: "json_validate",
      description:
        "Validate JSON data against a JSON schema. Returns true if the JSON data is valid against the schema, " +
        "or false if it is not. The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonValidateArgsSchema) as ToolInput,
    },
    {
      name: "json_search_kv",
      description:
        "Search for key-value pairs in a JSON file. Returns all key-value pairs that match the search pattern. " +
        "The path must be within allowed directories.",
      inputSchema: zodToJsonSchema(JsonSearchKvArgsSchema) as ToolInput,
    },
  ];

  // Filter tools based on permissions
  const tools = !permissions.fullAccess ? allTools.filter(tool => {
    // These tools are always available
    if (['read_file', 'read_multiple_files', 'list_directory', 'directory_tree', 
         'search_files', 'find_files_by_extension', 'get_file_info', 
         'list_allowed_directories', 'xml_to_json_string', 'get_permissions',
         'xml_query', 'xml_structure',
         'json_query', 'json_filter', 'json_get_value', 'json_transform', 'json_structure', 'json_sample', 'json_validate', 'json_search_kv'].includes(tool.name)) {
      return true;
    }

    // Split write_file into two separate tools
    if (permissions.create && tool.name === 'create_file') {
      return true;
    }

    if (permissions.edit && tool.name === 'modify_file') {
      return true;
    }

    // Other permission tools remain the same
    if (permissions.create && ['create_directory', 'xml_to_json'].includes(tool.name)) {
      return true;
    }

    if (permissions.edit && ['edit_file'].includes(tool.name)) {
      return true;
    }

    if (permissions.move && ['move_file'].includes(tool.name)) {
      return true;
    }
    
    if (permissions.rename && ['rename_file'].includes(tool.name)) {
      return true;
    }

    if (permissions.delete && ['delete_file', 'delete_directory'].includes(tool.name)) {
      return true;
    }

    return false;
  }) : allTools;

  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_file": {
        return await handleReadFile(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "read_multiple_files": {
        return await handleReadMultipleFiles(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "create_file": {
        return await handleCreateFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "modify_file": {
        return await handleModifyFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "edit_file": {
        return await handleEditFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "create_directory": {
        return await handleCreateDirectory(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "list_directory": {
        return await handleListDirectory(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "directory_tree": {
        return await handleDirectoryTree(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "move_file": {
        return await handleMoveFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "rename_file": {
        return await handleRenameFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "delete_directory": {
        return await handleDeleteDirectory(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "search_files": {
        return await handleSearchFiles(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "find_files_by_extension": {
        return await handleFindFilesByExtension(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "get_file_info": {
        return await handleGetFileInfo(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "list_allowed_directories": {
        return handleListAllowedDirectories(args, allowedDirectories);
      }

      case "get_permissions": {
        return handleGetPermissions(args, permissions, readonlyFlag, noFollowSymlinks, allowedDirectories);
      }

      case "xml_query": {
        return await handleXmlQuery(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "xml_structure": {
        return await handleXmlStructure(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "xml_to_json": {
        return await handleXmlToJson(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }
      
      case "xml_to_json_string": {
        return await handleXmlToJsonString(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "delete_file": {
        return await handleDeleteFile(args, permissions, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_query": {
        return await handleJsonQuery(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_structure": {
        return await handleJsonStructure(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_filter": {
        return await handleJsonFilter(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_get_value": {
        return await handleJsonGetValue(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_transform": {
        return await handleJsonTransform(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_sample": {
        return await handleJsonSample(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_validate": {
        return await handleJsonValidate(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      case "json_search_kv": {
        return await handleJsonSearchKv(args, allowedDirectories, symlinksMap, noFollowSymlinks);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Secure MCP Filesystem Server running on stdio");
  console.error("Allowed directories:", allowedDirectories);
  
  // Log permission state
  const permState = [];
  if (readonlyFlag) {
    console.error("Server running in read-only mode (--readonly flag overrides all other permissions)");
  } else if (permissions.fullAccess) {
    console.error("Server running with full access (all operations enabled via --full-access)");
  } else {
    if (permissions.create) permState.push("create");
    if (permissions.edit) permState.push("edit");
    if (permissions.move) permState.push("move");
    if (permissions.rename) permState.push("rename");
    if (permissions.delete) permState.push("delete");
    if (permState.length === 0) {
      console.error("Server running in default read-only mode (use --full-access or specific --allow-* flags to enable write operations)");
    } else {
      console.error(`Server running with specific permissions enabled: ${permState.join(", ")}`);
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
`````
