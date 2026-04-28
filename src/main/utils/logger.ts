/**
 * Structured logger for the main process.
 *
 * @description Wraps electron-log to provide session-correlated,
 *              structured JSON logging. All catch blocks and scan
 *              lifecycle events should use this instead of raw console.
 *
 * @module main/utils/logger
 */

import logger from 'electron-log';
import { randomUUID } from 'crypto';

logger.transports.file.level = 'info';
logger.transports.console.level = 'info';

/**
 * Creates a session-scoped logger with a correlation ID.
 *
 * @param sessionId - Unique identifier for the scan/session.
 * @returns Logger interface with info/warn/error methods.
 *
 * @example
 * const log = createScanLogger('scan_abc123');
 * log.info('scan:start', { targetPath: '/home/user/docs' });
 */
export function createScanLogger(sessionId: string): {
  info: (event: string, meta?: Record<string, unknown>) => void;
  warn: (event: string, meta?: Record<string, unknown>) => void;
  error: (event: string, meta?: Record<string, unknown>) => void;
} {
  return {
    info: (event: string, meta?: Record<string, unknown>): void => {
      logger.info({ sessionId, event, ...(meta ?? {}) });
    },
    warn: (event: string, meta?: Record<string, unknown>): void => {
      logger.warn({ sessionId, event, ...(meta ?? {}) });
    },
    error: (event: string, meta?: Record<string, unknown>): void => {
      logger.error({ sessionId, event, ...(meta ?? {}) });
    },
  };
}

/**
 * Generate a new scan session correlation ID.
 *
 * @returns UUID v4 string.
 */
export function generateSessionId(): string {
  return randomUUID();
}

export { logger };
