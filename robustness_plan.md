# Plan: Enhance Filesystem Server Robustness

**Goal:** Improve the security and stability of the filesystem MCP server by adding mandatory limits to tools that handle file reading or recursive directory operations.

**Analysis Summary:**
Several tools were identified as having potential risks due to missing or optional limits:
- **File Size Risk:** `read_file`, `read_multiple_files`, `edit_file`, `xml_to_json`, `xml_to_json_string`, `json_*`, `xml_query`, `xml_structure`. Existing optional `maxBytes` parameters will be made mandatory. New `maxBytes` or `maxBytesPerFile` will be added where missing.
- **Recursion/Depth Risk:** `directory_tree`, `search_files`, `find_files_by_extension`, `json_structure`, `json_search_kv`, `xml_structure`. Existing optional `depth` parameters will be standardized to `maxDepth` and made mandatory. New `maxDepth` and `maxResults` will be added where missing.

**Implementation Steps:**

1.  **Standardize Parameter Name:**
    *   Use `maxDepth` consistently for all depth-limiting parameters.
    *   **Action:** Rename existing `depth` parameter to `maxDepth` in the Zod schemas for `directory_tree`, `xml_structure`, and `json_structure`.
        *   `src/schemas/directory-operations.ts`
        *   `src/schemas/utility-operations.ts`
        *   `src/schemas/json-operations.ts`

2.  **Add/Enforce Mandatory `maxBytes` (Default: 10KB):**
    *   **Action:** Make `maxBytes` a mandatory parameter in the Zod schemas for:
        *   `read_file` (`index.ts`)
        *   `edit_file` (`index.ts`)
        *   `xml_to_json` (`src/schemas/utility-operations.ts`)
        *   `xml_to_json_string` (`src/schemas/utility-operations.ts`)
        *   `json_query`, `json_filter`, `json_get_value`, `json_transform`, `json_structure`, `json_sample`, `json_validate`, `json_search_kv` (`src/schemas/json-operations.ts`)
        *   `xml_query`, `xml_structure` (`src/schemas/utility-operations.ts`)
    *   **Action:** Add a mandatory `maxBytesPerFile` parameter to the `read_multiple_files` Zod schema (`index.ts`).
    *   **Default:** Handlers will implement a default limit of `10 * 1024` bytes.

3.  **Add/Enforce Mandatory `maxDepth` / `maxResults` (Defaults: 2 / 10):**
    *   **Action:** Make `maxDepth` mandatory (disallowing non-positive values) in the Zod schemas for:
        *   `directory_tree` (`src/schemas/directory-operations.ts`)
        *   `xml_structure` (`src/schemas/utility-operations.ts`)
        *   `json_structure` (`src/schemas/json-operations.ts`)
    *   **Action:** Add mandatory `maxDepth` and `maxResults` parameters to the Zod schemas for:
        *   `search_files` (`src/schemas/utility-operations.ts`)
        *   `find_files_by_extension` (`src/schemas/utility-operations.ts`)
    *   **Action:** Add a mandatory `maxDepth` parameter to the Zod schema for `json_search_kv` (`src/schemas/json-operations.ts`).
    *   **Defaults:** Handlers will implement defaults of `maxDepth`=2 and `maxResults`=10.

4.  **Update Handlers:**
    *   **Action:** Modify the corresponding handler functions in `src/handlers/*` to correctly read, implement, and enforce these new mandatory limits using the standardized names and specified defaults.

5.  **Update Tool Descriptions:**
    *   **Action:** Update the descriptions for all affected tools within the `ListToolsRequestSchema` handler in `index.ts` to clearly state the new mandatory parameters (`maxBytes`, `maxDepth`, `maxResults`) and their default values.

**Diagram:**

```mermaid
graph TD
    subgraph Schemas
        direction LR
        S_ReadFile["ReadFileArgsSchema (index.ts)"]
        S_ReadMulti["ReadMultipleFilesArgsSchema (index.ts)"]
        S_EditFile["EditFileArgsSchema (index.ts)"]
        S_XmlToJson["XmlToJsonArgsSchema (utility-operations.ts)"]
        S_XmlToJsonStr["XmlToJsonStringArgsSchema (utility-operations.ts)"]
        S_JsonTools["Json*ArgsSchema (json-operations.ts)"]
        S_XmlQuery["XmlQueryArgsSchema (utility-operations.ts)"]
        S_XmlStruct["XmlStructureArgsSchema (utility-operations.ts)"]
        S_DirTree["DirectoryTreeArgsSchema (directory-operations.ts)"]
        S_Search["SearchFilesArgsSchema (utility-operations.ts)"]
        S_FindExt["FindFilesByExtensionArgsSchema (utility-operations.ts)"]
        S_JsonStruct["JsonStructureArgsSchema (json-operations.ts)"]
        S_JsonSearchKv["JsonSearchKvArgsSchema (json-operations.ts)"]
    end

    subgraph Parameters
        P_MaxBytes["Mandatory maxBytes (Default 10KB)"]
        P_MaxBytesPerFile["Mandatory maxBytesPerFile (Default 10KB)"]
        P_MaxDepth["Mandatory maxDepth (Standardized, Default 2, no <=0)"]
        P_MaxResults["Mandatory maxResults (Default 10)"]
    end

    subgraph Handlers
        H_All["Update All Corresponding Handlers w/ Defaults"]
    end

    subgraph Descriptions
        D_Index["Update Tool Descriptions w/ Defaults (index.ts)"]
    end

    S_ReadFile --> P_MaxBytes
    S_EditFile --> P_MaxBytes
    S_XmlToJson --> P_MaxBytes
    S_XmlToJsonStr --> P_MaxBytes
    S_JsonTools --> P_MaxBytes
    S_XmlQuery --> P_MaxBytes
    S_XmlStruct --> P_MaxBytes

    S_ReadMulti --> P_MaxBytesPerFile

    S_DirTree --> P_MaxDepth
    S_XmlStruct --> P_MaxDepth
    S_JsonStruct --> P_MaxDepth
    S_Search --> P_MaxDepth
    S_FindExt --> P_MaxDepth
    S_JsonSearchKv --> P_MaxDepth

    S_Search --> P_MaxResults
    S_FindExt --> P_MaxResults
    S_JsonSearchKv --> P_MaxResults


    Parameters --> H_All
    Parameters --> D_Index