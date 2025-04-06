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
  excludePatterns: string[] = [],
  maxDepth: number = 2, // Default depth
  maxResults: number = 10 // Default results
): Promise<string[]> {
  const results: string[] = [];

  async function search(currentPath: string, currentDepth: number) {
    // Stop if max depth is reached
    if (currentDepth >= maxDepth) {
      return;
    }
    
    // Stop if max results are reached
    if (results.length >= maxResults) {
      return;
    }
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
        if (results.length < maxResults) {
          results.push(fullPath);
        }
        // Check again if max results reached after adding
        if (results.length >= maxResults) {
          return; // Stop searching this branch
        }
      }

      if (entry.isDirectory()) {
        // Check results length before recursing
        if (results.length < maxResults) {
          await search(fullPath, currentDepth + 1);
        }
      }
    }
  }

  await search(rootPath, 0); // Start search at depth 0
  return results;
}

export async function findFilesByExtension(
  rootPath: string,
  extension: string,
  excludePatterns: string[] = [],
  maxDepth: number = 2, // Default depth
  maxResults: number = 10 // Default results
): Promise<string[]> {
  const results: string[] = [];
  
  // Normalize the extension (remove leading dot if present)
  let normalizedExtension = extension.toLowerCase();
  if (normalizedExtension.startsWith('.')) {
    normalizedExtension = normalizedExtension.substring(1);
  }
  
  async function searchDirectory(currentPath: string, currentDepth: number) {
    // Stop if max depth is reached
    if (currentDepth >= maxDepth) {
      return;
    }
    
    // Stop if max results are reached
    if (results.length >= maxResults) {
      return;
    }
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
          if (results.length < maxResults) {
            results.push(fullPath);
          }
          // Check again if max results reached after adding
          if (results.length >= maxResults) {
            return; // Stop searching this branch
          }
        }
      } else if (entry.isDirectory()) {
        // Recursively search subdirectories
        // Check results length before recursing
        if (results.length < maxResults) {
          await searchDirectory(fullPath, currentDepth + 1);
        }
      }
    }
  }

  await searchDirectory(rootPath, 0); // Start search at depth 0
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

export interface RegexSearchResult {
  path: string;
  matches: {
    lineNumber: number;
    lineContent: string;
  }[];
}

export async function regexSearchContent(
  rootPath: string,
  regexPattern: string,
  filePattern: string = '*',
  maxDepth: number = 2,
  maxFileSize: number = 10 * 1024 * 1024, // 10MB default
  maxResults: number = 50
): Promise<RegexSearchResult[]> {
  const results: RegexSearchResult[] = [];
  let regex: RegExp;

  try {
    regex = new RegExp(regexPattern, 'g'); // Global flag to find all matches
  } catch (error: any) {
    throw new Error(`Invalid regex pattern provided: ${error.message}`);
  }

  async function search(currentPath: string, currentDepth: number) {
    if (currentDepth >= maxDepth || results.length >= maxResults) {
      return;
    }

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error: any) {
      console.warn(`Skipping directory ${currentPath}: ${error.message}`);
      return; // Skip directories we can't read
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return; // Check results limit again

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);

      if (entry.isDirectory()) {
        await search(fullPath, currentDepth + 1);
      } else if (entry.isFile()) {
        // Check if file matches the filePattern glob
        if (!minimatch(relativePath, filePattern, { dot: true, matchBase: true })) {
          continue;
        }

        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > maxFileSize) {
            console.warn(`Skipping large file ${fullPath}: size ${stats.size} > max ${maxFileSize}`);
            continue;
          }

          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          const fileMatches: { lineNumber: number; lineContent: string }[] = [];

          lines.forEach((line, index) => {
            // Reset regex lastIndex before each test if using global flag
            regex.lastIndex = 0;
            if (regex.test(line)) {
              fileMatches.push({ lineNumber: index + 1, lineContent: line });
            }
          });

          if (fileMatches.length > 0) {
            if (results.length < maxResults) {
              results.push({ path: fullPath, matches: fileMatches });
            }
            if (results.length >= maxResults) return; // Stop searching this branch
          }
        } catch (error: any) {
          console.warn(`Skipping file ${fullPath}: ${error.message}`);
          // Continue searching other files even if one fails
        }
      }
    }
  }

  await search(rootPath, 0);
  return results;
}