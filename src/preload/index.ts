/**
 * Preload script — secure bridge between renderer and main process.
 *
 * @description Uses contextBridge to expose a strictly typed API. No
 *              Node.js modules are exposed directly.
 *
 * @module preload
 */

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { ScanOptions, ScanResult, ScanProgressUpdate, OutputFormat } from '@shared/types'

export interface ElectronAPI {
  scanStart: (options: ScanOptions) => Promise<{ success: boolean; result?: ScanResult; error?: string }>
  scanCancel: () => void
  onScanProgress: (callback: (update: ScanProgressUpdate) => void) => () => void
  onScanComplete: (callback: (result: ScanResult) => void) => () => void
  onScanError: (callback: (error: string) => void) => () => void
  exportResults: (result: ScanResult, format: OutputFormat) => Promise<{ success: boolean; filePath?: string; error?: string }>
  showOpenDirectoryDialog: () => Promise<{ success: boolean; path?: string }>
  showSaveDialog: (options: { defaultPath?: string; filters?: Electron.FileFilter[] }) => Promise<{ success: boolean; filePath?: string }>
}

const api: ElectronAPI = {
  scanStart: async (options) => ipcRenderer.invoke(IPC_CHANNELS.SCAN_START, options),

  scanCancel: () => ipcRenderer.invoke(IPC_CHANNELS.SCAN_CANCEL),

  onScanProgress: (callback): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: ScanProgressUpdate): void => callback(update)
    ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, listener)
    }
  },

  onScanComplete: (callback): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: ScanResult): void => callback(result)
    ipcRenderer.on(IPC_CHANNELS.SCAN_COMPLETE, listener)
    return (): void => {
      ipcRenderer.removeListener(IPC_CHANNELS.SCAN_COMPLETE, listener)
    }
  },

  onScanError: (callback): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string): void => callback(error)
    ipcRenderer.on(IPC_CHANNELS.SCAN_ERROR, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_ERROR, listener)
  },

  exportResults: async (result, format) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_RESULTS, { result, format }),

  showOpenDirectoryDialog: async () => ipcRenderer.invoke(IPC_CHANNELS.SHOW_OPEN_DIALOG),

  showSaveDialog: async (options) => ipcRenderer.invoke(IPC_CHANNELS.SHOW_SAVE_DIALOG, options)
}

contextBridge.exposeInMainWorld('electronAPI', api)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
