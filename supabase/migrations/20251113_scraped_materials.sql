-- Create table for storing scraped materials data
-- Supports BuildBuddy and other scraping sources

CREATE TABLE IF NOT EXISTS scraped_materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('brick', 'block', 'paving', 'electrical', 'plumbing', 'flooring', 'roofing', 'aggregate', 'waste', 'general')),
    price_per_unit DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL, -- 'per brick', 'per block', 'per m2', 'per item', etc.
    supplier TEXT NOT NULL,
    description TEXT,
    specifications JSONB, -- Flexible storage for product specs
    availability TEXT CHECK (availability IN ('in-stock', 'out-of-stock', 'limited', 'unknown')),
    delivery_info TEXT,
    source_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    vat_included BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_materials_category ON scraped_materials(category);
CREATE INDEX IF NOT EXISTS idx_scraped_materials_supplier ON scraped_materials(supplier);
CREATE INDEX IF NOT EXISTS idx_scraped_materials_price ON scraped_materials(price_per_unit);
CREATE INDEX IF NOT EXISTS idx_scraped_materials_scraped_at ON scraped_materials(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_materials_availability ON scraped_materials(availability);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scraped_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scraped_materials_updated_at
    BEFORE UPDATE ON scraped_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_scraped_materials_updated_at();

-- RLS policies (if using Row Level Security)
ALTER TABLE scraped_materials ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to scraped materials"
    ON scraped_materials FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role full access for scraping scripts
CREATE POLICY "Allow service role full access"
    ON scraped_materials FOR ALL
    TO service_role
    USING (true);

-- Create materialized view for pricing aggregation (optional optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS scraped_materials_summary AS
SELECT 
    category,
    supplier,
    COUNT(*) as product_count,
    AVG(price_per_unit) as avg_price,
    MIN(price_per_unit) as min_price,
    MAX(price_per_unit) as max_price,
    MAX(scraped_at) as last_updated
FROM scraped_materials
WHERE availability IN ('in-stock', 'limited')
GROUP BY category, supplier;

-- Index the materialized view
CREATE INDEX IF NOT EXISTS idx_scraped_materials_summary_category_supplier 
    ON scraped_materials_summary(category, supplier);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_scraped_materials_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW scraped_materials_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE scraped_materials IS 'Stores pricing data scraped from various UK building materials suppliers';
COMMENT ON COLUMN scraped_materials.specifications IS 'JSON storage for product specifications like size, strength, material, etc.';
COMMENT ON MATERIALIZED VIEW scraped_materials_summary IS 'Aggregated pricing data by category and supplier for fast queries';