import type { JSX } from 'react';
/**
 * Scan configuration form.
 *
 * @description Provides directory picker, filter toggles, and scan
 *              start/cancel controls. Reads and writes scan options
 *              to the global Zustand store.
 *
 * @module renderer/components/ScanConfigForm
 */

import { useScanStore } from '@renderer/store/scanStore';
import { useScan } from '@renderer/hooks/useScan';
import { FolderOpen, Play, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function ScanConfigForm(): JSX.Element {
  const { startScan, cancelScan } = useScan();
  const [showFilters, setShowFilters] = useState(false);

  const appState = useScanStore(s => s.appState);
  const targetPath = useScanStore(s => s.targetPath);
  const setTargetPath = useScanStore(s => s.setTargetPath);
  const includeHidden = useScanStore(s => s.includeHidden);
  const setIncludeHidden = useScanStore(s => s.setIncludeHidden);
  const minSizeMb = useScanStore(s => s.minSizeMb);
  const setMinSizeMb = useScanStore(s => s.setMinSizeMb);
  const topCount = useScanStore(s => s.topCount);
  const setTopCount = useScanStore(s => s.setTopCount);
  const extensions = useScanStore(s => s.extensions);
  const setExtensions = useScanStore(s => s.setExtensions);

  const browse = async (): Promise<void> => {
    const result = await window.electronAPI.showOpenDirectoryDialog();
    if (result.success && result.path) {
      setTargetPath(result.path);
    }
  };

  const canScan = targetPath.length > 0 && appState !== 'scanning';

  return (
    <div className="mb-6 space-y-4">
      {/* Path + Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            void browse();
          }}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <FolderOpen className="h-4 w-4" />
          Browse
        </button>

        <input
          type="text"
          value={targetPath}
          onChange={e => {
            setTargetPath(e.target.value);
          }}
          placeholder="No directory selected"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        />

        {appState === 'scanning' ? (
          <button
            onClick={cancelScan}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Square className="h-4 w-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={() => {
              void startScan();
            }}
            disabled={!canScan}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Scan
          </button>
        )}

        <button
          onClick={() => {
            setShowFilters(v => !v);
          }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Filters
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={e => {
                setIncludeHidden(e.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Include hidden directories
          </label>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Min size (MB)
            </label>
            <input
              type="number"
              min={0}
              value={minSizeMb}
              onChange={e => {
                setMinSizeMb(Number(e.target.value));
              }}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Top count
            </label>
            <input
              type="number"
              min={1}
              value={topCount}
              onChange={e => {
                setTopCount(Number(e.target.value));
              }}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Extensions
            </label>
            <input
              type="text"
              placeholder=".jpg .png .mp4"
              value={extensions}
              onChange={e => {
                setExtensions(e.target.value);
              }}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
