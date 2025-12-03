-- Quick setup for ONS pricing cache tables
-- Execute this in Supabase SQL Editor

-- ONS Pricing Data Cache
CREATE TABLE IF NOT EXISTS ons_pricing_cache (
  id SERIAL PRIMARY KEY,
  index_type TEXT NOT NULL,
  index_code TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  previous_value DECIMAL(10,2),
  month_on_month_change DECIMAL(5,2),
  year_on_year_change DECIMAL(5,2),
  data_month TEXT NOT NULL,
  data_quarter TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(index_type, data_month)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ons_pricing_cache_type_month ON ons_pricing_cache(index_type, data_month);

-- Enable RLS
ALTER TABLE ons_pricing_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pricing data
CREATE POLICY "Allow public read access to ONS pricing cache" 
ON ons_pricing_cache FOR SELECT 
USING (true);

-- Allow service role write access
CREATE POLICY "Allow service role write access to ONS pricing cache" 
ON ons_pricing_cache FOR ALL 
USING (auth.role() = 'service_role');

-- Insert some initial test data
INSERT INTO ons_pricing_cache (index_type, index_code, current_value, previous_value, month_on_month_change, year_on_year_change, data_month, data_quarter) VALUES
('construction-all-work', 'COPI_ALL', 125.4, 124.4, 0.8, 4.2, '2024-10', '2024-Q4'),
('construction-new-housing', 'COPI_HOUSING', 128.1, 126.2, 1.5, 5.2, '2024-10', '2024-Q4')
ON CONFLICT (index_type, data_month) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  month_on_month_change = EXCLUDED.month_on_month_change,
  year_on_year_change = EXCLUDED.year_on_year_change,
  last_updated = NOW();