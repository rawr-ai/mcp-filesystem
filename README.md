# Filesystem MCP Server

Bun-based server implementing Model Context Protocol (MCP) for filesystem operations with comprehensive permission controls and enhanced functionality.

Development uses [Bun](https://bun.sh/) and the server can run directly from TypeScript with `bun`, but most MCP clients execute Node-compatible JavaScript. Use `node dist/index.js` in configs unless you're intentionally running the TypeScript entry with Bun.

<a href="https://glama.ai/mcp/servers/@rawr-ai/mcp-filesystem">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@rawr-ai/mcp-filesystem/badge" alt="Filesystem Server MCP server" />
</a>

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

Paths may include environment variables like `$HOME`, `${CUSTOM}`, or `%USERPROFILE%`. Choose the modality that fits your setup:

### Local (Node or Bun)
Use Node for built JavaScript or Bun to run TypeScript directly.
```json
{ "command": "node", "args": ["/path/to/mcp-filesystem/dist/index.js", "$HOME/allowed-directory"] }
```
```json
{ "command": "bun",  "args": ["/path/to/mcp-filesystem/index.ts", "$HOME/allowed-directory"] }
```

### Git hosted
Run straight from the public repo without cloning.
```json
{ "command": "bunx", "args": ["github:rawr-ai/mcp-filesystem", "$HOME/allowed-directory"] }
```
```json
{ "command": "npx",  "args": ["github:rawr-ai/mcp-filesystem", "$HOME/allowed-directory"] }
```

### NPM package (coming soon)
Planned publication to `rawr-ai/mcp-filesystem`.
```json
{ "command": "bunx", "args": ["rawr-ai/mcp-filesystem", "$HOME/allowed-directory"] }
```
```json
{ "command": "npx",  "args": ["rawr-ai/mcp-filesystem", "$HOME/allowed-directory"] }
```

### Docker
Isolated container environment.
```json
{ "command": "docker", "args": ["run", "--rm", "-v", "$HOME/allowed-directory:/data", "mcp/filesystem", "/data"] }
```

### Hosted service
For managed MCP hosts like glama.ai.
```json
{ "mcpServers": { "filesystem": { "url": "https://glama.ai/rawr-ai/mcp-filesystem" } } }
```

See the `examples/` directory for platform-specific configs (Cursor, Roo, etc.) and additional path variants.

## API

### Resources

- `file://system`: File system operations interface

### Tools

All tool argument schemas are defined with [TypeBox](https://github.com/sinclairzx81/typebox) and registered via the `toolSchemas` map in `src/schemas`. This ensures every tool shares a consistent schema that handlers can reference.

- **read_file**
  - Read contents of a file (response-capped)
  - Inputs:
    - `path` (string)
    - `maxBytes` (number): Maximum bytes to return
  - Returns at most `maxBytes` bytes to protect downstream consumers

- **read_multiple_files**
  - Read multiple files simultaneously
  - Inputs:
    - `paths` (string[])
    - `maxBytesPerFile` (number): Maximum bytes to return per file
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
    - `maxBytes` (number): Maximum bytes to read before editing
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
    - `maxResponseBytes` (number, optional): Maximum size of written JSON; large outputs are summarized
    - `options` (object, optional):
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
    - `maxResponseBytes` (number, optional): Maximum size of returned JSON string; large outputs are summarized
    - `options` (object, optional):
      - `ignoreAttributes` (boolean): Skip XML attributes (default: false)
      - `preserveOrder` (boolean): Maintain property order (default: true)
  - Requires `read` permission for XML file
  - Returns JSON string representation (response-capped)

- **xml_query**
  - Query XML file using XPath expressions
  - Inputs:
    - `path` (string): Path to the XML file
    - `query` (string, optional): XPath query to execute
    - `structureOnly` (boolean, optional): Return only tag structure
    - `includeAttributes` (boolean, optional): Include attribute info (default: true)
    - `maxResponseBytes` (number, optional): Maximum size of returned JSON; defaults to 200KB
      - Legacy `maxBytes` is still accepted and treated as response cap
  - XPath examples:
    - Get all elements: `//tagname`
    - Get elements with specific attribute: `//tagname[@attr="value"]`
    - Get text content: `//tagname/text()`
  - Parses full file; response is truncated to fit limits as needed

- **xml_structure**
  - Analyze XML structure
  - Inputs:
    - `path` (string): Path to the XML file
    - `maxDepth` (number, optional): How deep to analyze (default: 2)
    - `includeAttributes` (boolean, optional): Include attribute analysis (default: true)
    - `maxResponseBytes` (number, optional): Maximum size of returned JSON; defaults to 200KB
      - Legacy `maxBytes` is still accepted and treated as response cap
  - Returns statistical information about elements, attributes, namespaces, and hierarchy
  - Parses full file; returns a summarized structure if response exceeds limit

- **regex_search_content**
  - Search file contents with a regular expression
  - Inputs:
    - `path` (string): Root directory to search
    - `regex` (string): Regular expression pattern
    - `filePattern` (string, optional): Glob to limit files (default: `*`)
    - `maxDepth` (number, optional): Directory depth (default: 2)
    - `maxFileSize` (number, optional): Maximum file size in bytes (default: 10MB)
    - `maxResults` (number, optional): Maximum number of files with matches (default: 50)
  - Returns a human-readable summary of files and matching lines

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
- By default, symlinks are followed when both the link and target are within allowed directories
- **--no-follow-symlinks**: treat symlinks as regular files and refuse to traverse their targets, preventing escapes via linked paths

See `examples/mcp_permissions.json` for sample configurations using these flags.

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