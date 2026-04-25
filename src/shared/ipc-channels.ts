/**
 * Typed IPC channel constants.
 *
 * Using a central registry prevents typos and makes the contract explicit.
 *
 * @module shared/ipc-channels
 */

export const IPC_CHANNELS = {
  /** Renderer -> Main: start a scan. Payload: ScanOptions */
  SCAN_START: 'scan:start',

  /** Main -> Renderer: progress update. Payload: ScanProgressUpdate */
  SCAN_PROGRESS: 'scan:progress',

  /** Main -> Renderer: scan completed. Payload: ScanResult */
  SCAN_COMPLETE: 'scan:complete',

  /** Main -> Renderer: scan failed. Payload: string (error message) */
  SCAN_ERROR: 'scan:error',

  /** Renderer -> Main: request cancellation. */
  SCAN_CANCEL: 'scan:cancel',

  /** Renderer -> Main: export results. Payload: { scanResult, format } */
  EXPORT_RESULTS: 'export:results',

  /** Renderer -> Main: show native open-directory dialog. */
  SHOW_OPEN_DIALOG: 'dialog:open-directory',

  /** Renderer -> Main: show native save-file dialog. */
  SHOW_SAVE_DIALOG: 'dialog:save-file',
} as const;

/** Union type of all channel names. */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
