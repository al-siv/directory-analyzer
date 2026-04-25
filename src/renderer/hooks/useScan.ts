/**
 * React hook that bridges the Zustand store with the IPC scan lifecycle.
 *
 * @module renderer/hooks/useScan
 */

import { useCallback, useEffect } from 'react'
import { useScanStore } from '@renderer/store/scanStore'
import type { ScanOptions } from '@shared/types'

export function useScan(): {
  startScan: () => Promise<void>
  cancelScan: () => void
} {
  useEffect(() => {
    const unsubProgress = window.electronAPI.onScanProgress((update) => {
      useScanStore.getState().setProgress(update)
    })

    const unsubComplete = window.electronAPI.onScanComplete((result) => {
      const s = useScanStore.getState()
      s.setScanResult(result)
      s.setAppState('results')
      s.setProgress(null)
    })

    const unsubError = window.electronAPI.onScanError((error) => {
      const s = useScanStore.getState()
      s.setError(error)
      s.setAppState('error')
      s.setProgress(null)
    })

    return (): void => {
      unsubProgress()
      unsubComplete()
      unsubError()
    }
  }, [])

  const startScan = useCallback(async () => {
    const s = useScanStore.getState()
    s.setError(null)
    s.setScanResult(null)
    s.setProgress(null)
    s.setAppState('scanning')

    const extFilter = s.extensions
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter(Boolean)

    const options: ScanOptions = {
      targetPath: s.targetPath,
      includeHidden: s.includeHidden,
      minSizeBytes: s.minSizeMb * 1024 * 1024,
      outputFile: 'largest_directories.txt',
      topCount: s.topCount,
      outputFormat: 'text',
      verbose: s.verbose,
      errorLogFile: 'no-access.txt',
      extensionFilter: extFilter.length > 0 ? extFilter : null
    }

    const response = await window.electronAPI.scanStart(options)

    if (!response.success) {
      s.setError(response.error ?? 'Unknown error')
      s.setAppState('error')
      s.setProgress(null)
    } else if (response.result) {
      s.setScanResult(response.result)
      s.setAppState('results')
      s.setProgress(null)
    }
  }, [])

  const cancelScan = useCallback(() => {
    window.electronAPI.scanCancel()
  }, [])

  return { startScan, cancelScan }
}
