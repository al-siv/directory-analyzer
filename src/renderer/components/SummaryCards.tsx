import { useScanStore } from '@renderer/store/scanStore';
import { Folder, FileText, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import { bytesToHumanReadable } from '@shared/utils/format';

function Card({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className={`rounded-md p-2 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function SummaryCards(): JSX.Element {
  const result = useScanStore(s => s.scanResult);
  const stats = result?.statistics;

  if (!stats) return <></>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        icon={<Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        label="Directories"
        value={stats.totalDirectories.toLocaleString()}
        colorClass="bg-blue-50 dark:bg-blue-900/30"
      />
      <Card
        icon={<FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        label="Files"
        value={stats.totalFiles.toLocaleString()}
        colorClass="bg-emerald-50 dark:bg-emerald-900/30"
      />
      <Card
        icon={<HardDrive className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
        label="Total Size"
        value={bytesToHumanReadable(stats.totalSizeBytes)}
        colorClass="bg-violet-50 dark:bg-violet-900/30"
      />
      <Card
        icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        label="Duration"
        value={`${stats.scanDuration.toFixed(2)}s`}
        colorClass="bg-amber-50 dark:bg-amber-900/30"
      />
      <Card
        icon={<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        label="Errors"
        value={result.errorCount.toLocaleString()}
        colorClass="bg-red-50 dark:bg-red-900/30"
      />
    </div>
  );
}
