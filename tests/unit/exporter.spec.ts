import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exportResults } from '@main/core/exporter';
import type { ScanResult, ScanOptions, DirectoryInfo, ScanStatistics } from '@shared/types';

const TMP_FILE = join(process.cwd(), 'tests/fixtures/tmp-export-test.txt');

function makeScanResult(format: ScanOptions['outputFormat']): ScanResult {
  const options: ScanOptions = {
    targetPath: '/test',
    includeHidden: true,
    minSizeBytes: 0,
    outputFile: 'out.txt',
    topCount: 10,
    outputFormat: format,
    verbose: false,
    errorLogFile: 'err.txt',
    extensionFilter: null,
  };

  const dirs: DirectoryInfo[] = [
    {
      path: '/test/photos',
      sizeBytes: 5000,
      fileCount: 2,
      lastScanned: Date.now(),
      errorMessage: null,
    },
    {
      path: '/test/videos',
      sizeBytes: 10000,
      fileCount: 1,
      lastScanned: Date.now(),
      errorMessage: null,
    },
  ];

  const stats: ScanStatistics = {
    totalDirectories: 2,
    totalFiles: 3,
    totalSizeBytes: 15000,
    scanDuration: 1.23,
    categoryBreakdown: { images: 5000, videos: 10000 },
    fileCountByCategory: { images: 2, videos: 1 },
  };

  return {
    directories: dirs,
    totalScanned: 2,
    errorCount: 0,
    scanDuration: 1.23,
    scanOptions: options,
    statistics: stats,
  };
}

async function cleanup(): Promise<void> {
  try {
    await unlink(TMP_FILE);
  } catch {
    /* ignore */
  }
}

describe('exportResults', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('exports text format', async () => {
    const result = makeScanResult('text');
    await exportResults(result, 'text', TMP_FILE);

    const content = await readFile(TMP_FILE, 'utf-8');
    expect(content).toContain('Directory Analyzer');
    expect(content).toContain('/test/photos');
    expect(content).toContain('/test/videos');
    expect(content).toContain('Content Type Analysis');
  });

  it('exports csv format', async () => {
    const result = makeScanResult('csv');
    await exportResults(result, 'csv', TMP_FILE);

    const content = await readFile(TMP_FILE, 'utf-8');
    expect(content).toContain('# Directory Analyzer Results');
    expect(content).toContain('Rank,Path,Size (bytes)');
    expect(content).toContain('/test/photos');
  });

  it('exports json format', async () => {
    const result = makeScanResult('json');
    await exportResults(result, 'json', TMP_FILE);

    const content = await readFile(TMP_FILE, 'utf-8');
    const data = JSON.parse(content);
    expect(data.summary.totalDirectories).toBe(2);
    expect(data.directories).toHaveLength(2);
    expect(data.contentAnalysis.images.sizeBytes).toBe(5000);
  });

  it('throws on unsupported format', async () => {
    const result = makeScanResult('text');
    await expect(exportResults(result, 'xml' as unknown as 'text', TMP_FILE)).rejects.toThrow(
      'Unsupported'
    );
  });
});
