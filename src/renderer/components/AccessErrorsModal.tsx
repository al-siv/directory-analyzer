/**
 * Modal listing directories that could not be accessed during scanning.
 *
 * @description Displays paths that triggered permission or accessibility
 *              errors, similar to Python's `no-access.txt` log file.
 *
 * @module renderer/components/AccessErrorsModal
 */

import { useScanStore } from '@renderer/store/scanStore';
import { X, ShieldAlert } from 'lucide-react';
import type { JSX } from 'react';

export function AccessErrorsModal(): JSX.Element | null {
  const scanResult = useScanStore(s => s.scanResult);
  const show = useScanStore(s => s.showAccessErrors);
  const setShow = useScanStore(s => s.setShowAccessErrors);

  if (!show || !scanResult || scanResult.accessErrors.length === 0) {
    return null;
  }

  const errors = scanResult.accessErrors;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        setShow(false);
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold">Access Errors</h3>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              {errors.length}
            </span>
          </div>
          <button
            onClick={() => {
              setShow(false);
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            The following directories could not be accessed due to permission restrictions:
          </p>
          <ul className="space-y-1">
            {errors.map((path, idx) => (
              <li
                key={idx}
                className="rounded bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title={path}
              >
                {path}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            onClick={() => {
              setShow(false);
            }}
            className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
