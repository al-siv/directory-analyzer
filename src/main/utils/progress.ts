/**
 * Progress reporter for long-running scans.
 *
 * @description Mirrors Python `ProgressReporter`. Reports every 5 % or
 *              every 1000 items when the total is unknown.
 *
 * @module main/utils/progress
 */

import { PROGRESS_PERCENTAGE_INTERVAL, PROGRESS_UPDATE_FREQUENCY } from '@shared/constants';

export interface ProgressCallback {
  (current: number, total: number): void;
}

export class ProgressReporter {
  private readonly total: number | null;
  private readonly onUpdate: ProgressCallback | null;
  private current = 0;
  private lastReported = -1;

  /**
   * @param total - Total expected items, or null if unknown.
   * @param prefix - Label shown in progress messages.
   * @param onUpdate - Optional callback invoked on each report.
   */
  constructor(
    total: number | null = null,
    _prefix = 'Progress',
    onUpdate: ProgressCallback | null = null
  ) {
    this.total = total ?? null;
    this.onUpdate = onUpdate;
  }

  /**
   * Increment progress and report if a threshold is crossed.
   *
   * @param count - Amount to increment. Default 1.
   */
  update(count = 1): void {
    this.current += count;

    if (this.total !== null && this.total > 0) {
      const percent = Math.floor((this.current / this.total) * 100);
      if (percent - this.lastReported >= PROGRESS_PERCENTAGE_INTERVAL) {
        this.lastReported = percent;
        this.onUpdate?.(this.current, this.total);
      }
    } else if (this.current % PROGRESS_UPDATE_FREQUENCY === 0) {
      this.onUpdate?.(this.current, 0);
    }
  }

  /**
   * Signal completion.
   */
  finish(): void {
    if (this.total !== null && this.total > 0) {
      this.onUpdate?.(this.current, this.total);
    } else {
      this.onUpdate?.(this.current, 0);
    }
  }
}
