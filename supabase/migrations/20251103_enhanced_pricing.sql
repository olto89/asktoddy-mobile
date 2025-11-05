-- Enhanced pricing table for hybrid data collection
-- Supporting the HYBRID_PRICING_STRATEGY.md implementation

CREATE TABLE IF NOT EXISTS pricing_data_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_description TEXT NOT NULL UNIQUE,
  
  -- Price data
  price_primary DECIMAL(10,2),      -- From PDFs (highest confidence)
  price_secondary DECIMAL(10,2),    -- From articles
  price_tertiary DECIMAL(10,2),     -- From blogs
  price_final DECIMAL(10,2),        -- Weighted final price
  
  -- Confidence and sources
  confidence_score DECIMAL(3,2),    -- 0.60 to 0.99
  source_count INTEGER,             -- Number of sources
  primary_sources INTEGER DEFAULT 0,          -- Number of PDF sources
  secondary_sources INTEGER DEFAULT 0,        -- Number of article sources
  tertiary_sources INTEGER DEFAULT 0,         -- Number of blog sources
  
  -- Source details
  source_urls TEXT[],               -- All source URLs
  source_summary JSONB,             -- Source breakdown
  
  -- Market intelligence
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  regional_variations JSONB,
  seasonal_patterns JSONB,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  sources_last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pricing_data_enhanced ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read enhanced pricing" ON pricing_data_enhanced FOR SELECT USING (true);

-- Service role can modify
CREATE POLICY "Service manages enhanced pricing" ON pricing_data_enhanced FOR ALL USING (auth.role() = 'service_role');

-- Index for performance
CREATE INDEX idx_enhanced_pricing_item ON pricing_data_enhanced(item_description);
CREATE INDEX idx_enhanced_pricing_confidence ON pricing_data_enhanced(confidence_score);
CREATE INDEX idx_enhanced_pricing_updated ON pricing_data_enhanced(last_updated);