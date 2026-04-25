import { useScanStore } from '@renderer/store/scanStore';
import { ScanConfigForm } from '@renderer/components/ScanConfigForm';
import { ScanProgress } from '@renderer/components/ScanProgress';
import { ResultsTable } from '@renderer/components/ResultsTable';
import { CategoryChart } from '@renderer/components/CategoryChart';
import { DirectoryDetail } from '@renderer/components/DirectoryDetail';
import { ExportBar } from '@renderer/components/ExportBar';
import { SummaryCards } from '@renderer/components/SummaryCards';
import { ThemeToggle } from '@renderer/components/ThemeToggle';
import { HardDrive } from 'lucide-react';
import { useEffect } from 'react';

const isMac = window.electronAPI.getPlatform() === 'darwin';

export default function App() {
  const appState = useScanStore(s => s.appState);
  const scanResult = useScanStore(s => s.scanResult);
  const error = useScanStore(s => s.error);
  const theme = useScanStore(s => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header — draggable title bar region */}
      <header
        className={`flex items-center justify-between border-b border-slate-200 py-3 dark:border-slate-800 ${isMac ? 'pl-20 pr-6' : 'px-6'}`}
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="flex items-center gap-3">
          <HardDrive
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            style={{ WebkitAppRegion: 'no-drag' }}
          />
          <h1 className="text-lg font-semibold">Directory Analyzer</h1>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            v2.0.0
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <ScanConfigForm />

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <p className="font-medium">Scan Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {appState === 'scanning' && <ScanProgress />}

          {(appState === 'results' || scanResult) && (
            <>
              <SummaryCards />
              <div className="mt-6 flex flex-1 gap-6 overflow-hidden">
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <ResultsTable />
                </div>
                <div className="hidden w-[400px] flex-shrink-0 flex-col gap-6 overflow-auto lg:flex">
                  <CategoryChart />
                  <DirectoryDetail />
                </div>
              </div>
              <ExportBar />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
