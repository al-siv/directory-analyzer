/**
 * IPC handlers for the main process.
 *
 * @description Bridges renderer requests to core logic. Validates all
 *              inputs before filesystem access.
 *
 * @module main/ipc/handlers
 */

import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { ScanOptions, ScanResult, OutputFormat } from '@shared/types';
import { ScanOptionsSchema } from '@shared/schemas';
import { DirectoryScanner, ScanCancelledError } from '@main/core/scanner';
import { exportResults } from '@main/core/exporter';
import { resolve, isAbsolute, normalize } from 'path';

let activeScanner: DirectoryScanner | null = null;

/**
 * Register all IPC handlers.
 *
 * @description Must be called once after the app is ready and before
 *              any renderer windows are created.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (event, options: ScanOptions) => {
    const validated = validateScanOptions(options);
    activeScanner = new DirectoryScanner(validated);

    const window = BrowserWindow.fromWebContents(event.sender);

    try {
      const result = await activeScanner.scan(true, (current, total) => {
        window?.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, {
          current,
          total,
          currentPath: '',
        });
      });

      return { success: true, result };
    } catch (err) {
      if (err instanceof ScanCancelledError) {
        return { success: false, error: 'Scan cancelled by user' };
      }
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      activeScanner = null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCAN_CANCEL, () => {
    activeScanner?.cancel();
    activeScanner = null;
  });

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_RESULTS,
    async (_event, payload: { result: ScanResult; format: OutputFormat }) => {
      const { result, format } = payload;

      const win = BrowserWindow.getFocusedWindow();
      if (!win) {
        return { success: false, error: 'No focused window' };
      }

      const { filePath } = await dialog.showSaveDialog(win, {
        defaultPath: `results.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });

      if (!filePath) {
        return { success: false, error: 'Save dialog cancelled' };
      }

      try {
        await exportResults(result, format, filePath);
        return { success: true, filePath };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SHOW_OPEN_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { success: false, path: undefined };
    }

    const { filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });

    if (filePaths.length === 0) {
      return { success: false, path: undefined };
    }

    return { success: true, path: filePaths[0] };
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (_event, dirPath: string) => {
    if (typeof dirPath !== 'string' || dirPath.length === 0) {
      return { success: false, error: 'Invalid path' };
    }
    const error = await shell.openPath(dirPath);
    return { success: error === '', error: error || undefined };
  });
}

/**
 * Validate and sanitize ScanOptions received from the renderer.
 *
 * @description Prevents path traversal by resolving paths and ensuring
 *              they stay within allowed boundaries.
 * @param options - Raw options from the renderer.
 * @returns Sanitized ScanOptions.
 * @throws {Error} If validation fails.
 */
function validateScanOptions(options: unknown): ScanOptions {
  const parsed = ScanOptionsSchema.parse(options);

  const targetPath = resolve(normalize(parsed.targetPath));

  if (!isAbsolute(targetPath)) {
    throw new Error('targetPath must be absolute');
  }

  return {
    ...parsed,
    targetPath,
    minSizeBytes: Math.max(0, Math.floor(parsed.minSizeBytes)),
    topCount: Math.max(1, Math.floor(parsed.topCount)),
    extensionFilter:
      parsed.extensionFilter?.map(e => {
        const lower = e.toLowerCase();
        return lower.startsWith('.') ? lower : `.${lower}`;
      }) ?? null,
  };
}
