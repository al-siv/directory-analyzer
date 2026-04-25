# Directory Analyzer - TS/Electron Migration Plan

## Overview

This document provides a detailed, actionable plan for migrating Directory Analyzer from a Python CLI application to a TypeScript + Electron desktop application.

**Goal**: Preserve all v1.2.1 Python CLI features while adding a modern GUI, cross-platform desktop packaging, and interactive visualizations.

**Success Criteria**:
1. Feature parity with Python CLI (scan, filter, classify, export)
2. UI never freezes during scans (Worker Threads)
3. Cross-platform builds (Windows, macOS, Linux)
4. Strict TypeScript throughout
5. Performance within 2x of Python baseline

---

## Phase 1: Project Foundation

**Objective**: Set up the Electron + TypeScript project scaffold with all tooling.

### Tasks

- [x] Initialize project with `pnpm create electron-vite@latest`
  - Choose React + TypeScript template
  - Configure for `main`, `preload`, `renderer` processes
- [x] Configure TypeScript
  - Root `tsconfig.json` with `strict: true`
  - Separate `tsconfig.node.json` for build tooling
  - Path aliases (`@shared/*`, `@main/*`, `@renderer/*`, `@preload/*`)
- [x] Configure Vite (`electron.vite.config.ts`)
  - Main process build (Node.js target)
  - Preload script build (isolated context)
  - Renderer process build (browser target)
- [x] Set up linting and formatting
  - ESLint with TypeScript plugin (`@typescript-eslint`)
  - Prettier with consistent config
  - Add pnpm scripts: `lint`, `lint:fix`, `format`
- [x] Set up testing
  - Vitest for unit tests (main process logic)
  - Playwright for E2E tests
  - Configure test scripts in `package.json`
- [x] Set up Tailwind CSS in renderer
  - Install Tailwind, PostCSS, Autoprefixer
  - Create `tailwind.config.js` with content paths
  - Set up base styles
- [x] Install runtime dependencies
  - `electron` (30+)
  - `react`, `react-dom`
  - `zustand` (state management)
  - `recharts` (charts)
  - `lucide-react` (icons)
  - `electron-vite-ipc` (optional typed IPC helper)

### Deliverables
- `package.json` with all dependencies and scripts
- `electron.vite.config.ts` working for all three processes
- `tsconfig.json` files with strict mode
- `.eslintrc.json` and `.prettierrc`
- Empty `src/` directory structure matching AGENTS.md
- `pnpm run dev` starts the app in development mode

---

## Phase 2: Shared Layer & Types

**Objective**: Define all data structures, constants, and IPC contracts used across main and renderer.

### Tasks

- [x] Create `src/shared/constants.ts`
  - Port all constants from `src/constants.py`:
    - `BYTES_PER_KB = 1024`
    - `MINIMUM_PERCENTAGE_DISPLAY = 0.01`
    - `PROGRESS_UPDATE_FREQUENCY`
    - `PROGRESS_PERCENTAGE_INTERVAL`
    - Test constants (for unit tests)
- [x] Create `src/shared/types.ts`
  - Port all Python dataclasses to TypeScript interfaces:
    - `DirectoryInfo`: `path`, `sizeBytes`, `fileCount`, `lastScanned`, `errorMessage?`
    - `ScanOptions`: `targetPath`, `includeHidden`, `minSizeBytes`, `outputFile`, `topCount`, `outputFormat`, `verbose`, `errorLogFile`, `extensionFilter?`
    - `ScanResult`: `directories`, `totalScanned`, `errorCount`, `scanDuration`, `scanOptions`, `statistics?`
    - `FileInfo`: `path`, `sizeBytes`, `extension`, `category`, `mimeType?`
    - `ContentCategory`: `primary`, `secondary?`, `displayName`
    - `ScanStatistics`: `totalDirectories`, `totalFiles`, `totalSizeBytes`, `scanDuration`, `categoryBreakdown`, `fileCountByCategory`
    - `EnhancedDirectoryInfo`: extends DirectoryInfo with `files`, `categoryBreakdown`, `dominantCategory`, `percentageOfTotal`
  - Add helper types:
    - `OutputFormat = 'text' | 'csv' | 'json'`
    - `ScanProgressUpdate = { current: number; total: number; currentPath: string }`
- [x] Create `src/shared/ipc-channels.ts`
  - Define typed IPC channel names as constants:
    - `SCAN_START = 'scan:start'`
    - `SCAN_PROGRESS = 'scan:progress'`
    - `SCAN_COMPLETE = 'scan:complete'`
    - `SCAN_CANCEL = 'scan:cancel'`
    - `EXPORT_RESULTS = 'export:results'`
    - `SHOW_SAVE_DIALOG = 'dialog:save'`
    - `SHOW_OPEN_DIALOG = 'dialog:open'`
  - Define typed request/response shapes for each channel

### Deliverables
- All shared types compile with zero errors
- Constants exactly match Python values
- IPC channel contracts are type-safe

---

## Phase 3: Core Logic Port (Main Process)

**Objective**: Port all Python business logic to TypeScript running in Electron's main process.

### Tasks

- [x] Create `src/main/utils/format.ts`
  - `bytesToHumanReadable(sizeBytes: number): string` — must match Python exactly:
    - `0 B` for zero
    - `1.5 GB`, `2.0 MB` format (one decimal for non-bytes)
    - `1024` divisor
  - `formatPercentage(percentage: number): string`:
    - `<0.01%` if below threshold
    - `2.2f%` otherwise
  - `formatPathForDisplay(path: string, maxLength?: number): string`
  - Unit tests for all format functions
- [x] Create `src/main/utils/fs.ts`
  - `isHiddenDirectory(path: string): boolean`:
    - Windows: check `fs.stat` file attributes (`FILE_ATTRIBUTE_HIDDEN = 2`)
    - Unix/macOS: check dot prefix
  - `isAccessibleDirectory(path: string): boolean`
  - `safeGetFileSize(filePath: string): number` (returns 0 on error)
  - `getDirectFiles(directory: string): AsyncGenerator<string>`
  - `getSubdirectories(directory: string, includeHidden: boolean): AsyncGenerator<string>`
  - `validateOutputPath(outputPath: string): string | null`
  - Unit tests with temp directories
- [x] Create `src/main/utils/progress.ts`
  - Port `ProgressReporter` class:
    - `update(count?: number): void`
    - `finish(): void`
    - Report every 5% or every 1000 items
- [x] Create `src/main/core/classifier.ts`
  - Port `ContentClassifier` class:
    - Exact `CATEGORY_MAPPINGS` from `classifier.py` (all 8 categories with full extension sets)
    - `classifyFile(filePath: string): string`
    - `classifyFileWithInfo(filePath: string, fileSize: number): FileInfo`
    - `getCategoryStatistics(files: FileInfo[]): Record<string, number>`
    - `getFileCountByCategory(files: FileInfo[]): Record<string, number>`
    - `getDominantCategory(files: FileInfo[]): string`
    - `addCustomCategory(name: string, extensions: Set<string>): void`
    - `getCategoryDisplayName(category: string): string`
  - Unit tests: all classification tests from `tests/test_suite.py`
- [x] Create `src/main/core/scanner.ts`
  - Port `DirectoryScanner` class:
    - `constructor(options: ScanOptions)`
    - `scanSingleDirectory(directory: string): DirectoryInfo`
    - `getAllDirectories(rootPath: string): AsyncGenerator<string>`
    - `scanSequential(): DirectoryInfo[]`
    - `scanParallel(maxWorkers?: number): DirectoryInfo[]`
    - `scan(useParallel?: boolean, maxWorkers?: number): DirectoryInfo[]`
    - `createScanStatistics(results: DirectoryInfo[], duration: number): ScanStatistics`
    - `createEnhancedDirectoryInfo(directory: DirectoryInfo, totalSize: number): EnhancedDirectoryInfo`
  - Use `fs/promises` for all I/O
  - Use `worker_threads` for parallel scanning
  - Graceful error handling matching Python behavior
  - Extension filtering and size filtering
  - Hidden directory control
  - Unit tests: all scanner tests from `tests/test_suite.py`
- [x] Create `src/main/core/exporter.ts`
  - Port `write_results` functionality:
    - `_writeTextResults(outputPath: string, scanResult: ScanResult)`
    - `_writeCsvResults(outputPath: string, scanResult: ScanResult)`
    - `_writeJsonResults(outputPath: string, scanResult: ScanResult)`
  - Format must match Python output exactly (for regression testing)
  - Unit tests for all three formats

### Deliverables
- All core logic functions have passing unit tests
- Classification accuracy matches Python 1:1
- Scanning produces identical results on same directories
- Export formats match Python output byte-for-byte (where applicable)

---

## Phase 4: IPC Layer

**Objective**: Implement secure, typed communication between renderer and main process.

### Tasks

- [x] Create `src/preload/index.ts`
  - Use `contextBridge` to expose safe API:
    - `scanStart(options: ScanOptions): Promise<ScanResult>`
    - `onScanProgress(callback: (update: ScanProgressUpdate) => void): () => void`
    - `scanCancel(): void`
    - `exportResults(scanResult: ScanResult, format: OutputFormat): Promise<string>`
    - `showSaveDialog(options: SaveDialogOptions): Promise<string | undefined>`
    - `showOpenDialog(options: OpenDialogOptions): Promise<string[] | undefined>`
  - No `nodeIntegration`, `contextIsolation: true`
  - Remove all listeners on cleanup
- [x] Create `src/main/ipc/handlers.ts`
  - Register IPC handlers in main process:
    - `ipcMain.handle(IPC_CHANNELS.SCAN_START, async (event, options) => { ... })`
    - Progress reporting via `event.sender.send(IPC_CHANNELS.SCAN_PROGRESS, update)`
    - Cancel via AbortController or worker termination
    - Export handler triggers native save dialog then writes file
  - Validate all paths before filesystem access (security)
  - Prevent path traversal attacks
- [x] Create `src/renderer/hooks/useIpc.ts`
  - Typed wrapper around `window.electronAPI` (exposed by preload)
  - Handles cleanup on unmount
- [x] Create `src/renderer/hooks/useScan.ts`
  - Manages scan lifecycle:
    - `startScan(options: ScanOptions): void`
    - `cancelScan(): void`
    - `isScanning: boolean`
    - `progress: ScanProgressUpdate | null`
    - `result: ScanResult | null`
    - `error: Error | null`
  - Subscribes to progress updates
  - Handles completion and errors

### Deliverables
- IPC round-trip tests pass
- Renderer cannot access Node.js APIs directly (security audit)
- Scan lifecycle works end-to-end in development

---

## Phase 5: UI Implementation

**Objective**: Build the React GUI that replaces the CLI experience.

### Tasks

- [ ] Create `src/renderer/store/scanStore.ts` (Zustand)
  - State:
    - `scanResult: ScanResult | null`
    - `isScanning: boolean`
    - `progress: ScanProgressUpdate | null`
    - `scanOptions: ScanOptions | null`
    - `error: string | null`
  - Actions:
    - `setScanResult`, `setIsScanning`, `setProgress`, `setError`
    - `clearResults`, `reset`
- [ ] Create `src/renderer/components/ScanConfigForm.tsx`
  - Path picker button (opens native folder dialog via IPC)
  - Display selected path
  - Toggle: "Include hidden directories" (default true)
  - Input: "Minimum size (MB)" (number, default 0)
  - Input: "Top count" (number, default 50)
  - Extension filter chips (multi-select or text input)
  - "Start Scan" button (disabled while scanning or no path selected)
  - "Cancel Scan" button (visible while scanning)
- [ ] Create `src/renderer/components/ScanProgress.tsx`
  - Progress bar (percentage or indeterminate)
  - Stats: directories scanned, files found, elapsed time
  - Current directory being scanned (if verbose)
- [ ] Create `src/renderer/components/ResultsTable.tsx`
  - Data grid showing top directories:
    - Rank
    - Path (clickable)
    - Size (human-readable)
    - Percentage of total
    - File count
  - Sortable columns (click header to sort)
  - Row click opens detail panel
  - Handle large lists (virtualization if needed)
- [ ] Create `src/renderer/components/DirectoryDetail.tsx`
  - Shows files in selected directory:
    - File name, size, extension, category
  - Category breakdown for this directory
  - Dominant category badge
- [ ] Create `src/renderer/components/CategoryChart.tsx`
  - Pie chart (Recharts) showing category breakdown by size
  - Bar chart showing top N categories
  - Legend with human-readable names and percentages
- [ ] Create `src/renderer/components/ExportPanel.tsx`
  - "Export as Text" button
  - "Export as CSV" button
  - "Export as JSON" button
  - Opens native save dialog with appropriate default extension
  - Shows success/error toast
- [ ] Create `src/renderer/components/ScanSummary.tsx`
  - Summary cards:
    - Total directories scanned
    - Total files
    - Total size
    - Scan duration
    - Error count
  - Success rate display
- [ ] Create `src/renderer/App.tsx`
  - Layout: header, main content area, sidebar or panels
  - Dark/light mode support (Tailwind `dark:` classes)
  - Responsive design

### Deliverables
- All UI components render correctly in dev mode
- User can configure scan, start it, see progress, view results
- Results are interactive (sort, drill-down, export)
- UI is responsive and accessible

---

## Phase 6: Testing & Polish

**Objective**: Ensure correctness, performance, and cross-platform reliability.

### Tasks

- [ ] Unit tests for all `main/` logic
  - Classifier: every category, every edge case from Python tests
  - Formatter: boundary values (0, 1023, 1024, etc.)
  - Scanner: temp directory fixtures, compare with Python on same fixture
  - Exporter: snapshot tests matching Python output
- [ ] Integration tests
  - Scan a temp directory, verify results match Python
  - Export all formats, compare files
- [ ] E2E tests (Playwright)
  - Full scan workflow: pick folder -> scan -> results appear
  - Export workflow: scan -> export -> file exists
  - Cancel workflow: start scan -> cancel -> stops cleanly
- [ ] Performance testing
  - Scan same large directory with Python and Electron versions
  - Verify within 2x speed difference
  - Profile memory usage
- [ ] Error handling UI
  - Toast notifications for permission errors
  - Inline error messages in forms
  - Graceful handling of scan failures
- [ ] Cross-platform build setup
  - `electron-builder` configuration
  - Windows: `.exe` installer
  - macOS: `.dmg` or `.app`
  - Linux: `.AppImage` or `.deb`
- [ ] Final documentation
  - Update `README.md` with Electron app instructions
  - Update `CHANGELOG.md`
  - Remove or archive Python-specific setup instructions

### Deliverables
- All tests pass (`pnpm test`, `pnpm exec playwright test`)
- Built app runs on target platforms
- Performance benchmark report
- Updated documentation

---

## Appendix: Python -> TypeScript Quick Reference

### Data Structures
```typescript
// Python dataclass
@dataclass
class DirectoryInfo:
    path: Path
    size_bytes: int
    file_count: int

// TypeScript equivalent
interface DirectoryInfo {
  path: string;
  sizeBytes: number;
  fileCount: number;
}
```

### File System
```typescript
// Python: pathlib.Path.iterdir()
// TS: fs/promises
import { readdir, stat } from 'fs/promises';
const entries = await readdir(dirPath, { withFileTypes: true });
```

### Parallel Processing
```typescript
// Python: ThreadPoolExecutor
// TS: worker_threads
import { Worker } from 'worker_threads';
const worker = new Worker('./scan.worker.js');
worker.postMessage({ directory });
```

### Error Handling
```typescript
// Python: try/except (OSError, PermissionError)
// TS: try/catch
import { errors } from 'fs';
try {
  await stat(path);
} catch (err) {
  if (err instanceof errors.PermissionError) { ... }
}
```

---

## Appendix: Testing Fixtures

Create these fixtures in `tests/fixtures/`:

```
tests/fixtures/
├── mixed-content/
│   ├── root.txt (1000 bytes)
│   ├── subdir1/
│   │   ├── image.jpg (5000 bytes)
│   │   └── document.pdf (3000 bytes)
│   ├── subdir2/
│   │   └── video.mp4 (10000 bytes)
│   └── subdir2/nested/
│       └── data.csv (2000 bytes)
├── hidden-dirs/
│   ├── .hidden/
│   │   └── secret.txt
│   └── visible/
│       └── public.txt
└── large-structure/   # Generated programmatically for perf tests
```

Use these fixtures in both Python and TypeScript tests to verify parity.
