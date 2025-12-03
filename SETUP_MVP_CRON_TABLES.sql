-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- MVP Cron Jobs - Essential Tables Only
-- Copy and paste this entire script into Supabase → SQL Editor → New Query

-- ============================================
-- STEP 1: PRICING CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_cache (
  id SERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  cache_type TEXT NOT NULL,
  category TEXT,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_cache_lookup ON pricing_cache(cache_key);

-- ============================================
-- STEP 2: TASK EXECUTION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_task_log (
  id SERIAL PRIMARY KEY,
  task_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  runtime_ms INTEGER,
  records_processed INTEGER,
  records_updated INTEGER,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CLEANUP LOG
-- ============================================
CREATE TABLE IF NOT EXISTS cleanup_log (
  id SERIAL PRIMARY KEY,
  cleanup_type TEXT NOT NULL,
  records_examined INTEGER NOT NULL DEFAULT 0,
  records_deleted INTEGER NOT NULL DEFAULT 0,
  run_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: CACHE ACCESS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS cache_access_log (
  id SERIAL PRIMARY KEY,
  cache_type TEXT NOT NULL,
  cache_key TEXT,
  cache_hit BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: ROW LEVEL SECURITY
-- ============================================
ALTER TABLE pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_task_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_access_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pricing cache
DROP POLICY IF EXISTS "Public read access to pricing cache" ON pricing_cache;
CREATE POLICY "Public read access to pricing cache" 
  ON pricing_cache FOR SELECT 
  USING (true);

-- Allow service role write access
DROP POLICY IF EXISTS "Service role write access to pricing cache" ON pricing_cache;
CREATE POLICY "Service role write access to pricing cache" 
  ON pricing_cache FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

-- Service role access to logs
DROP POLICY IF EXISTS "Service role access to task log" ON scheduled_task_log;
CREATE POLICY "Service role access to task log" 
  ON scheduled_task_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access to cleanup log" ON cleanup_log;
CREATE POLICY "Service role access to cleanup log" 
  ON cleanup_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access to cache access log" ON cache_access_log;
CREATE POLICY "Service role access to cache access log" 
  ON cache_access_log FOR ALL 
  USING (auth.role() = 'service_role' OR auth.jwt()->>'role' = 'service_role');

-- ============================================
-- STEP 6: TEST DATA
-- ============================================
INSERT INTO pricing_cache (cache_key, cache_type, category, data, expires_at) VALUES
('test_material', 'material', 'test', '{"name": "Test Material", "price": 100}', NOW() + INTERVAL '1 hour')
ON CONFLICT (cache_key) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'MVP Cron Tables Created Successfully! 🎉' AS message;

-- Check tables exist
SELECT 
  'Table Count: ' || COUNT(*)::TEXT AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_cache', 'scheduled_task_log', 'cleanup_log', 'cache_access_log');

-- Show sample data
SELECT * FROM pricing_cache LIMIT 3;