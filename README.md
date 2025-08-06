# Filesystem MCP Server

Bun-based server implementing Model Context Protocol (MCP) for filesystem operations with comprehensive permission controls and enhanced functionality.

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

## Installation

1. **Install Bun** (requires Bun v1.0 or later)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. **Install dependencies**
   ```bash
   bun install
   ```
3. **Build the project** (required for Node runtimes)
   ```bash
   bun run build
   ```
4. **Run tests**
   ```bash
   bun test
   ```

## Configuration options

Paths may include environment variables like `$HOME`, `${CUSTOM}`, or `%USERPROFILE%` to reference user-specific locations. Choose one of the following ways to run the server:

### Local (Node/Bun)
If you have the repository cloned locally.

```json
{
  "command": "node",
  "args": ["/path/to/mcp-filesystem/dist/index.js", "$HOME/allowed-directory"]
}
```

Using Bun without a build step:

```json
{
  "command": "bun",
  "args": ["/path/to/mcp-filesystem/index.ts", "$HOME/allowed-directory"]
}
```

### Git hosted (bunx/npx)
If you want to run directly from the public git repo without cloning.

```json
{
  "command": "bunx",
  "args": ["github:rawr-ai/mcp-filesystem", "$HOME/allowed-directory"]
}
```

```json
{
  "command": "npx",
  "args": ["github:rawr-ai/mcp-filesystem", "$HOME/allowed-directory"]
}
```

### NPM package (coming soon)
If you prefer using an npm package once published.

```json
{
  "command": "bunx",
  "args": ["rawr-ai/mcp-filesystem", "$HOME/allowed-directory"]
}
```

```json
{
  "command": "npx",
  "args": ["rawr-ai/mcp-filesystem", "$HOME/allowed-directory"]
}
```

### Docker
If you need an isolated container environment.

```json
{
  "command": "docker",
  "args": ["run", "--rm", "-v", "$HOME/allowed-directory:/data", "rawr-ai/mcp-filesystem", "/data"]
}
```

### Glama.ai / others (coming soon)
If you plan to use a hosted MCP server service.

```json
{
  "mcpServers": {
    "filesystem-glama": {
      "url": "https://glama.ai/rawr-ai/mcp-filesystem"
    }
  }
}
```

## API

### Resources

- `file://system`: File system operations interface

### Tools

All tool argument schemas are defined with [TypeBox](https://github.com/sinclairzx81/typebox) and registered via the `toolSchemas` map in `src/schemas`. This ensures every tool shares a consistent schema that handlers can reference.

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

### Argument Validation

The server validates all tool inputs using the `parseArgs` helper. `parseArgs` parses incoming data against the appropriate TypeBox schema and throws an error when the arguments do not match the expected structure.

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
        "$HOME/path/to/allowed/directory",
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
        "--mount", "type=bind,src=$HOME/Desktop,dst=/projects/Desktop",
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

### Bunx Configuration

For either Claude Desktop or Cursor with Bunx:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": [
          "@modelcontextprotocol/server-filesystem",
        "--full-access",                // For full read/write access
        "$HOME/Desktop",
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
  "$HOME/path/to/allowed/directory",
  "--readonly"                         // Read-only mode
]
```

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "$HOME/path/to/allowed/directory",
  "--full-access",                    // Full read/write access
  "--no-follow-symlinks"              // Don't follow symlinks
]
```

```json
"args": [
  "/path/to/mcp-filesystem/dist/index.js",
  "$HOME/path/to/allowed/directory",
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
  "$HOME/first/directory",                // Both directories have the same
  "$HOME/second/directory",               // permission settings (read-only)
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
        "$HOME/sensitive/directory",
        "--readonly"
      ]
    },
      "writeable-filesystem": {
        "command": "node",
      "args": [
        "/path/to/mcp-filesystem/dist/index.js",
        "$HOME/sandbox/directory",
        "--full-access"
      ]
    }
  }
}
```

### Command Line Examples

1. Read-only access:
```bash
bunx @modelcontextprotocol/server-filesystem --readonly /path/to/dir
```

2. Full access:
```bash
bunx @modelcontextprotocol/server-filesystem --full-access /path/to/dir
```

3. Specific permissions:
```bash
bunx @modelcontextprotocol/server-filesystem --allow-create --allow-edit /path/to/dir
```

4. No symlink following:
```bash
bunx @modelcontextprotocol/server-filesystem --full-access --no-follow-symlinks /path/to/dir
```

## Build

To compile the project locally run:

```bash
bun run build
```

Run the test suite with:

```bash
bun test
```

Docker build:

```bash
docker build -t mcp/filesystem -f Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
