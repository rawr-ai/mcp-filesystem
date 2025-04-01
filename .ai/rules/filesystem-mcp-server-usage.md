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