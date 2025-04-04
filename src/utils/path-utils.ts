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
interface ValidatePathOptions {
  checkParentExists?: boolean;
}


export async function validatePath(
  requestedPath: string,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean,
  options?: ValidatePathOptions // Add this
): Promise<string> {
  // Default checkParentExists to true if not provided
  const checkParentExists = options?.checkParentExists ?? true;
  const expandedPath = expandHome(requestedPath);
  // Resolve absolute paths directly, resolve relative paths against the first allowed directory
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(allowedDirectories[0], expandedPath);

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
    // For new files/dirs that don't exist yet, verify parent directory *if requested*
    if (checkParentExists) { // Add this condition
      const parentDir = path.dirname(absolute);
      try {
        const realParentPath = await fs.realpath(parentDir);
        const normalizedParent = normalizePath(realParentPath);
        const isParentAllowed = allowedDirectories.some(dir => normalizedParent.startsWith(dir));
        if (!isParentAllowed) {
          throw new Error("Access denied - parent directory outside allowed directories");
        }
        // If parent exists and is allowed, return the original absolute path for creation
        return absolute;
      } catch (parentError) {
         // If parent check fails, throw specific error
         // Check if parent doesn't exist specifically using the error code
         if ((parentError as NodeJS.ErrnoException)?.code === 'ENOENT') {
            throw new Error(`Parent directory does not exist: ${parentDir}`);
         }
         // Rethrow other parent errors
         throw parentError;
      }
    } else {
      // If checkParentExists is false, just return the absolute path
      // The initial isAllowed check already confirmed it's within bounds
      return absolute;
    }
  }
} 