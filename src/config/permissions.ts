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