/**
 * Client-Side Rate Limiter
 * Prevents abuse of Gemini API by limiting requests per minute/hour/day
 * Note: This is client-side only and can be bypassed by clearing browser data
 * Suitable for personal use to prevent accidental API quota exhaustion
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RateLimitDB extends DBSchema {
  requestLog: {
    key: number;
    value: {
      timestamp: number;
      endpoint: string;
    };
    indexes: { 'by-timestamp': number };
  };
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number // milliseconds until can retry
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export interface RateLimitConfig {
  perMinute: number;
  perHour: number;
  perDay: number;
}

const DEFAULT_LIMITS: RateLimitConfig = {
  perMinute: 10,
  perHour: 100,
  perDay: 500,
};

export class ClientSideRateLimiter {
  private db: IDBPDatabase<RateLimitDB> | null = null;
  private limits: RateLimitConfig;
  private dbName = 'cortex-rate-limiter';
  private requestLog: Array<{ timestamp: number; endpoint: string }> = [];

  constructor(limits: Partial<RateLimitConfig> = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    this.initDB();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<RateLimitDB>(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('requestLog')) {
            const store = db.createObjectStore('requestLog', { keyPath: 'timestamp' });
            store.createIndex('by-timestamp', 'timestamp');
          }
        },
      });

      // Load existing log from IndexedDB
      await this.loadRequestLog();
    } catch (error) {
      console.error('Failed to initialize rate limiter DB:', error);
      // Fall back to in-memory only
    }
  }

  private async loadRequestLog(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('requestLog', 'readonly');
      const store = tx.objectStore('requestLog');
      const allRecords = await store.getAll();

      // Only keep last 24 hours
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.requestLog = allRecords.filter((r) => r.timestamp > dayAgo);
    } catch (error) {
      console.error('Failed to load request log:', error);
    }
  }

  /**
   * Check if a request can be made, throws RateLimitError if limit exceeded
   */
  async checkLimit(endpoint: string = 'default'): Promise<void> {
    const now = Date.now();

    // Clean old requests (older than 24 hours)
    this.requestLog = this.requestLog.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000);

    // Check limits
    const lastMinute = this.requestLog.filter((r) => now - r.timestamp < 60_000).length;
    const lastHour = this.requestLog.filter((r) => now - r.timestamp < 3600_000).length;
    const lastDay = this.requestLog.length;

    // Calculate retry times
    if (lastMinute >= this.limits.perMinute) {
      const oldestInMinute = this.requestLog
        .filter((r) => now - r.timestamp < 60_000)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      const retryAfter = oldestInMinute ? 60_000 - (now - oldestInMinute.timestamp) : 60_000;

      throw new RateLimitError(
        `Rate limit exceeded: ${lastMinute}/${this.limits.perMinute} requests per minute. Please wait ${Math.ceil(retryAfter / 1000)} seconds.`,
        retryAfter
      );
    }

    if (lastHour >= this.limits.perHour) {
      const oldestInHour = this.requestLog
        .filter((r) => now - r.timestamp < 3600_000)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      const retryAfter = oldestInHour ? 3600_000 - (now - oldestInHour.timestamp) : 3600_000;

      throw new RateLimitError(
        `Hourly limit reached: ${lastHour}/${this.limits.perHour} requests. Resets in ${Math.ceil(retryAfter / 60_000)} minutes.`,
        retryAfter
      );
    }

    if (lastDay >= this.limits.perDay) {
      const oldestToday = this.requestLog.sort((a, b) => a.timestamp - b.timestamp)[0];
      const retryAfter = oldestToday
        ? 24 * 60 * 60 * 1000 - (now - oldestToday.timestamp)
        : 24 * 60 * 60 * 1000;

      throw new RateLimitError(
        `Daily limit reached: ${lastDay}/${this.limits.perDay} requests. Resets in ${Math.ceil(retryAfter / 3600_000)} hours.`,
        retryAfter
      );
    }

    // Log this request
    await this.logRequest(endpoint);
  }

  private async logRequest(endpoint: string): Promise<void> {
    const timestamp = Date.now();
    const record = { timestamp, endpoint };

    // Add to in-memory log
    this.requestLog.push(record);

    // Persist to IndexedDB
    if (this.db) {
      try {
        await this.db.add('requestLog', record);
      } catch (error) {
        console.error('Failed to persist request log:', error);
      }
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    lastMinute: number;
    lastHour: number;
    lastDay: number;
    limits: RateLimitConfig;
    percentages: {
      minute: number;
      hour: number;
      day: number;
    };
  } {
    const now = Date.now();
    const lastMinute = this.requestLog.filter((r) => now - r.timestamp < 60_000).length;
    const lastHour = this.requestLog.filter((r) => now - r.timestamp < 3600_000).length;
    const lastDay = this.requestLog.length;

    return {
      lastMinute,
      lastHour,
      lastDay,
      limits: this.limits,
      percentages: {
        minute: Math.round((lastMinute / this.limits.perMinute) * 100),
        hour: Math.round((lastHour / this.limits.perHour) * 100),
        day: Math.round((lastDay / this.limits.perDay) * 100),
      },
    };
  }

  /**
   * Update rate limits (useful for user configuration)
   */
  updateLimits(newLimits: Partial<RateLimitConfig>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Reset all rate limit counters (for testing or manual reset)
   */
  async reset(): Promise<void> {
    this.requestLog = [];

    if (this.db) {
      try {
        await this.db.clear('requestLog');
      } catch (error) {
        console.error('Failed to clear request log:', error);
      }
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance for app-wide use
let rateLimiterInstance: ClientSideRateLimiter | null = null;

export function getRateLimiter(config?: Partial<RateLimitConfig>): ClientSideRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new ClientSideRateLimiter(config);
  }
  return rateLimiterInstance;
}
