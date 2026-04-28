/**
 * Zod schemas for runtime validation of IPC payloads and external inputs.
 *
 * @description These schemas mirror the TypeScript interfaces in
 *              {@link shared/types} and provide runtime guarantees on
 *              process boundaries.
 *
 * @module shared/schemas
 */

import { z } from 'zod';

/**
 * Validates raw {@link ScanOptions} received from the renderer process.
 */
export const ScanOptionsSchema = z.object({
  targetPath: z
    .string()
    .min(1)
    .refine(v => !v.includes('\0'), {
      message: 'Path contains null bytes',
    }),
  includeHidden: z.boolean(),
  minSizeBytes: z.number().int().min(0),
  topCount: z.number().int().min(1).max(10000),
  outputFormat: z.enum(['text', 'csv', 'json']).optional(),
  extensionFilter: z
    .array(
      z
        .string()
        .min(1)
        .trim()
        .regex(/^\.?[a-zA-Z0-9_-]+$/, {
          message: 'Invalid extension format',
        })
    )
    .nullable(),
});

/** Inferred TypeScript type from {@link ScanOptionsSchema}. */
export type ScanOptionsInput = z.input<typeof ScanOptionsSchema>;

/** Validates export output format. */
export const OutputFormatSchema = z.enum(['text', 'csv', 'json']);

/** Validates a single {@link FileInfo} object. */
export const FileInfoSchema = z.object({
  path: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  extension: z.string(),
  category: z.string(),
  mimeType: z.string().nullable(),
});

/** Validates a single {@link DirectoryInfo} object. */
export const DirectoryInfoSchema = z.object({
  path: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  fileCount: z.number().int().min(0),
  lastScanned: z.number().int().min(0),
  errorMessage: z.string().nullable(),
  files: z.array(FileInfoSchema),
  categoryBreakdown: z.record(z.string(), z.number()),
  dominantCategory: z.string().nullable(),
});

/** Validates {@link ScanStatistics}. */
export const ScanStatisticsSchema = z.object({
  totalDirectories: z.number().int().min(0),
  totalFiles: z.number().int().min(0),
  totalSizeBytes: z.number().int().min(0),
  scanDuration: z.number().min(0),
  categoryBreakdown: z.record(z.string(), z.number()),
  fileCountByCategory: z.record(z.string(), z.number()),
});

/** Validates the full {@link ScanResult} payload. */
export const ScanResultSchema = z.object({
  directories: z.array(DirectoryInfoSchema),
  totalScanned: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  accessErrors: z.array(z.string()),
  scanDuration: z.number().min(0),
  scanOptions: ScanOptionsSchema,
  statistics: ScanStatisticsSchema,
});
