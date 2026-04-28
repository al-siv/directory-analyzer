/**
 * React hook that bridges the Zustand store with the IPC scan lifecycle.
 *
 * @module renderer/hooks/useScan
 */

import { useCallback, useEffect } from 'react';
import { useScanStore } from '@renderer/store/scanStore';
import type { ScanOptions } from '@shared/types';

export function useScan(): {
  startScan: () => Promise<void>;
  cancelScan: () => void;
} {
  useEffect(() => {
    const unsubProgress = window.electronAPI.onScanProgress(update => {
      useScanStore.getState().setProgress(update);
    });

    return (): void => {
      unsubProgress();
    };
  }, []);

  const startScan = useCallback(async () => {
    const s = useScanStore.getState();
    s.setError(null);
    s.setScanResult(null);
    s.setProgress(null);
    s.setAppState('scanning');

    const extFilter = s.extensions
      .split(/[\s,]+/)
      .map(e => e.trim())
      .filter(Boolean);

    const options: ScanOptions = {
      targetPath: s.targetPath,
      includeHidden: s.includeHidden,
      minSizeBytes: s.minSizeMb * 1024 * 1024,
      topCount: s.topCount,
      extensionFilter: extFilter.length > 0 ? extFilter : null,
    };

    const response = await window.electronAPI.scanStart(options);

    if (!response.success) {
      if (response.cancelled) {
        s.setError(null);
        s.setAppState('idle');
      } else {
        s.setError(response.error ?? 'Unknown error');
        s.setAppState('error');
      }
      s.setProgress(null);
    } else if (response.result) {
      s.setScanResult(response.result);
      s.setAppState('results');
      s.setProgress(null);
    }
  }, []);

  const cancelScan = useCallback(() => {
    const s = useScanStore.getState();
    s.setProgress(null);
    s.setError(null);
    s.setAppState('idle');
    void window.electronAPI.scanCancel();
  }, []);

  return { startScan, cancelScan };
}
