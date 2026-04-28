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
    topCount: 10,
    outputFormat: format,
    extensionFilter: null,
  };

  const dirs: DirectoryInfo[] = [
    {
      path: '/test/photos',
      sizeBytes: 5000,
      fileCount: 2,
      lastScanned: Date.now(),
      errorMessage: null,
      files: [
        {
          path: '/test/photos/a.jpg',
          sizeBytes: 2000,
          extension: '.jpg',
          category: 'images',
          mimeType: null,
        },
        {
          path: '/test/photos/b.jpg',
          sizeBytes: 3000,
          extension: '.jpg',
          category: 'images',
          mimeType: null,
        },
      ],
      categoryBreakdown: { images: 5000 },
      dominantCategory: 'images',
    },
    {
      path: '/test/videos',
      sizeBytes: 10000,
      fileCount: 1,
      lastScanned: Date.now(),
      errorMessage: null,
      files: [
        {
          path: '/test/videos/a.mp4',
          sizeBytes: 10000,
          extension: '.mp4',
          category: 'videos',
          mimeType: null,
        },
      ],
      categoryBreakdown: { videos: 10000 },
      dominantCategory: 'videos',
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
    accessErrors: [],
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

  it('escapes csv fields with quotes and commas once', async () => {
    const result = makeScanResult('csv');
    const [dir] = result.directories as DirectoryInfo[];
    const mutated: ScanResult = {
      ...result,
      directories: [
        {
          ...dir,
          path: '/test/a,"quoted" path',
        },
      ],
    };

    await exportResults(mutated, 'csv', TMP_FILE);

    const content = await readFile(TMP_FILE, 'utf-8');
    expect(content).toContain('"/test/a,""quoted"" path",5000');
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
