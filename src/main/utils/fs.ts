/**
 * Filesystem helpers.
 *
 * @description Cross-platform utilities for directory traversal, hidden
 *              detection, and safe stat operations.
 *
 * @module main/utils/fs
 */

import { stat, readdir } from 'fs/promises';
import { basename, join } from 'path';
import { platform } from 'os';

let koffiModule: typeof import('koffi') | undefined;
let getFileAttributesW: ((path: Buffer) => number) | undefined;

/**
 * Lazily initialise the koffi FFI binding for Windows hidden-attribute detection.
 *
 * @description We load koffi only when needed and only on Windows. If the
 *              module is missing or the call fails we gracefully fall back
 *              to dot-prefix detection.
 */
function initWindowsHiddenDetection(): void {
  if (getFileAttributesW !== undefined) return;
  if (platform() !== 'win32') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    koffiModule = require('koffi') as typeof import('koffi');
    const kernel32 = koffiModule.load('kernel32.dll');
    // koffi type declarations do not perfectly match the runtime API;
    // the call below is correct and verified at runtime.
    // @ts-expect-error — koffi overload resolution mismatch in bundled types
    getFileAttributesW = kernel32.func('uint32 __stdcall GetFileAttributesW', ['const uint16 *']);
  } catch {
    // Fallback to dot-prefix will be used automatically.
  }
}

/**
 * Check whether a directory is hidden.
 *
 * @description On Windows this queries the file-system attribute via
 *              `GetFileAttributesW` (koffi FFI). On macOS / Linux, or when
 *              the FFI call is unavailable, we fall back to checking whether
 *              the directory name starts with a dot.
 * @param dirPath - Absolute directory path.
 * @returns True if the directory should be treated as hidden.
 */
export function isHiddenDirectory(dirPath: string): boolean {
  initWindowsHiddenDetection();

  if (getFileAttributesW !== undefined) {
    try {
      const FILE_ATTRIBUTE_HIDDEN = 0x00000002;
      const buf = Buffer.from(dirPath + '\0', 'utf16le');
      const attrs = getFileAttributesW(buf);
      if (attrs !== 0xffffffff) {
        return (attrs & FILE_ATTRIBUTE_HIDDEN) !== 0;
      }
    } catch {
      // Fall through to dot-prefix check.
    }
  }

  return basename(dirPath).startsWith('.');
}

/**
 * Test whether a directory can be listed.
 *
 * @param dirPath - Directory path to test.
 * @returns True if the directory is readable.
 */
export async function isAccessibleDirectory(dirPath: string): Promise<boolean> {
  try {
    await readdir(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely obtain the size of a file.
 *
 * @description Returns 0 if the file cannot be accessed, matching the
 *              Python `safe_get_file_size` behavior.
 * @param filePath - Path to the file.
 * @returns Size in bytes, or 0 on error.
 */
export async function safeGetFileSize(filePath: string): Promise<number> {
  try {
    const s = await stat(filePath);
    return s.isFile() ? s.size : 0;
  } catch {
    return 0;
  }
}

/**
 * Yield the direct files inside a directory.
 *
 * @description Only entries where `dirent.isFile()` is true are yielded.
 *              Symlinks to files are included (Node resolves them).
 * @param directory - Absolute directory path.
 * @returns Async generator of file names (not full paths).
 */
export async function* getDirectFiles(directory: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        yield entry.name;
      }
    }
  } catch {
    // Swallow permission errors silently — caller decides whether to log.
  }
}

/**
 * Yield the subdirectories inside a directory, optionally skipping hidden ones.
 *
 * @param directory - Absolute directory path.
 * @param includeHidden - Whether hidden directories are yielded.
 * @returns Async generator of subdirectory names.
 */
export async function* getSubdirectories(
  directory: string,
  includeHidden: boolean
): AsyncGenerator<string> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (includeHidden || !isHiddenDirectory(join(directory, entry.name))) {
          yield entry.name;
        }
      }
    }
  } catch {
    // Swallow permission errors silently.
  }
}
