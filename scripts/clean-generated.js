const { rm } = require('node:fs/promises');
const { join } = require('node:path');

const ROOT = process.cwd();

const ROOT_PATHS = [
  'out',
  '.tsc-root',
  'coverage',
  'test-results',
  'playwright-report',
  'dist',
  'tsconfig.main.tsbuildinfo',
  'tsconfig.web.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
];

const GENERATED_SOURCE_FILES = [
  'src/preload/index.js',
  'src/preload/index.d.ts',
  'src/shared/constants.js',
  'src/shared/constants.d.ts',
  'src/shared/ipc-channels.js',
  'src/shared/ipc-channels.d.ts',
  'src/shared/schemas.js',
  'src/shared/schemas.d.ts',
  'src/shared/types.js',
  'src/shared/types.d.ts',
  'src/shared/utils/format.js',
  'src/shared/utils/format.d.ts',
  'src/renderer/App.js',
  'src/renderer/App.d.ts',
  'src/renderer/main.js',
  'src/renderer/main.d.ts',
  'src/renderer/store/scanStore.js',
  'src/renderer/store/scanStore.d.ts',
  'src/renderer/hooks/useScan.js',
  'src/renderer/hooks/useScan.d.ts',
  'src/renderer/components/AccessErrorsModal.js',
  'src/renderer/components/AccessErrorsModal.d.ts',
  'src/renderer/components/CategoryChart.js',
  'src/renderer/components/CategoryChart.d.ts',
  'src/renderer/components/DirectoryDetail.js',
  'src/renderer/components/DirectoryDetail.d.ts',
  'src/renderer/components/ExportBar.js',
  'src/renderer/components/ExportBar.d.ts',
  'src/renderer/components/ResultsTable.js',
  'src/renderer/components/ResultsTable.d.ts',
  'src/renderer/components/ScanConfigForm.js',
  'src/renderer/components/ScanConfigForm.d.ts',
  'src/renderer/components/ScanProgress.js',
  'src/renderer/components/ScanProgress.d.ts',
  'src/renderer/components/SummaryCards.js',
  'src/renderer/components/SummaryCards.d.ts',
  'src/renderer/components/ThemeToggle.js',
  'src/renderer/components/ThemeToggle.d.ts',
];

async function removePath(relativePath) {
  await rm(join(ROOT, relativePath), { recursive: true, force: true });
}

void Promise.all([...ROOT_PATHS, ...GENERATED_SOURCE_FILES].map(removePath));
