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
  targetPath: z.string().min(1),
  includeHidden: z.boolean(),
  minSizeBytes: z.number().int().min(0),
  topCount: z.number().int().min(1).max(10000),
  outputFormat: z.enum(['text', 'csv', 'json']),
  extensionFilter: z.array(z.string().min(1)).nullable(),
});

/** Inferred TypeScript type from {@link ScanOptionsSchema}. */
export type ScanOptionsInput = z.input<typeof ScanOptionsSchema>;
