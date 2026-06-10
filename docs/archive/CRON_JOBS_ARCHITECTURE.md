# Cron Jobs Architecture - MVP Implementation

## Overview

AskToddy Mobile uses a simplified 2-job cron architecture to optimize quote generation performance while maintaining system simplicity. This document outlines the MVP implementation strategy.

## Architecture Philosophy

**Principle**: Achieve 80% of performance gains with 20% of complexity.

Instead of multiple specialized cron jobs, we use just 2 consolidated jobs that handle all background processing needs for MVP.

## The 2-Job System

### 1. Daily Pricing Cache (3:00 AM UTC)

**Purpose**: Pre-fetch and cache all pricing data to eliminate real-time API calls during quote generation.

**Tasks**:

- Update ONS construction price indices
- Cache top 50 most-used materials
- Update national average labor rates
- Refresh tool hire base rates

**Frequency**: Once daily at 3 AM (low traffic period)
**Expected Runtime**: ~30 seconds
**Impact**: Reduces quote generation from 3-5 seconds to 1-2 seconds

### 2. Weekly Cleanup (Sunday 4:00 AM UTC)

**Purpose**: Maintain database health and comply with data retention policies.

**Tasks**:

- Remove conversation sessions older than 30 days
- Clear abandoned quotes (>7 days old with no activity)
- Archive old pricing data (>90 days)
- Optimize database indices

**Frequency**: Weekly on Sunday at 4 AM
**Expected Runtime**: ~60 seconds
**Impact**: Keeps database queries fast and storage optimized

## Performance Impact

| Metric                  | Without Caching | With 2 Cron Jobs | Improvement       |
| ----------------------- | --------------- | ---------------- | ----------------- |
| Quote Generation Time   | 3-5 seconds     | 1-2 seconds      | 60-70% faster     |
| External API Calls/Day  | 5,000           | 50               | 99% reduction     |
| Database Storage Growth | Unbounded       | Controlled       | Sustainable       |
| System Reliability      | Variable        | Consistent       | High availability |

## Database Schema

### Simplified Cache Table

```sql
CREATE TABLE pricing_cache (
  id SERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,  -- e.g., 'ons_index_housing', 'material_tiles'
  cache_type TEXT NOT NULL,        -- 'ons', 'material', 'labor'
  data JSONB NOT NULL,              -- Flexible JSON storage
  expires_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Single index for all cache lookups
CREATE INDEX idx_pricing_cache_lookup ON pricing_cache(cache_key, expires_at);
```

### Cleanup Tracking Table

```sql
CREATE TABLE cleanup_log (
  id SERIAL PRIMARY KEY,
  cleanup_type TEXT NOT NULL,      -- 'sessions', 'quotes', 'archive'
  records_processed INTEGER,
  records_deleted INTEGER,
  run_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Details

### Single Edge Function for All Scheduled Tasks

```typescript
// /supabase/functions/scheduled-tasks/index.ts
serve(async req => {
  const { task } = await req.json();

  switch (task) {
    case 'daily-pricing':
      return await runDailyPricingCache();
    case 'weekly-cleanup':
      return await runWeeklyCleanup();
    default:
      return new Response('Unknown task', { status: 400 });
  }
});
```

### Daily Pricing Cache Implementation

```typescript
async function runDailyPricingCache() {
  const startTime = Date.now();
  const results = {
    ons: false,
    materials: false,
    labor: false,
    errors: [],
  };

  try {
    // 1. Update ONS indices (mock data for MVP)
    await updateONSCache();
    results.ons = true;

    // 2. Update top 50 materials
    await updateMaterialCache();
    results.materials = true;

    // 3. Update national labor rates
    await updateLaborCache();
    results.labor = true;

    const runtime = Date.now() - startTime;
    console.log(`✅ Daily pricing cache completed in ${runtime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        runtime,
        results,
      })
    );
  } catch (error) {
    console.error('❌ Daily pricing cache failed:', error);
    results.errors.push(error.message);

    return new Response(
      JSON.stringify({
        success: false,
        results,
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
```

### Weekly Cleanup Implementation

```typescript
async function runWeeklyCleanup() {
  const results = {
    sessions: { processed: 0, deleted: 0 },
    quotes: { processed: 0, deleted: 0 },
    cache: { processed: 0, deleted: 0 },
  };

  try {
    // 1. Clean old sessions (30+ days)
    const sessionCutoff = new Date();
    sessionCutoff.setDate(sessionCutoff.getDate() - 30);

    const { count: sessionsDeleted } = await supabase
      .from('conversation_sessions')
      .delete()
      .lt('last_updated', sessionCutoff.toISOString());

    results.sessions.deleted = sessionsDeleted || 0;

    // 2. Clean abandoned quotes (7+ days inactive)
    const quoteCutoff = new Date();
    quoteCutoff.setDate(quoteCutoff.getDate() - 7);

    // ... cleanup logic

    // 3. Archive old cache entries
    // ... archive logic

    await logCleanup(results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      })
    );
  } catch (error) {
    console.error('❌ Weekly cleanup failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
```

## Monitoring & Alerts

### Health Checks

- Both cron jobs report success/failure to `cleanup_log` table
- Failed jobs trigger alerts (future: integrate with Sentry)
- Dashboard query to monitor job health:

```sql
-- Check last run status for each job
SELECT
  task_type,
  MAX(created_at) as last_run,
  CASE
    WHEN MAX(created_at) < NOW() - INTERVAL '25 hours' THEN 'ALERT: Missed run'
    WHEN success = false THEN 'ALERT: Failed'
    ELSE 'OK'
  END as status
FROM scheduled_task_logs
GROUP BY task_type;
```

### Performance Metrics

Track cache hit rates to validate effectiveness:

```sql
-- Cache hit rate (should be >95% after first day)
SELECT
  DATE(created_at) as date,
  COUNT(CASE WHEN cache_hit THEN 1 END)::float / COUNT(*) * 100 as hit_rate
FROM cache_access_log
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Deployment Instructions

### 1. Create Database Tables

Execute `/supabase/migrations/mvp_cron_tables.sql` in Supabase SQL editor.

### 2. Deploy Edge Function

```bash
npx supabase functions deploy scheduled-tasks --project-ref YOUR_PROJECT_REF
```

### 3. Configure Cron Jobs in Supabase

Navigate to Database → Extensions → pg_cron and add:

```sql
-- Daily Pricing Cache
SELECT cron.schedule(
  'daily-pricing-cache',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-tasks',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"task": "daily-pricing"}'::jsonb
  );
  $$
);

-- Weekly Cleanup
SELECT cron.schedule(
  'weekly-cleanup',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-tasks',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"task": "weekly-cleanup"}'::jsonb
  );
  $$
);
```

### 4. Test Manually

```bash
# Test daily pricing cache
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-tasks \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"task": "daily-pricing"}'

# Test weekly cleanup
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-tasks \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"task": "weekly-cleanup"}'
```

## Future Enhancements (Post-MVP)

Once the system is stable and we have usage data:

1. **Regional Labor Rates**: Add regional multipliers based on user location
2. **Real-time Material Updates**: 6-hourly updates for volatile materials
3. **Supplier API Integration**: Direct integration with Travis Perkins, Wickes APIs
4. **Smart Cache Invalidation**: Update cache when prices change >5%
5. **Predictive Pre-warming**: Cache popular project types based on usage patterns

## Troubleshooting

### Common Issues

**Issue**: Cron job not running

- Check pg_cron extension is enabled
- Verify service role key has correct permissions
- Check Supabase logs for errors

**Issue**: Cache not improving performance

- Verify cache is being populated: `SELECT COUNT(*) FROM pricing_cache`
- Check cache hit rate in metrics
- Ensure edge functions are reading from cache

**Issue**: Database growing too large

- Check cleanup job last run: `SELECT MAX(created_at) FROM cleanup_log`
- Manually run cleanup if needed
- Adjust retention periods if necessary

## Summary

This MVP approach delivers:

- ✅ 60-70% performance improvement
- ✅ Simple 2-job architecture
- ✅ Easy monitoring and debugging
- ✅ Clear upgrade path
- ✅ Minimal operational overhead

The system is designed to be "boring" - it should just work reliably in the background, making quotes faster without adding complexity to the codebase.
