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

  /** Renderer -> Main: request cancellation. */
  SCAN_CANCEL: 'scan:cancel',

  /** Renderer -> Main: export results. Payload: { scanResult, format } */
  EXPORT_RESULTS: 'export:results',

  /** Renderer -> Main: show native open-directory dialog. */
  SHOW_OPEN_DIALOG: 'dialog:open-directory',

  /** Renderer -> Main: open path in system file manager. */
  OPEN_PATH: 'shell:open-path',
} as const;

/** Union type of all channel names. */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
