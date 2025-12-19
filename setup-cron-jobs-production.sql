-- COPY AND PASTE INTO SUPABASE SQL EDITOR (PRODUCTION)
-- Manual Setup for pg_cron Jobs (PRODUCTION Environment)
-- Execute this in: Supabase Dashboard → SQL Editor → New Query

-- ============================================ 
-- STEP 1: ENABLE PG_CRON EXTENSION
-- ============================================
-- NOTE: This may already be enabled in your Supabase project
-- If you get an error, pg_cron is already available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- STEP 2: SCHEDULE DAILY PRICING CACHE (3 AM UTC)
-- ============================================
SELECT cron.schedule(
    'daily-pricing-cache',
    '0 3 * * *',
    $$
    SELECT extensions.http_post(
        'https://tggvoqhewfmczyjoxrqu.supabase.co/functions/v1/scheduled-tasks',
        '{"task": "daily-pricing"}',
        'application/json',
        '{"Authorization": "Bearer YOUR_PRODUCTION_SERVICE_ROLE_KEY_HERE"}'::jsonb
    );
    $$
);

-- ============================================
-- STEP 3: SCHEDULE WEEKLY CLEANUP (4 AM SUNDAY UTC) 
-- ============================================
SELECT cron.schedule(
    'weekly-database-cleanup', 
    '0 4 * * 0',
    $$
    SELECT extensions.http_post(
        'https://tggvoqhewfmczyjoxrqu.supabase.co/functions/v1/scheduled-tasks',
        '{"task": "weekly-cleanup"}',
        'application/json',
        '{"Authorization": "Bearer YOUR_PRODUCTION_SERVICE_ROLE_KEY_HERE"}'::jsonb
    );
    $$
);

-- ============================================
-- STEP 4: VERIFY SETUP
-- ============================================
-- Check that jobs are scheduled
SELECT 
    jobname,
    schedule, 
    active,
    command
FROM cron.job
WHERE jobname IN ('daily-pricing-cache', 'weekly-database-cleanup');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'PRODUCTION Cron jobs configured successfully! 🎉' AS message;
SELECT 'Daily pricing: 3 AM UTC daily' AS job1;
SELECT 'Weekly cleanup: 4 AM UTC Sundays' AS job2;

-- ============================================
-- INSTRUCTIONS FOR COMPLETION
-- ============================================
-- 1. Replace "YOUR_PRODUCTION_SERVICE_ROLE_KEY_HERE" with production service role key
-- 2. Copy and paste this entire script into Supabase SQL Editor (PRODUCTION project)
-- 3. Execute the query
-- 4. Verify jobs are listed in the verification step