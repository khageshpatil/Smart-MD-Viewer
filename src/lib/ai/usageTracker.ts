/**
 * Usage Tracker
 * Tracks Gemini API usage including tokens and estimated costs
 * Helps users monitor spending and detect unusual activity
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface UsageDB extends DBSchema {
  usage: {
    key: number;
    value: UsageRecord;
    indexes: { timestamp: number; conversationId: string };
  };
  budgets: {
    key: string; // 'daily' | 'weekly' | 'monthly'
    value: BudgetConfig;
  };
}

export interface UsageRecord {
  timestamp: number;
  conversationId: string;
  endpoint: string;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  estimatedCost: number; // in USD
  model: string;
}

export interface BudgetConfig {
  limit: number; // USD
  alertThreshold: number; // percentage (e.g., 80 = alert at 80% of limit)
  period: 'daily' | 'weekly' | 'monthly';
}

export interface UsageReport {
  today: {
    requests: number;
    tokens: number;
    cost: number;
  };
  thisWeek: {
    requests: number;
    tokens: number;
    cost: number;
  };
  thisMonth: {
    requests: number;
    tokens: number;
    cost: number;
  };
  averageCostPerRequest: number;
  budgetStatus: {
    daily: BudgetStatus;
    weekly: BudgetStatus;
    monthly: BudgetStatus;
  };
}

export interface BudgetStatus {
  used: number;
  limit: number;
  percentage: number;
  exceeded: boolean;
  shouldAlert: boolean;
}

// Gemini API pricing (as of 2024) - Update these based on current pricing
const PRICING = {
  'gemini-1.5-flash': {
    promptTokens: 0.075 / 1_000_000, // $0.075 per 1M tokens
    completionTokens: 0.3 / 1_000_000, // $0.30 per 1M tokens
  },
  'gemini-1.5-pro': {
    promptTokens: 3.5 / 1_000_000, // $3.50 per 1M tokens
    completionTokens: 10.5 / 1_000_000, // $10.50 per 1M tokens
  },
  default: {
    promptTokens: 0.075 / 1_000_000,
    completionTokens: 0.3 / 1_000_000,
  },
};

const DEFAULT_BUDGETS: Record<string, BudgetConfig> = {
  daily: { limit: 1.0, alertThreshold: 80, period: 'daily' },
  weekly: { limit: 5.0, alertThreshold: 80, period: 'weekly' },
  monthly: { limit: 20.0, alertThreshold: 80, period: 'monthly' },
};

export class UsageTracker {
  private db: IDBPDatabase<UsageDB> | null = null;
  private dbName = 'cortex-usage-tracker';
  private cache: UsageRecord[] = [];
  private budgets: Record<string, BudgetConfig> = DEFAULT_BUDGETS;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<UsageDB>(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('usage')) {
            const store = db.createObjectStore('usage', { keyPath: 'timestamp' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('conversationId', 'conversationId');
          }
          if (!db.objectStoreNames.contains('budgets')) {
            db.createObjectStore('budgets', { keyPath: 'period' });
          }
        },
      });

      await this.loadCache();
      await this.loadBudgets();
    } catch (error) {
      console.error('Failed to initialize usage tracker DB:', error);
    }
  }

  private async loadCache(): Promise<void> {
    if (!this.db) return;

    try {
      // Load last 30 days for faster queries
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const tx = this.db.transaction('usage', 'readonly');
      const store = tx.objectStore('usage');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(thirtyDaysAgo);
      this.cache = await index.getAll(range);
    } catch (error) {
      console.error('Failed to load usage cache:', error);
    }
  }

  private async loadBudgets(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const budgets = await store.getAll();

      budgets.forEach((budget) => {
        this.budgets[budget.period] = budget;
      });
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  }

  /**
   * Calculate estimated cost for a request
   */
  static calculateCost(
    tokensPrompt: number,
    tokensCompletion: number,
    model: string = 'gemini-1.5-flash'
  ): number {
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING.default;
    const promptCost = tokensPrompt * pricing.promptTokens;
    const completionCost = tokensCompletion * pricing.completionTokens;
    return promptCost + completionCost;
  }

  /**
   * Track a new API request
   */
  async trackRequest(params: {
    conversationId: string;
    endpoint?: string;
    tokensPrompt: number;
    tokensCompletion: number;
    model?: string;
  }): Promise<UsageRecord> {
    const model = params.model || 'gemini-1.5-flash';
    const record: UsageRecord = {
      timestamp: Date.now(),
      conversationId: params.conversationId,
      endpoint: params.endpoint || 'generateContent',
      tokensPrompt: params.tokensPrompt,
      tokensCompletion: params.tokensCompletion,
      tokensTotal: params.tokensPrompt + params.tokensCompletion,
      estimatedCost: UsageTracker.calculateCost(
        params.tokensPrompt,
        params.tokensCompletion,
        model
      ),
      model,
    };

    // Add to cache
    this.cache.push(record);

    // Persist to IndexedDB
    if (this.db) {
      try {
        await this.db.add('usage', record);
      } catch (error) {
        console.error('Failed to persist usage record:', error);
      }
    }

    // Check budget thresholds
    await this.checkBudgets();

    return record;
  }

  /**
   * Get usage statistics
   */
  async getUsageReport(): Promise<UsageReport> {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const todayRecords = this.cache.filter((r) => r.timestamp > dayAgo);
    const weekRecords = this.cache.filter((r) => r.timestamp > weekAgo);
    const monthRecords = this.cache.filter((r) => r.timestamp > monthAgo);

    const sumCost = (records: UsageRecord[]) =>
      records.reduce((sum, r) => sum + r.estimatedCost, 0);
    const sumTokens = (records: UsageRecord[]) =>
      records.reduce((sum, r) => sum + r.tokensTotal, 0);

    const totalCost = sumCost(this.cache);
    const totalRequests = this.cache.length;

    return {
      today: {
        requests: todayRecords.length,
        tokens: sumTokens(todayRecords),
        cost: sumCost(todayRecords),
      },
      thisWeek: {
        requests: weekRecords.length,
        tokens: sumTokens(weekRecords),
        cost: sumCost(weekRecords),
      },
      thisMonth: {
        requests: monthRecords.length,
        tokens: sumTokens(monthRecords),
        cost: sumCost(monthRecords),
      },
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      budgetStatus: {
        daily: this.getBudgetStatus('daily', sumCost(todayRecords)),
        weekly: this.getBudgetStatus('weekly', sumCost(weekRecords)),
        monthly: this.getBudgetStatus('monthly', sumCost(monthRecords)),
      },
    };
  }

  private getBudgetStatus(period: string, used: number): BudgetStatus {
    const budget = this.budgets[period];
    const percentage = (used / budget.limit) * 100;

    return {
      used,
      limit: budget.limit,
      percentage: Math.round(percentage),
      exceeded: used > budget.limit,
      shouldAlert: percentage >= budget.alertThreshold,
    };
  }

  /**
   * Check if any budgets are exceeded
   */
  private async checkBudgets(): Promise<void> {
    const report = await this.getUsageReport();

    if (report.budgetStatus.daily.shouldAlert) {
      this.notifyBudgetAlert('daily', report.budgetStatus.daily);
    }
    if (report.budgetStatus.weekly.shouldAlert) {
      this.notifyBudgetAlert('weekly', report.budgetStatus.weekly);
    }
    if (report.budgetStatus.monthly.shouldAlert) {
      this.notifyBudgetAlert('monthly', report.budgetStatus.monthly);
    }
  }

  private notifyBudgetAlert(period: string, status: BudgetStatus): void {
    const message = status.exceeded
      ? `⚠️ ${period} budget EXCEEDED: $${status.used.toFixed(2)} / $${status.limit.toFixed(2)}`
      : `⚠️ ${period} budget alert: ${status.percentage}% used ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)})`;

    console.warn(message);

    // Could dispatch custom event for UI to show notification
    window.dispatchEvent(
      new CustomEvent('budget-alert', {
        detail: { period, status, message },
      })
    );
  }

  /**
   * Update budget configuration
   */
  async updateBudget(period: 'daily' | 'weekly' | 'monthly', config: BudgetConfig): Promise<void> {
    this.budgets[period] = config;

    if (this.db) {
      try {
        await this.db.put('budgets', config);
      } catch (error) {
        console.error('Failed to update budget:', error);
      }
    }
  }

  /**
   * Get usage for a specific conversation
   */
  getConversationUsage(conversationId: string): {
    requests: number;
    tokens: number;
    cost: number;
  } {
    const records = this.cache.filter((r) => r.conversationId === conversationId);
    return {
      requests: records.length,
      tokens: records.reduce((sum, r) => sum + r.tokensTotal, 0),
      cost: records.reduce((sum, r) => sum + r.estimatedCost, 0),
    };
  }

  /**
   * Clear old usage data (older than X days)
   */
  async clearOldData(daysToKeep: number = 90): Promise<void> {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    // Clear from cache
    this.cache = this.cache.filter((r) => r.timestamp > cutoff);

    // Clear from IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction('usage', 'readwrite');
        const store = tx.objectStore('usage');
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoff);

        let cursor = await index.openCursor(range);
        while (cursor) {
          await cursor.delete();
          cursor = await cursor.continue();
        }
      } catch (error) {
        console.error('Failed to clear old usage data:', error);
      }
    }
  }

  /**
   * Export usage data as JSON
   */
  async exportData(): Promise<string> {
    return JSON.stringify(
      {
        records: this.cache,
        budgets: this.budgets,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
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
let usageTrackerInstance: UsageTracker | null = null;

export function getUsageTracker(): UsageTracker {
  if (!usageTrackerInstance) {
    usageTrackerInstance = new UsageTracker();
  }
  return usageTrackerInstance;
}
