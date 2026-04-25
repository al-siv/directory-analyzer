/**
 * Unit tests for IPC handler logic.
 *
 * @module tests/unit/handlers.spec
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: {},
  BrowserWindow: {},
  shell: {},
}));

import { validateScanOptions } from '@main/ipc/handlers';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('validateScanOptions', () => {
  it('resolves and validates a real directory path', async () => {
    const tempDir = join(tmpdir(), `da-test-${String(Date.now())}`);
    await mkdir(tempDir, { recursive: true });

    try {
      const result = await validateScanOptions({
        targetPath: tempDir,
        includeHidden: true,
        minSizeBytes: 0,
        topCount: 50,
        outputFormat: 'text',
        extensionFilter: null,
      });

      expect(result.targetPath).toBe(tempDir);
      expect(result.includeHidden).toBe(true);
      expect(result.minSizeBytes).toBe(0);
      expect(result.topCount).toBe(50);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('normalizes extension filters', async () => {
    const tempDir = join(tmpdir(), `da-test-${String(Date.now())}`);
    await mkdir(tempDir, { recursive: true });

    try {
      const result = await validateScanOptions({
        targetPath: tempDir,
        includeHidden: false,
        minSizeBytes: 1024,
        topCount: 10,
        outputFormat: 'json',
        extensionFilter: ['JPG', 'png', 'pdf'],
      });

      expect(result.extensionFilter).toEqual(['.jpg', '.png', '.pdf']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('throws for non-existent path', async () => {
    await expect(
      validateScanOptions({
        targetPath: '/nonexistent/path/that/should/fail',
        includeHidden: true,
        minSizeBytes: 0,
        topCount: 50,
        outputFormat: 'text',
        extensionFilter: null,
      })
    ).rejects.toThrow('targetPath does not exist or is inaccessible');
  });

  it('throws for a file instead of directory', async () => {
    const tempFile = join(tmpdir(), `da-test-file-${String(Date.now())}.txt`);
    await writeFile(tempFile, 'hello');

    try {
      await expect(
        validateScanOptions({
          targetPath: tempFile,
          includeHidden: true,
          minSizeBytes: 0,
          topCount: 50,
          outputFormat: 'text',
          extensionFilter: null,
        })
      ).rejects.toThrow('targetPath must be a directory');
    } finally {
      await rm(tempFile, { force: true });
    }
  });

  it('throws for relative path after resolve', async () => {
    await expect(
      validateScanOptions({
        targetPath: 'relative/path',
        includeHidden: true,
        minSizeBytes: 0,
        topCount: 50,
        outputFormat: 'text',
        extensionFilter: null,
      })
    ).rejects.toThrow('targetPath does not exist or is inaccessible');
  });

  it('throws for negative minSizeBytes', async () => {
    const tempDir = join(tmpdir(), `da-test-${String(Date.now())}`);
    await mkdir(tempDir, { recursive: true });

    try {
      await expect(
        validateScanOptions({
          targetPath: tempDir,
          includeHidden: true,
          minSizeBytes: -100,
          topCount: 50,
          outputFormat: 'text',
          extensionFilter: null,
        })
      ).rejects.toThrow();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('throws for topCount below 1', async () => {
    const tempDir = join(tmpdir(), `da-test-${String(Date.now())}`);
    await mkdir(tempDir, { recursive: true });

    try {
      await expect(
        validateScanOptions({
          targetPath: tempDir,
          includeHidden: true,
          minSizeBytes: 0,
          topCount: 0,
          outputFormat: 'text',
          extensionFilter: null,
        })
      ).rejects.toThrow();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
