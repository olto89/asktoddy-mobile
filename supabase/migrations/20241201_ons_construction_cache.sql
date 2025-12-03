-- ONS Construction Price Indices Cache Table
-- Stores UK government construction price data for enhanced pricing accuracy

CREATE TABLE IF NOT EXISTS ons_construction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source TEXT NOT NULL, -- 'ons_api', 'ons_download', 'estimated'
  category TEXT NOT NULL, -- 'new_work_housing', 'new_work_commercial', 'repair_maintenance', 'all_construction'
  period TEXT NOT NULL, -- 'Q1-2024', 'Q2-2024', etc.
  index_value DECIMAL(10,2) NOT NULL, -- Price index value (base 2015=100)
  quarterly_change DECIMAL(5,2), -- Percentage change from previous quarter
  annual_change DECIMAL(5,2), -- Percentage change from same quarter previous year
  raw_data JSONB, -- Full ONS response for debugging/analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Constraints
  CONSTRAINT unique_category_period UNIQUE (category, period),
  CONSTRAINT valid_index_value CHECK (index_value > 0),
  CONSTRAINT valid_period_format CHECK (period ~ '^Q[1-4]-\d{4}$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ons_cache_category ON ons_construction_cache(category);
CREATE INDEX IF NOT EXISTS idx_ons_cache_period ON ons_construction_cache(period DESC);
CREATE INDEX IF NOT EXISTS idx_ons_cache_expires_at ON ons_construction_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ons_cache_created_at ON ons_construction_cache(created_at DESC);

-- RLS Policies
ALTER TABLE ons_construction_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON ons_construction_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read construction data
CREATE POLICY "Allow authenticated read" ON ons_construction_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_ons_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ons_construction_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest construction index for a category
CREATE OR REPLACE FUNCTION get_latest_construction_index(category_name TEXT)
RETURNS TABLE (
  category TEXT,
  period TEXT,
  index_value DECIMAL,
  quarterly_change DECIMAL,
  annual_change DECIMAL,
  data_age_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    occ.category,
    occ.period,
    occ.index_value,
    occ.quarterly_change,
    occ.annual_change,
    EXTRACT(EPOCH FROM (NOW() - occ.created_at))/3600 AS data_age_hours
  FROM ons_construction_cache occ
  WHERE occ.category = category_name
    AND occ.expires_at > NOW()
  ORDER BY occ.period DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ons_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ons_cache_updated_at_trigger
  BEFORE UPDATE ON ons_construction_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ons_cache_updated_at();

-- Insert some initial estimated data for fallback
INSERT INTO ons_construction_cache (data_source, category, period, index_value, quarterly_change, annual_change, raw_data)
VALUES 
  ('estimated', 'all_construction', 'Q3-2024', 125.4, 1.2, 4.8, '{"note": "Estimated baseline data"}'),
  ('estimated', 'new_work_housing', 'Q3-2024', 128.1, 1.5, 5.2, '{"note": "Estimated baseline data"}'),
  ('estimated', 'new_work_commercial', 'Q3-2024', 123.7, 0.9, 3.8, '{"note": "Estimated baseline data"}'),
  ('estimated', 'repair_maintenance', 'Q3-2024', 121.2, 0.8, 3.2, '{"note": "Estimated baseline data"}')
ON CONFLICT (category, period) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE ons_construction_cache IS 'Cache table for UK ONS construction price indices data with 24-hour TTL';
COMMENT ON COLUMN ons_construction_cache.data_source IS 'Source of data: ons_api, ons_download, or estimated';
COMMENT ON COLUMN ons_construction_cache.category IS 'ONS construction category for price indexing';
COMMENT ON COLUMN ons_construction_cache.index_value IS 'Price index value with base period 2015=100';
COMMENT ON COLUMN ons_construction_cache.expires_at IS 'Cache expiration timestamp (24 hours from creation)';