/**
 * Global UI state managed by Zustand.
 *
 * @module renderer/store/scanStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScanResult, ScanProgressUpdate } from '@shared/types';

type AppState = 'idle' | 'scanning' | 'results' | 'error';

interface ScanStore {
  appState: AppState;
  scanResult: ScanResult | null;
  progress: ScanProgressUpdate | null;
  error: string | null;
  targetPath: string;
  includeHidden: boolean;
  minSizeMb: number;
  topCount: number;
  extensions: string;
  theme: 'dark' | 'light';
  selectedDirectoryPath: string | null;

  setAppState: (state: AppState) => void;
  setScanResult: (result: ScanResult | null) => void;
  setProgress: (progress: ScanProgressUpdate | null) => void;
  setError: (error: string | null) => void;
  setTargetPath: (path: string) => void;
  setIncludeHidden: (val: boolean) => void;
  setMinSizeMb: (val: number) => void;
  setTopCount: (val: number) => void;
  setExtensions: (val: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setSelectedDirectoryPath: (path: string | null) => void;
  reset: () => void;
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
  theme: 'dark' as const,
  selectedDirectoryPath: null,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export const useScanStore = create<ScanStore>()(
  persist(
    set => ({
      ...initialState,

      setAppState: (appState: AppState): void => {
        set({ appState });
      },
      setScanResult: (scanResult: ScanResult | null): void => {
        set({ scanResult });
      },
      setProgress: (progress: ScanProgressUpdate | null): void => {
        set({ progress });
      },
      setError: (error: string | null): void => {
        set({ error });
      },
      setTargetPath: (targetPath: string): void => {
        set({ targetPath });
      },
      setIncludeHidden: (includeHidden: boolean): void => {
        set({ includeHidden });
      },
      setMinSizeMb: (minSizeMb: number): void => {
        set({ minSizeMb });
      },
      setTopCount: (topCount: number): void => {
        set({ topCount });
      },
      setExtensions: (extensions: string): void => {
        set({ extensions });
      },
      setTheme: (theme: 'dark' | 'light'): void => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      setSelectedDirectoryPath: (selectedDirectoryPath: string | null): void => {
        set({ selectedDirectoryPath });
      },
      reset: (): void => {
        set({
          appState: 'idle',
          scanResult: null,
          progress: null,
          error: null,
          targetPath: '',
          selectedDirectoryPath: null,
        });
      },
    }),
    {
      name: 'directory-analyzer-config',
      partialize: state => ({
        theme: state.theme,
        includeHidden: state.includeHidden,
        topCount: state.topCount,
        minSizeMb: state.minSizeMb,
        extensions: state.extensions,
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<ScanStore>;
        return {
          ...currentState,
          theme: p.theme === 'light' ? 'light' : 'dark',
          includeHidden:
            typeof p.includeHidden === 'boolean' ? p.includeHidden : currentState.includeHidden,
          topCount: clampNumber(p.topCount, 1, 10000, currentState.topCount),
          minSizeMb: clampNumber(p.minSizeMb, 0, Infinity, currentState.minSizeMb),
          extensions: typeof p.extensions === 'string' ? p.extensions : currentState.extensions,
        };
      },
    }
  )
);
