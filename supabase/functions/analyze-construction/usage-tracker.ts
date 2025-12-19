/**
 * Simple API Usage Tracker for Free Tier Management
 * Tracks daily Gemini API usage to stay within free limits
 */

export class UsageTracker {
  private static DAILY_LIMIT = 200;
  private static WARNING_THRESHOLD = 150;

  // In production, use database or Redis
  // For now, use in-memory counter (resets on deploy)
  private static dailyCount = 0;
  private static lastReset = new Date().toDateString();

  static incrementUsage(): {
    used: number;
    remaining: number;
    withinLimit: boolean;
    shouldWarn: boolean;
  } {
    // Reset counter if new day (Pacific time)
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      this.dailyCount = 0;
      this.lastReset = today;
    }

    this.dailyCount++;

    const remaining = this.DAILY_LIMIT - this.dailyCount;
    const withinLimit = this.dailyCount < this.DAILY_LIMIT;
    const shouldWarn = this.dailyCount >= this.WARNING_THRESHOLD;

    // Log for monitoring
    console.log(`📊 API Usage: ${this.dailyCount}/${this.DAILY_LIMIT} (${remaining} remaining)`);

    if (shouldWarn) {
      console.warn(`⚠️ API Usage Warning: ${this.dailyCount} requests used today!`);
    }

    return {
      used: this.dailyCount,
      remaining,
      withinLimit,
      shouldWarn,
    };
  }

  static checkLimit(): boolean {
    return this.dailyCount < this.DAILY_LIMIT;
  }

  static getStats() {
    return {
      used: this.dailyCount,
      limit: this.DAILY_LIMIT,
      remaining: this.DAILY_LIMIT - this.dailyCount,
      percentUsed: Math.round((this.dailyCount / this.DAILY_LIMIT) * 100),
      lastReset: this.lastReset,
    };
  }
}
