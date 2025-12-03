-- MVP Cron Jobs Database Schema
-- Simplified 2-job architecture for performance optimization
-- Date: 2024-12-03

-- Drop existing complex tables if they exist (clean slate for MVP)
DROP TABLE IF EXISTS ons_pricing_cache CASCADE;
DROP TABLE IF EXISTS material_pricing_cache CASCADE;
DROP TABLE IF EXISTS regional_labor_rates CASCADE;
DROP TABLE IF EXISTS project_cost_templates CASCADE;
DROP TABLE IF EXISTS cache_performance_log CASCADE;

-- ============================================
-- SIMPLIFIED PRICING CACHE TABLE
-- Single table for all pricing data (ONS, materials, labor)
-- ============================================
CREATE TABLE pricing_cache (
  id SERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,      -- Unique identifier like 'ons_housing_2024-10'
  cache_type TEXT NOT NULL,            -- 'ons', 'material', 'labor', 'tool_hire'
  category TEXT,                       -- Optional category within type
  data JSONB NOT NULL,                 -- Flexible storage for any pricing data
  expires_at TIMESTAMP WITH TIME ZONE, -- When this cache entry expires
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_cache_type CHECK (cache_type IN ('ons', 'material', 'labor', 'tool_hire')),
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Optimized indexes for fast lookups
CREATE INDEX idx_pricing_cache_lookup ON pricing_cache(cache_key) WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_pricing_cache_type ON pricing_cache(cache_type, category);
CREATE INDEX idx_pricing_cache_expiry ON pricing_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- SCHEDULED TASK LOG
-- Track execution of our 2 cron jobs
-- ============================================
CREATE TABLE scheduled_task_log (
  id SERIAL PRIMARY KEY,
  task_type TEXT NOT NULL,             -- 'daily_pricing' or 'weekly_cleanup'
  success BOOLEAN NOT NULL,
  runtime_ms INTEGER,
  records_processed INTEGER,
  records_updated INTEGER,
  error_message TEXT,
  details JSONB,                       -- Flexible field for task-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_task_type CHECK (task_type IN ('daily_pricing', 'weekly_cleanup'))
);

-- Index for monitoring dashboard
CREATE INDEX idx_task_log_monitoring ON scheduled_task_log(task_type, created_at DESC);

-- ============================================
-- CLEANUP LOG
-- Track what was cleaned during weekly maintenance
-- ============================================
CREATE TABLE cleanup_log (
  id SERIAL PRIMARY KEY,
  cleanup_type TEXT NOT NULL,          -- 'sessions', 'quotes', 'cache', 'logs'
  records_examined INTEGER NOT NULL DEFAULT 0,
  records_deleted INTEGER NOT NULL DEFAULT 0,
  bytes_freed BIGINT,                  -- Optional: storage space freed
  run_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_cleanup_type CHECK (cleanup_type IN ('sessions', 'quotes', 'cache', 'logs'))
);

-- Index for cleanup history
CREATE INDEX idx_cleanup_history ON cleanup_log(cleanup_type, created_at DESC);

-- ============================================
-- CACHE ACCESS LOG
-- Lightweight tracking of cache hits/misses for performance monitoring
-- ============================================
CREATE TABLE cache_access_log (
  id SERIAL PRIMARY KEY,
  cache_type TEXT NOT NULL,
  cache_key TEXT,
  cache_hit BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioned by day for efficient cleanup (optional for MVP)
CREATE INDEX idx_cache_access_daily ON cache_access_log(DATE(created_at), cache_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_task_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_access_log ENABLE ROW LEVEL SECURITY;

-- Pricing cache: Public read, service role write
CREATE POLICY "Public read access to pricing cache" 
  ON pricing_cache FOR SELECT 
  USING (true);

CREATE POLICY "Service role write access to pricing cache" 
  ON pricing_cache FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

-- Logs: Service role only
CREATE POLICY "Service role access to task log" 
  ON scheduled_task_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role access to cleanup log" 
  ON cleanup_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role access to cache access log" 
  ON cache_access_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if cache is valid
CREATE OR REPLACE FUNCTION is_cache_valid(key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pricing_cache 
    WHERE cache_key = key 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get cached data
CREATE OR REPLACE FUNCTION get_cached_data(key TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT data INTO result
  FROM pricing_cache 
  WHERE cache_key = key 
  AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
  
  -- Log the access
  INSERT INTO cache_access_log (cache_type, cache_key, cache_hit)
  VALUES (
    (SELECT cache_type FROM pricing_cache WHERE cache_key = key LIMIT 1),
    key,
    result IS NOT NULL
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old sessions (called by weekly cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM conversation_sessions 
  WHERE last_updated < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA FOR TESTING
-- ============================================

-- Insert mock ONS data for testing
INSERT INTO pricing_cache (cache_key, cache_type, category, data, expires_at) VALUES
('ons_all_work_2024-11', 'ons', 'all_work', 
 '{"index": 125.4, "month_change": 0.8, "year_change": 4.2, "period": "2024-11"}', 
 NOW() + INTERVAL '24 hours'),

('ons_housing_2024-11', 'ons', 'housing', 
 '{"index": 128.1, "month_change": 1.5, "year_change": 5.2, "period": "2024-11"}', 
 NOW() + INTERVAL '24 hours'),

('material_bathroom_suite', 'material', 'bathroom',
 '{"name": "Complete Bathroom Suite", "price_min": 450, "price_max": 850, "unit": "each"}',
 NOW() + INTERVAL '24 hours'),

('labor_national_plumber', 'labor', 'plumber',
 '{"hourly_rate": 35, "daily_rate": 280, "location": "national_average"}',
 NOW() + INTERVAL '7 days')

ON CONFLICT (cache_key) DO UPDATE SET
  data = EXCLUDED.data,
  expires_at = EXCLUDED.expires_at,
  last_updated = NOW();

-- Insert a test task log entry
INSERT INTO scheduled_task_log (task_type, success, runtime_ms, records_processed, records_updated) VALUES
('daily_pricing', true, 1250, 4, 4);

-- ============================================
-- MONITORING VIEWS
-- ============================================

-- View for cache effectiveness
CREATE OR REPLACE VIEW cache_performance_view AS
SELECT 
  DATE(created_at) as date,
  cache_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN cache_hit THEN 1 END) as cache_hits,
  COUNT(CASE WHEN NOT cache_hit THEN 1 END) as cache_misses,
  ROUND(COUNT(CASE WHEN cache_hit THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as hit_rate_percent,
  ROUND(AVG(response_time_ms), 2) as avg_response_ms
FROM cache_access_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), cache_type
ORDER BY date DESC, cache_type;

-- View for cron job health
CREATE OR REPLACE VIEW cron_job_health AS
SELECT 
  task_type,
  MAX(created_at) as last_run,
  MAX(CASE WHEN success THEN created_at END) as last_success,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as runs_past_week,
  COUNT(*) FILTER (WHERE success AND created_at > NOW() - INTERVAL '7 days') as successful_runs,
  AVG(runtime_ms) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as avg_runtime_ms,
  CASE 
    WHEN MAX(created_at) < NOW() - INTERVAL '25 hours' AND task_type = 'daily_pricing' THEN 'MISSED'
    WHEN MAX(created_at) < NOW() - INTERVAL '8 days' AND task_type = 'weekly_cleanup' THEN 'MISSED'
    WHEN MAX(CASE WHEN success THEN 1 ELSE 0 END) = 0 THEN 'FAILING'
    ELSE 'HEALTHY'
  END as status
FROM scheduled_task_log
GROUP BY task_type;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE pricing_cache IS 'Simplified cache for all pricing data - ONS indices, materials, labor rates';
COMMENT ON TABLE scheduled_task_log IS 'Execution history for our 2 MVP cron jobs';
COMMENT ON TABLE cleanup_log IS 'Track weekly cleanup operations for monitoring';
COMMENT ON TABLE cache_access_log IS 'Lightweight cache hit/miss tracking for performance monitoring';

COMMENT ON FUNCTION is_cache_valid IS 'Check if a cache key exists and is not expired';
COMMENT ON FUNCTION get_cached_data IS 'Retrieve cached data and log the access for monitoring';
COMMENT ON FUNCTION cleanup_old_sessions IS 'Remove old conversation sessions - called by weekly cleanup job';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'MVP Cron Jobs tables created successfully!';
  RAISE NOTICE 'Tables created: pricing_cache, scheduled_task_log, cleanup_log, cache_access_log';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy the scheduled-tasks edge function';
  RAISE NOTICE '  2. Configure pg_cron jobs in Supabase dashboard';
  RAISE NOTICE '  3. Test with manual triggers';
END $$;