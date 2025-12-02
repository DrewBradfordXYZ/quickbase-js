/**
 * Logger utility that respects the debug configuration
 */

export class Logger {
  private readonly enabled: boolean;
  private readonly prefix: string;

  constructor(enabled: boolean = false, prefix: string = 'quickbase-js') {
    this.enabled = enabled;
    this.prefix = prefix;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.enabled) {
      if (data !== undefined) {
        console.log(this.formatMessage('DEBUG', message), data);
      } else {
        console.log(this.formatMessage('DEBUG', message));
      }
    }
  }

  info(message: string, data?: unknown): void {
    if (this.enabled) {
      if (data !== undefined) {
        console.info(this.formatMessage('INFO', message), data);
      } else {
        console.info(this.formatMessage('INFO', message));
      }
    }
  }

  warn(message: string, data?: unknown): void {
    // Warnings are always logged, regardless of debug setting
    if (data !== undefined) {
      console.warn(this.formatMessage('WARN', message), data);
    } else {
      console.warn(this.formatMessage('WARN', message));
    }
  }

  error(message: string, error?: unknown): void {
    // Errors are always logged, regardless of debug setting
    if (error !== undefined) {
      console.error(this.formatMessage('ERROR', message), error);
    } else {
      console.error(this.formatMessage('ERROR', message));
    }
  }

  /**
   * Log rate limit information
   */
  rateLimit(info: {
    url: string;
    status: number;
    retryAfter?: number;
    attempt: number;
    rayId?: string;
  }): void {
    if (this.enabled) {
      this.debug(
        `Rate limited (attempt ${info.attempt}): ${info.url} - ` +
          `Status ${info.status}, Retry-After: ${info.retryAfter ?? 'not specified'}s` +
          (info.rayId ? `, Ray: ${info.rayId}` : '')
      );
    }
  }

  /**
   * Log request timing
   */
  timing(method: string, url: string, durationMs: number): void {
    if (this.enabled) {
      this.debug(`${method} ${url} completed in ${durationMs}ms`);
    }
  }

  /**
   * Log retry attempt
   */
  retry(attempt: number, maxAttempts: number, delayMs: number, reason: string): void {
    if (this.enabled) {
      this.debug(
        `Retry ${attempt}/${maxAttempts} in ${delayMs}ms: ${reason}`
      );
    }
  }

  /**
   * Log token operations (without exposing the actual token)
   */
  token(operation: 'fetch' | 'cache-hit' | 'cache-miss' | 'refresh' | 'expire', dbid?: string): void {
    if (this.enabled) {
      const target = dbid ? ` for dbid: ${dbid}` : '';
      this.debug(`Token ${operation}${target}`);
    }
  }
}

/**
 * Create a no-op logger for when logging is disabled
 * This avoids conditional checks at every log call
 */
export function createLogger(enabled: boolean): Logger {
  return new Logger(enabled);
}
