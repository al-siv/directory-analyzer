import { useScanStore } from '@renderer/store/scanStore';
import { useMemo } from 'react';
import { FolderOpen, FileText, BarChart3, ExternalLink } from 'lucide-react';

export function DirectoryDetail(): JSX.Element {
  const scanResult = useScanStore(s => s.scanResult);
  const selectedPath = useScanStore(s => s.selectedDirectoryPath);

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
    void window.electronAPI.showSaveDialog({});
  };

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
      </div>

      <button
        onClick={openInFinder}
        className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        <ExternalLink className="h-3 w-3" />
        Show in Finder / Explorer
      </button>
    </div>
  );
}
