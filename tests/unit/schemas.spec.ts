/**
 * Unit tests for Zod runtime schemas.
 *
 * @module tests/unit/schemas.spec
 */

import { describe, it, expect } from 'vitest';
import {
  ScanOptionsSchema,
  OutputFormatSchema,
  DirectoryInfoSchema,
  ScanResultSchema,
} from '@shared/schemas';

describe('ScanOptionsSchema', () => {
  it('accepts a valid payload', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/Users/test/project',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 50,
      outputFormat: 'json',
      extensionFilter: ['jpg', 'png'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid ScanResult', () => {
    const result = ScanResultSchema.safeParse({
      directories: [
        {
          path: '/tmp',
          sizeBytes: 1024,
          fileCount: 5,
          lastScanned: Date.now(),
          errorMessage: null,
          files: [],
          categoryBreakdown: {},
          dominantCategory: null,
        },
      ],
      totalScanned: 1,
      errorCount: 0,
      accessErrors: [],
      scanDuration: 1.5,
      scanOptions: {
        targetPath: '/tmp',
        includeHidden: true,
        minSizeBytes: 0,
        topCount: 50,
        outputFormat: 'text',
        extensionFilter: null,
      },
      statistics: {
        totalDirectories: 1,
        totalFiles: 5,
        totalSizeBytes: 1024,
        scanDuration: 1.5,
        categoryBreakdown: { images: 1024 },
        fileCountByCategory: { images: 5 },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts null extensionFilter', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: false,
      minSizeBytes: 1024,
      topCount: 10,
      outputFormat: 'csv',
      extensionFilter: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty targetPath', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 50,
      outputFormat: 'text',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects path containing null bytes', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp\x00evil',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 50,
      outputFormat: 'text',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative minSizeBytes', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: true,
      minSizeBytes: -1,
      topCount: 50,
      outputFormat: 'text',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects topCount below 1', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 0,
      outputFormat: 'text',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects topCount above 10000', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 10001,
      outputFormat: 'text',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid outputFormat', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 50,
      outputFormat: 'xml',
      extensionFilter: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects extension with invalid characters', () => {
    const result = ScanOptionsSchema.safeParse({
      targetPath: '/tmp',
      includeHidden: true,
      minSizeBytes: 0,
      topCount: 50,
      outputFormat: 'text',
      extensionFilter: ['../etc/passwd'],
    });
    expect(result.success).toBe(false);
  });
});

describe('OutputFormatSchema', () => {
  it('accepts text', () => {
    expect(OutputFormatSchema.safeParse('text').success).toBe(true);
  });

  it('accepts csv', () => {
    expect(OutputFormatSchema.safeParse('csv').success).toBe(true);
  });

  it('accepts json', () => {
    expect(OutputFormatSchema.safeParse('json').success).toBe(true);
  });

  it('rejects xml', () => {
    expect(OutputFormatSchema.safeParse('xml').success).toBe(false);
  });
});

describe('DirectoryInfoSchema', () => {
  it('accepts valid directory info', () => {
    const result = DirectoryInfoSchema.safeParse({
      path: '/tmp',
      sizeBytes: 1024,
      fileCount: 5,
      lastScanned: Date.now(),
      errorMessage: null,
      files: [],
      categoryBreakdown: {},
      dominantCategory: 'images',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative sizeBytes', () => {
    const result = DirectoryInfoSchema.safeParse({
      path: '/tmp',
      sizeBytes: -1,
      fileCount: 0,
      lastScanned: 0,
      errorMessage: null,
      files: [],
      categoryBreakdown: {},
      dominantCategory: null,
    });
    expect(result.success).toBe(false);
  });
});
