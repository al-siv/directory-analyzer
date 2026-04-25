import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { DirectoryScanner } from '@main/core/scanner';
import type { ScanOptions } from '@shared/types';

const TMP_DIR = join(process.cwd(), 'tests/fixtures/tmp-scanner-test');

async function createTestStructure(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(join(TMP_DIR, 'subdir1'), { recursive: true });
  await mkdir(join(TMP_DIR, 'subdir2', 'nested'), { recursive: true });

  await writeFile(join(TMP_DIR, 'root.txt'), Buffer.alloc(1000));
  await writeFile(join(TMP_DIR, 'subdir1', 'image.jpg'), Buffer.alloc(5000));
  await writeFile(join(TMP_DIR, 'subdir1', 'document.pdf'), Buffer.alloc(3000));
  await writeFile(join(TMP_DIR, 'subdir2', 'video.mp4'), Buffer.alloc(10000));
  await writeFile(join(TMP_DIR, 'subdir2', 'nested', 'data.csv'), Buffer.alloc(2000));
}

async function cleanup(): Promise<void> {
  try {
    await rm(TMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function makeOptions(overrides?: Partial<ScanOptions>): ScanOptions {
  return {
    targetPath: TMP_DIR,
    includeHidden: true,
    minSizeBytes: 0,
    outputFile: 'results.txt',
    topCount: 50,
    outputFormat: 'text',
    verbose: false,
    errorLogFile: 'no-access.txt',
    extensionFilter: null,
    ...overrides,
  };
}

describe('DirectoryScanner', () => {
  beforeEach(createTestStructure);
  afterEach(cleanup);

  it('scans all directories sequentially', async () => {
    const scanner = new DirectoryScanner(makeOptions());
    const result = await scanner.scan(false);

    expect(result.directories.length).toBeGreaterThan(0);
    const root = result.directories.find(d => d.path === TMP_DIR);
    expect(root).toBeDefined();
    expect(root!.sizeBytes).toBe(1000);
    expect(root!.fileCount).toBe(1);
  });

  it('produces identical results in parallel and sequential modes', async () => {
    const opts = makeOptions();

    const seqScanner = new DirectoryScanner(opts);
    const seqResult = await seqScanner.scan(false);

    const parScanner = new DirectoryScanner(opts);
    const parResult = await parScanner.scan(true);

    expect(seqResult.directories.length).toBe(parResult.directories.length);

    const seqSorted = [...seqResult.directories].sort((a, b) => a.path.localeCompare(b.path));
    const parSorted = [...parResult.directories].sort((a, b) => a.path.localeCompare(b.path));

    for (let i = 0; i < seqSorted.length; i++) {
      expect(seqSorted[i].path).toBe(parSorted[i].path);
      expect(seqSorted[i].sizeBytes).toBe(parSorted[i].sizeBytes);
      expect(seqSorted[i].fileCount).toBe(parSorted[i].fileCount);
    }
  });

  it('applies size filtering', async () => {
    const scanner = new DirectoryScanner(makeOptions({ minSizeBytes: 4000 }));
    const result = await scanner.scan(false);

    const large = result.directories.filter(d => d.sizeBytes >= 4000);
    expect(large.length).toBeGreaterThanOrEqual(2);
  });

  it('applies extension filtering', async () => {
    const scanner = new DirectoryScanner(makeOptions({ extensionFilter: ['.jpg', '.pdf'] }));
    const result = await scanner.scan(false);

    const subdir1 = result.directories.find(d => d.path.endsWith('subdir1'));
    expect(subdir1).toBeDefined();
    expect(subdir1!.sizeBytes).toBe(8000);
    expect(subdir1!.fileCount).toBe(2);
  });

  it('generates statistics', async () => {
    const scanner = new DirectoryScanner(makeOptions());
    const result = await scanner.scan(false);

    expect(result.statistics.totalDirectories).toBeGreaterThan(0);
    expect(result.statistics.totalFiles).toBeGreaterThan(0);
    expect(result.statistics.totalSizeBytes).toBeGreaterThan(0);

    expect(result.statistics.categoryBreakdown['images']).toBe(5000);
    expect(result.statistics.categoryBreakdown['videos']).toBe(10000);
    expect(result.statistics.categoryBreakdown['documents']).toBe(3000);
  });

  it('sorts results by size descending', async () => {
    const scanner = new DirectoryScanner(makeOptions());
    const result = await scanner.scan(false);

    for (let i = 0; i < result.directories.length - 1; i++) {
      expect(result.directories[i].sizeBytes).toBeGreaterThanOrEqual(
        result.directories[i + 1].sizeBytes
      );
    }
  });

  it('can be cancelled', async () => {
    const scanner = new DirectoryScanner(makeOptions());
    const promise = scanner.scan(true);
    scanner.cancel();
    await expect(promise).rejects.toThrow('cancelled');
  });
});
