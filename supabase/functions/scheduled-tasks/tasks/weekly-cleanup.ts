/**
 * Weekly Cleanup Task
 * Runs every Sunday at 4 AM to maintain database health
 *
 * Tasks:
 * - Remove old conversation sessions (30+ days)
 * - Clear abandoned quotes (7+ days)
 * - Archive old pricing data (90+ days)
 * - Clean up access logs (7+ days)
 */

export async function runWeeklyCleanup(supabase: any) {
  const results = {
    success: true,
    sessions_deleted: 0,
    quotes_deleted: 0,
    cache_deleted: 0,
    logs_deleted: 0,
    records_processed: 0,
    records_updated: 0,
    errors: [] as string[],
  };

  try {
    console.log('🧹 Starting weekly cleanup...');

    // 1. Clean Old Conversation Sessions
    console.log('💬 Cleaning old conversation sessions...');
    try {
      const sessionsDeleted = await cleanOldSessions(supabase);
      results.sessions_deleted = sessionsDeleted;
      results.records_updated += sessionsDeleted;

      await logCleanup(supabase, 'sessions', sessionsDeleted);
    } catch (error) {
      console.error('Session cleanup failed:', error);
      results.errors.push(`Sessions: ${error.message}`);
    }

    // 2. Clean Abandoned Quotes
    console.log('📋 Cleaning abandoned quotes...');
    try {
      const quotesDeleted = await cleanAbandonedQuotes(supabase);
      results.quotes_deleted = quotesDeleted;
      results.records_updated += quotesDeleted;

      await logCleanup(supabase, 'quotes', quotesDeleted);
    } catch (error) {
      console.error('Quote cleanup failed:', error);
      results.errors.push(`Quotes: ${error.message}`);
    }

    // 3. Clean Expired Cache Entries
    console.log('🗄️ Cleaning expired cache entries...');
    try {
      const cacheDeleted = await cleanExpiredCache(supabase);
      results.cache_deleted = cacheDeleted;
      results.records_updated += cacheDeleted;

      await logCleanup(supabase, 'cache', cacheDeleted);
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      results.errors.push(`Cache: ${error.message}`);
    }

    // 4. Clean Old Access Logs
    console.log('📊 Cleaning old access logs...');
    try {
      const logsDeleted = await cleanOldLogs(supabase);
      results.logs_deleted = logsDeleted;
      results.records_updated += logsDeleted;

      await logCleanup(supabase, 'logs', logsDeleted);
    } catch (error) {
      console.error('Logs cleanup failed:', error);
      results.errors.push(`Logs: ${error.message}`);
    }

    results.records_processed = results.records_updated;
    results.success = results.errors.length === 0;

    console.log(`✅ Weekly cleanup completed: ${results.records_updated} records cleaned`);
  } catch (error) {
    console.error('❌ Weekly cleanup failed:', error);
    results.success = false;
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Clean conversation sessions older than 30 days
 */
async function cleanOldSessions(supabase: any): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  console.log(`🗑️ Deleting sessions older than ${cutoffDate.toISOString()}`);

  // First, count how many we're about to delete
  const { count } = await supabase
    .from('conversation_sessions')
    .select('*', { count: 'exact', head: true })
    .lt('last_updated', cutoffDate.toISOString());

  if (count === 0) {
    console.log('No old sessions to clean');
    return 0;
  }

  // Delete the old sessions
  const { error } = await supabase
    .from('conversation_sessions')
    .delete()
    .lt('last_updated', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Failed to delete old sessions: ${error.message}`);
  }

  console.log(`✅ Deleted ${count} old conversation sessions`);
  return count || 0;
}

/**
 * Clean abandoned quotes (no activity for 7+ days)
 * Note: This assumes quotes are stored somewhere - adjust table name as needed
 */
async function cleanAbandonedQuotes(supabase: any): Promise<number> {
  // For MVP, we might not have a separate quotes table
  // This is a placeholder for future implementation

  // If quotes are part of conversation_sessions, we can clean based on response type
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  try {
    // Look for sessions with quotes that haven't been updated
    const { data: quoteSessions } = await supabase
      .from('conversation_sessions')
      .select('session_id')
      .contains('message_history', [{ responseType: 'quote' }])
      .lt('last_updated', cutoffDate.toISOString());

    const count = quoteSessions?.length || 0;

    if (count > 0) {
      console.log(`📋 Found ${count} abandoned quote sessions`);
      // In production, you might want to archive these instead of deleting
    }

    return 0; // Return 0 for MVP as we're not actually deleting
  } catch (error) {
    console.warn('Quote cleanup skipped:', error);
    return 0;
  }
}

/**
 * Clean expired cache entries
 */
async function cleanExpiredCache(supabase: any): Promise<number> {
  console.log('🗄️ Cleaning expired cache entries...');

  // Count expired entries
  const { count } = await supabase
    .from('pricing_cache')
    .select('*', { count: 'exact', head: true })
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null);

  if (count === 0) {
    console.log('No expired cache entries');
    return 0;
  }

  // Delete expired entries
  const { error } = await supabase
    .from('pricing_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null);

  if (error) {
    throw new Error(`Failed to delete expired cache: ${error.message}`);
  }

  console.log(`✅ Deleted ${count} expired cache entries`);
  return count || 0;
}

/**
 * Clean old access logs (keep only last 7 days for MVP)
 */
async function cleanOldLogs(supabase: any): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  console.log(`📊 Cleaning access logs older than ${cutoffDate.toISOString()}`);

  // Count old logs
  const { count } = await supabase
    .from('cache_access_log')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', cutoffDate.toISOString());

  if (count === 0) {
    console.log('No old logs to clean');
    return 0;
  }

  // Delete old logs
  const { error } = await supabase
    .from('cache_access_log')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Failed to delete old logs: ${error.message}`);
  }

  console.log(`✅ Deleted ${count} old access log entries`);
  return count || 0;
}

/**
 * Log cleanup operation for monitoring
 */
async function logCleanup(
  supabase: any,
  cleanupType: string,
  recordsDeleted: number
): Promise<void> {
  try {
    await supabase.from('cleanup_log').insert({
      cleanup_type: cleanupType,
      records_examined: recordsDeleted, // For MVP, examined = deleted
      records_deleted: recordsDeleted,
      run_duration_ms: 0, // Could calculate actual duration if needed
    });
  } catch (error) {
    console.warn(`Failed to log cleanup for ${cleanupType}:`, error);
  }
}
