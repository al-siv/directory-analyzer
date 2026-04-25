import { useScanStore } from '@renderer/store/scanStore';
import { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { bytesToHumanReadable, formatPercentage } from '@shared/utils/format';

type SortKey = 'path' | 'sizeBytes' | 'percentage' | 'fileCount';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sortDir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

export function ResultsTable() {
  const scanResult = useScanStore(s => s.scanResult);
  const selectedPath = useScanStore(s => s.selectedDirectoryPath);
  const setSelected = useScanStore(s => s.setSelectedDirectoryPath);
  const [sortKey, setSortKey] = useState<SortKey>('sizeBytes');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterText, setFilterText] = useState('');

  const sorted = useMemo(() => {
    const directories = scanResult?.directories ?? [];
    const totalSize = scanResult?.statistics.totalSizeBytes ?? 0;
    let list = [...directories];

    if (filterText.trim()) {
      const lower = filterText.toLowerCase();
      list = list.filter(d => d.path.toLowerCase().includes(lower));
    }

    list.sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      if (sortKey === 'percentage') {
        av = totalSize > 0 ? (a.sizeBytes / totalSize) * 100 : 0;
        bv = totalSize > 0 ? (b.sizeBytes / totalSize) * 100 : 0;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [scanResult, sortKey, sortDir, filterText]);

  const toggleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const formatPct = (bytes: number): string => {
    const total = scanResult?.statistics.totalSizeBytes ?? 0;
    if (total === 0) return formatPercentage(0);
    return formatPercentage((bytes / total) * 100);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700">
        <input
          type="text"
          placeholder="Filter by path..."
          value={filterText}
          onChange={e => {
            setFilterText(e.target.value);
          }}
          className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => {
                  toggleSort('path');
                }}
              >
                Directory <SortIcon col="path" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => {
                  toggleSort('sizeBytes');
                }}
              >
                Size <SortIcon col="sizeBytes" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => {
                  toggleSort('percentage');
                }}
              >
                % <SortIcon col="percentage" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => {
                  toggleSort('fileCount');
                }}
              >
                Files <SortIcon col="fileCount" sortKey={sortKey} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((dir, idx) => {
              const isSelected = selectedPath === dir.path;
              return (
                <tr
                  key={dir.path}
                  onClick={() => {
                    setSelected(dir.path);
                  }}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                  <td className="max-w-xs truncate px-4 py-2 font-mono text-xs" title={dir.path}>
                    {dir.path}
                  </td>
                  <td className="px-4 py-2 font-medium">{bytesToHumanReadable(dir.sizeBytes)}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {formatPct(dir.sizeBytes)}
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {dir.fileCount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
