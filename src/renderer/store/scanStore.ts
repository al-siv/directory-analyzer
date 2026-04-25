/**
 * Global UI state managed by Zustand.
 *
 * @module renderer/store/scanStore
 */

import { create } from 'zustand'
import type { ScanResult, ScanProgressUpdate } from '@shared/types'

type AppState = 'idle' | 'scanning' | 'results' | 'error'

interface ScanStore {
  appState: AppState
  scanResult: ScanResult | null
  progress: ScanProgressUpdate | null
  error: string | null
  targetPath: string
  includeHidden: boolean
  minSizeMb: number
  topCount: number
  extensions: string
  verbose: boolean
  theme: 'dark' | 'light'
  selectedDirectoryPath: string | null

  setAppState: (state: AppState) => void
  setScanResult: (result: ScanResult | null) => void
  setProgress: (progress: ScanProgressUpdate | null) => void
  setError: (error: string | null) => void
  setTargetPath: (path: string) => void
  setIncludeHidden: (val: boolean) => void
  setMinSizeMb: (val: number) => void
  setTopCount: (val: number) => void
  setExtensions: (val: string) => void
  setVerbose: (val: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  setSelectedDirectoryPath: (path: string | null) => void
  reset: () => void
}

const initialState = {
  appState: 'idle' as AppState,
  scanResult: null,
  progress: null,
  error: null,
  targetPath: '',
  includeHidden: true,
  minSizeMb: 0,
  topCount: 50,
  extensions: '',
  verbose: false,
  theme: 'dark' as const,
  selectedDirectoryPath: null
}

export const useScanStore = create<ScanStore>((set) => ({
  ...initialState,

  setAppState: (appState: AppState): void => set({ appState }),
  setScanResult: (scanResult: ScanResult | null): void => set({ scanResult }),
  setProgress: (progress: ScanProgressUpdate | null): void => set({ progress }),
  setError: (error: string | null): void => set({ error }),
  setTargetPath: (targetPath: string): void => set({ targetPath }),
  setIncludeHidden: (includeHidden: boolean): void => set({ includeHidden }),
  setMinSizeMb: (minSizeMb: number): void => set({ minSizeMb }),
  setTopCount: (topCount: number): void => set({ topCount }),
  setExtensions: (extensions: string): void => set({ extensions }),
  setVerbose: (verbose: boolean): void => set({ verbose }),
  setTheme: (theme: 'dark' | 'light'): void => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  setSelectedDirectoryPath: (selectedDirectoryPath: string | null): void => set({ selectedDirectoryPath }),
  reset: (): void => set({ ...initialState, theme: useScanStore.getState().theme })
}))
