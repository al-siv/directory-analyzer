import type { JSX } from 'react';
/**
 * Scan progress indicator.
 *
 * @description Displays a spinner, progress bar, and directory count
 *              while a scan is in progress.
 *
 * @module renderer/components/ScanProgress
 */

import { useScanStore } from '@renderer/store/scanStore';
import { Loader2 } from 'lucide-react';

export function ScanProgress(): JSX.Element {
  const progress = useScanStore(s => s.progress);

  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-12 dark:border-slate-700 dark:bg-slate-900">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
      <h2 className="mb-2 text-xl font-semibold">Scanning...</h2>

      <div className="mb-4 w-96 max-w-full">
        <div className="mb-1 flex justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{pct}%</span>
          <span>
            {current.toLocaleString()} / {total > 0 ? total.toLocaleString() : '...'} directories
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
            style={{ width: `${String(pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
