import type { JSX } from 'react';
/**
 * Detail panel for a selected directory.
 *
 * @description Shows metadata (size, file count, percentage) for the
 *              directory selected in {@link ResultsTable}. Includes
 *              an action to open the directory in the native file manager.
 *
 * @module renderer/components/DirectoryDetail
 */

import { useScanStore } from '@renderer/store/scanStore';
import { useMemo, useState } from 'react';
import {
  FolderOpen,
  FileText,
  BarChart3,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { bytesToHumanReadable } from '@shared/utils/format';

const CATEGORY_COLORS: Record<string, string> = {
  images: 'bg-violet-500',
  videos: 'bg-red-500',
  audio: 'bg-amber-500',
  documents: 'bg-blue-500',
  office: 'bg-emerald-500',
  archives: 'bg-indigo-500',
  code: 'bg-teal-500',
  system: 'bg-gray-500',
  other: 'bg-slate-400',
};

export function DirectoryDetail(): JSX.Element {
  const scanResult = useScanStore(s => s.scanResult);
  const selectedPath = useScanStore(s => s.selectedDirectoryPath);
  const [showFiles, setShowFiles] = useState(false);

  const dir = useMemo(() => {
    return scanResult?.directories.find(d => d.path === selectedPath);
  }, [scanResult, selectedPath]);

  const totalSize = scanResult?.statistics.totalSizeBytes ?? 0;

  if (!dir) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold">Directory Detail</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select a directory from the table
        </p>
      </div>
    );
  }

  const pct = totalSize > 0 ? ((dir.sizeBytes / totalSize) * 100).toFixed(2) : '0.00';

  const openInFinder = (): void => {
    void window.electronAPI.openPath(dir.path);
  };

  const copyPath = (): void => {
    void navigator.clipboard.writeText(dir.path);
  };

  const catEntries = Object.entries(dir.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const hasFiles = dir.files.length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold">Directory Detail</h3>

      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span className="break-all">{dir.path}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{dir.sizeBytes.toLocaleString()} bytes</span>
          <span className="text-slate-500 dark:text-slate-400">({pct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span>{dir.fileCount.toLocaleString()} files</span>
        </div>
        {dir.dominantCategory && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${CATEGORY_COLORS[dir.dominantCategory] ?? CATEGORY_COLORS.other}`}
            />
            <span className="text-slate-600 dark:text-slate-300">
              Dominant: <span className="font-medium capitalize">{dir.dominantCategory}</span>
            </span>
          </div>
        )}
      </div>

      {/* Category breakdown mini-bar */}
      {catEntries.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Category Breakdown
          </p>
          {catEntries.map(([cat, size]) => {
            const catPct = dir.sizeBytes > 0 ? (size / dir.sizeBytes) * 100 : 0;
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-16 text-xs capitalize text-slate-500 dark:text-slate-400">
                  {cat}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}
                    style={{ width: `${String(catPct)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">
                  {catPct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* File list (expandable) */}
      {hasFiles && (
        <div className="mt-3">
          <button
            onClick={() => {
              setShowFiles(v => !v);
            }}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showFiles ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showFiles ? 'Hide' : 'Show'} files ({dir.files.length})
          </button>

          {showFiles && (
            <div className="mt-2 max-h-48 overflow-auto rounded border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-2 py-1 font-medium">Name</th>
                    <th className="px-2 py-1 font-medium text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {dir.files.map(f => (
                    <tr key={f.path}>
                      <td className="max-w-[140px] truncate px-2 py-1" title={f.path}>
                        {f.path.split('/').pop() ?? f.path}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-500 dark:text-slate-400">
                        {bytesToHumanReadable(f.sizeBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={openInFinder}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          <ExternalLink className="h-3 w-3" />
          Show in Finder
        </button>
        <button
          onClick={copyPath}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Copy className="h-3 w-3" />
          Copy Path
        </button>
      </div>
    </div>
  );
}
