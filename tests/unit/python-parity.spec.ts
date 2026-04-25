import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { DirectoryScanner } from '@main/core/scanner'
import type { ScanOptions } from '@shared/types'

describe('Python parity regression', () => {
  it('TS scanner produces expected sizes on mixed-content fixture', async () => {
    const fixture = join(process.cwd(), 'tests/fixtures/mixed-content')

    const tsOpts: ScanOptions = {
      targetPath: fixture,
      includeHidden: true,
      minSizeBytes: 0,
      outputFile: 'out.txt',
      topCount: 50,
      outputFormat: 'json',
      verbose: false,
      errorLogFile: 'err.txt',
      extensionFilter: null
    }

    const tsScanner = new DirectoryScanner(tsOpts)
    const tsResult = await tsScanner.scan(false)

    // Expected sizes (must match Python fixture creation):
    // root.txt = 1000
    // subdir1/image.jpg = 5000
    // subdir1/document.pdf = 3000
    // subdir2/video.mp4 = 10000
    // subdir2/nested/data.csv = 2000

    const dirMap = new Map(tsResult.directories.map((d) => [d.path, d]))

    expect(dirMap.get(fixture)!.sizeBytes).toBe(1000)
    expect(dirMap.get(fixture)!.fileCount).toBe(1)

    expect(dirMap.get(join(fixture, 'subdir1'))!.sizeBytes).toBe(8000)
    expect(dirMap.get(join(fixture, 'subdir1'))!.fileCount).toBe(2)

    expect(dirMap.get(join(fixture, 'subdir2'))!.sizeBytes).toBe(10000)
    expect(dirMap.get(join(fixture, 'subdir2'))!.fileCount).toBe(1)

    expect(dirMap.get(join(fixture, 'subdir2', 'nested'))!.sizeBytes).toBe(2000)
    expect(dirMap.get(join(fixture, 'subdir2', 'nested'))!.fileCount).toBe(1)

    expect(tsResult.statistics.totalFiles).toBe(5)
    expect(tsResult.statistics.totalSizeBytes).toBe(21000)
  })
})
