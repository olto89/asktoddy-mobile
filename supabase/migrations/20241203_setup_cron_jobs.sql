-- Setup pg_cron jobs for MVP cron system
-- This migration configures the actual scheduled execution

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clear any existing jobs with our names (in case of re-run)
SELECT cron.unschedule('daily-pricing-cache');
SELECT cron.unschedule('weekly-database-cleanup');

-- Schedule daily pricing cache update at 3 AM UTC
SELECT cron.schedule(
    'daily-pricing-cache',
    '0 3 * * *',  -- Every day at 3 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/scheduled-tasks',
        headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}',
        body := '{"task": "daily-pricing"}'
    );
    $$
);

-- Schedule weekly cleanup at 4 AM UTC on Sundays  
SELECT cron.schedule(
    'weekly-database-cleanup',
    '0 4 * * 0',  -- Every Sunday at 4 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/scheduled-tasks',
        headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}',
        body := '{"task": "weekly-cleanup"}'
    );
    $$
);

-- Create a view to monitor cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
    jobname,
    schedule,
    active,
    jobid,
    database,
    username,
    command
FROM cron.job
WHERE jobname IN ('daily-pricing-cache', 'weekly-database-cleanup')
ORDER BY jobname;

-- Log successful setup
INSERT INTO scheduled_task_log (task_type, success, runtime_ms, records_processed, records_updated, details) 
VALUES ('cron_setup', true, 0, 2, 2, '{"jobs_created": ["daily-pricing-cache", "weekly-database-cleanup"]}');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'pg_cron jobs configured successfully!';
  RAISE NOTICE 'Daily pricing cache: Every day at 3 AM UTC';
  RAISE NOTICE 'Weekly cleanup: Every Sunday at 4 AM UTC';
  RAISE NOTICE 'View job status: SELECT * FROM cron_job_status;';
END $$;