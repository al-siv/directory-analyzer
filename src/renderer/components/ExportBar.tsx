import type { JSX } from 'react';
/**
 * Export action bar.
 *
 * @description Provides buttons to export the current scan result
 *              as text, CSV, or JSON via the native save dialog.
 *
 * @module renderer/components/ExportBar
 */

import { useScanStore } from '@renderer/store/scanStore';
import { FileText, Table, Code } from 'lucide-react';
import { useState } from 'react';
import type { OutputFormat } from '@shared/types';

export function ExportBar(): JSX.Element {
  const scanResult = useScanStore(s => s.scanResult);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExport = async (format: OutputFormat): Promise<void> => {
    if (!scanResult) return;
    setExportError(null);
    setExportSuccess(null);
    const result = await window.electronAPI.exportResults(scanResult, format);
    if (result.cancelled) {
      return;
    }
    if (!result.success) {
      setExportError(result.error ?? 'Unknown error');
    } else if (result.filePath) {
      setExportSuccess(`Saved to ${result.filePath}`);
    }
  };

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Export Results:
        </span>
        <button
          onClick={() => {
            void handleExport('text');
          }}
          className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <FileText className="h-4 w-4" />
          TXT
        </button>
        <button
          onClick={() => {
            void handleExport('csv');
          }}
          className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Table className="h-4 w-4" />
          CSV
        </button>
        <button
          onClick={() => {
            void handleExport('json');
          }}
          className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Code className="h-4 w-4" />
          JSON
        </button>
      </div>
      {exportError && (
        <p className="text-sm text-red-600 dark:text-red-400">Export failed: {exportError}</p>
      )}
      {exportSuccess && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{exportSuccess}</p>
      )}
    </div>
  );
}
