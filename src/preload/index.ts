/**
 * Preload script — secure bridge between renderer and main process.
 *
 * @description Uses contextBridge to expose a strictly typed API. No
 *              Node.js modules are exposed directly.
 *
 * @module preload
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { ScanOptions, ScanResult, ScanProgressUpdate, OutputFormat } from '@shared/types';

export interface ElectronAPI {
  scanStart: (
    options: ScanOptions
  ) => Promise<{ success: boolean; cancelled?: boolean; result?: ScanResult; error?: string }>;
  scanCancel: () => Promise<{ success: boolean }>;
  onScanProgress: (callback: (update: ScanProgressUpdate) => void) => () => void;
  exportResults: (
    result: ScanResult,
    format: OutputFormat
  ) => Promise<{ success: boolean; cancelled?: boolean; filePath?: string; error?: string }>;
  showOpenDirectoryDialog: () => Promise<{ success: boolean; path?: string }>;
  openPath: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  getPlatform: () => string;
}

const api: ElectronAPI = {
  scanStart: async options =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_START, options) as Promise<{
      success: boolean;
      cancelled?: boolean;
      result?: ScanResult;
      error?: string;
    }>,

  scanCancel: async () =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_CANCEL) as Promise<{
      success: boolean;
    }>,

  onScanProgress: (callback): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: ScanProgressUpdate): void => {
      callback(update);
    };
    ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, listener);
    return (): void => {
      ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, listener);
    };
  },

  exportResults: async (result, format) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_RESULTS, { result, format }) as Promise<{
      success: boolean;
      cancelled?: boolean;
      filePath?: string;
      error?: string;
    }>,

  showOpenDirectoryDialog: async () =>
    ipcRenderer.invoke(IPC_CHANNELS.SHOW_OPEN_DIALOG) as Promise<{
      success: boolean;
      path?: string;
    }>,

  openPath: async dirPath =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_PATH, dirPath) as Promise<{
      success: boolean;
      error?: string;
    }>,

  getPlatform: (): string => process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
