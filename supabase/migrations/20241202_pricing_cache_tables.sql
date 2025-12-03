-- Migration: Create pricing cache tables for performance optimization
-- File: 20241202_pricing_cache_tables.sql
-- Date: 2024-12-02

-- ONS Pricing Data Cache
-- Stores Office for National Statistics construction price indices
-- Updated daily via cron job to avoid real-time API calls
CREATE TABLE ons_pricing_cache (
  id SERIAL PRIMARY KEY,
  index_type TEXT NOT NULL, -- e.g., 'all_work', 'new_housing', 'infrastructure'
  index_code TEXT NOT NULL, -- ONS dataset code
  current_value DECIMAL(10,2) NOT NULL, -- Current index value
  previous_value DECIMAL(10,2), -- Previous month value for comparison
  month_on_month_change DECIMAL(5,2), -- Percentage change
  year_on_year_change DECIMAL(5,2), -- Annual percentage change
  data_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  data_quarter TEXT, -- Format: 'YYYY-Q1'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(index_type, data_month)
);

-- Create index for fast lookups
CREATE INDEX idx_ons_pricing_cache_type_month ON ons_pricing_cache(index_type, data_month);
CREATE INDEX idx_ons_pricing_cache_updated ON ons_pricing_cache(last_updated);

-- Material Pricing Cache  
-- Pre-computed pricing for common materials to avoid supplier API calls
CREATE TABLE material_pricing_cache (
  id SERIAL PRIMARY KEY,
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'plumbing', 'electrical', 'finishing', etc.
  supplier_prices JSONB NOT NULL, -- Array of supplier price data
  average_price DECIMAL(10,2) NOT NULL, -- Calculated average for quick lookup
  price_range_min DECIMAL(10,2) NOT NULL,
  price_range_max DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- 'each', 'm²', 'm', 'kg', etc.
  regional_variations JSONB, -- Price differences by UK region
  market_trends JSONB, -- Historical price trends
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_id)
);

-- Create indexes for material lookups
CREATE INDEX idx_material_pricing_cache_id ON material_pricing_cache(material_id);
CREATE INDEX idx_material_pricing_cache_category ON material_pricing_cache(category);
CREATE INDEX idx_material_pricing_cache_updated ON material_pricing_cache(last_updated);
CREATE INDEX idx_material_pricing_cache_price_range ON material_pricing_cache(average_price);

-- Regional Labor Rates Cache
-- UK regional variations in labor costs by trade type
CREATE TABLE regional_labor_rates (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL, -- 'London', 'South East', 'North West', etc.
  trade_type TEXT NOT NULL, -- 'plumber', 'electrician', 'carpenter', etc.
  skill_level TEXT NOT NULL, -- 'apprentice', 'skilled', 'master'
  hourly_rate DECIMAL(8,2) NOT NULL,
  daily_rate DECIMAL(8,2),
  overtime_rate DECIMAL(8,2),
  weekend_rate DECIMAL(8,2),
  emergency_rate DECIMAL(8,2),
  source TEXT NOT NULL, -- Data source: 'ons', 'citb', 'market_survey'
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region, trade_type, skill_level)
);

-- Create indexes for labor rate lookups
CREATE INDEX idx_regional_labor_rates_region_trade ON regional_labor_rates(region, trade_type);
CREATE INDEX idx_regional_labor_rates_updated ON regional_labor_rates(last_updated);

-- Project Cost Templates Cache
-- Pre-computed cost templates for common project types
CREATE TABLE project_cost_templates (
  id SERIAL PRIMARY KEY,
  project_type TEXT NOT NULL, -- 'ensuite_bathroom', 'kitchen_renovation', etc.
  project_size TEXT NOT NULL, -- 'small', 'medium', 'large'
  quality_level TEXT NOT NULL, -- 'budget', 'standard', 'premium'
  base_materials_cost DECIMAL(10,2) NOT NULL,
  base_labor_cost DECIMAL(10,2) NOT NULL,
  base_duration_days INTEGER NOT NULL,
  cost_multipliers JSONB NOT NULL, -- Regional and complexity multipliers
  material_list JSONB NOT NULL, -- Standard material requirements
  labor_breakdown JSONB NOT NULL, -- Labor hours by trade
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_type, project_size, quality_level)
);

-- Create indexes for project template lookups
CREATE INDEX idx_project_cost_templates_type ON project_cost_templates(project_type);
CREATE INDEX idx_project_cost_templates_lookup ON project_cost_templates(project_type, project_size, quality_level);

-- Cache Performance Tracking
-- Monitor cache hit rates and performance gains
CREATE TABLE cache_performance_log (
  id SERIAL PRIMARY KEY,
  cache_type TEXT NOT NULL, -- 'ons_pricing', 'material_pricing', 'labor_rates'
  operation_type TEXT NOT NULL, -- 'hit', 'miss', 'update', 'invalidation'
  response_time_ms INTEGER,
  data_freshness_hours INTEGER, -- How old was the cached data
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance monitoring
CREATE INDEX idx_cache_performance_log_type_created ON cache_performance_log(cache_type, created_at);

-- Row Level Security (RLS) Policies
-- Enable RLS on cache tables
ALTER TABLE ons_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_cost_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_performance_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pricing data (it's market data)
CREATE POLICY "Allow public read access to ONS pricing cache" 
ON ons_pricing_cache FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to material pricing cache" 
ON material_pricing_cache FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to labor rates" 
ON regional_labor_rates FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to project templates" 
ON project_cost_templates FOR SELECT 
USING (true);

-- Restrict write access to service role only
CREATE POLICY "Allow service role write access to ONS pricing cache" 
ON ons_pricing_cache FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to material pricing cache" 
ON material_pricing_cache FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to labor rates" 
ON regional_labor_rates FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to project templates" 
ON project_cost_templates FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to cache performance log" 
ON cache_performance_log FOR ALL 
USING (auth.role() = 'service_role');

-- Insert initial seed data for common UK regions
INSERT INTO regional_labor_rates (region, trade_type, skill_level, hourly_rate, daily_rate, source, confidence_score) VALUES
-- London rates (typically 20-30% higher)
('London', 'plumber', 'skilled', 45.00, 360.00, 'market_survey', 85),
('London', 'electrician', 'skilled', 50.00, 400.00, 'market_survey', 85),
('London', 'carpenter', 'skilled', 42.00, 336.00, 'market_survey', 85),
('London', 'tiler', 'skilled', 40.00, 320.00, 'market_survey', 80),
('London', 'painter', 'skilled', 35.00, 280.00, 'market_survey', 80),

-- South East rates
('South East', 'plumber', 'skilled', 38.00, 304.00, 'market_survey', 85),
('South East', 'electrician', 'skilled', 42.00, 336.00, 'market_survey', 85),
('South East', 'carpenter', 'skilled', 35.00, 280.00, 'market_survey', 85),
('South East', 'tiler', 'skilled', 33.00, 264.00, 'market_survey', 80),
('South East', 'painter', 'skilled', 30.00, 240.00, 'market_survey', 80),

-- National average rates  
('National Average', 'plumber', 'skilled', 32.00, 256.00, 'citb', 90),
('National Average', 'electrician', 'skilled', 35.00, 280.00, 'citb', 90),
('National Average', 'carpenter', 'skilled', 28.00, 224.00, 'citb', 90),
('National Average', 'tiler', 'skilled', 26.00, 208.00, 'market_survey', 75),
('National Average', 'painter', 'skilled', 24.00, 192.00, 'market_survey', 75);

-- Insert common project templates
INSERT INTO project_cost_templates (project_type, project_size, quality_level, base_materials_cost, base_labor_cost, base_duration_days, cost_multipliers, material_list, labor_breakdown, confidence_score) VALUES
('ensuite_bathroom', 'small', 'standard', 2800.00, 1200.00, 5, 
 '{"london_multiplier": 1.3, "complexity_multiplier": 1.1}',
 '["bathroom_suite", "tiles", "plumbing_fittings", "electrical_fittings"]',
 '{"plumber_hours": 16, "electrician_hours": 8, "tiler_hours": 12}',
 85),

('kitchen_renovation', 'medium', 'standard', 8500.00, 2400.00, 10,
 '{"london_multiplier": 1.3, "complexity_multiplier": 1.2}', 
 '["kitchen_units", "worktop", "appliances", "plumbing", "electrical"]',
 '{"carpenter_hours": 32, "plumber_hours": 12, "electrician_hours": 16}',
 85);

COMMENT ON TABLE ons_pricing_cache IS 'Cache for ONS construction price indices to avoid real-time API calls';
COMMENT ON TABLE material_pricing_cache IS 'Pre-computed material pricing to speed up quote generation';
COMMENT ON TABLE regional_labor_rates IS 'UK regional labor cost variations by trade and skill level';
COMMENT ON TABLE project_cost_templates IS 'Template costs for common renovation projects';
COMMENT ON TABLE cache_performance_log IS 'Performance monitoring for cache hit rates and response times';