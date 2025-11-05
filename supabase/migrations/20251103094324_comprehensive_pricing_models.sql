-- Comprehensive Pricing Models for AskToddy MVP
-- Covers all construction cost categories with proper relationships

-- ============================================
-- BUILDING MATERIALS
-- ============================================

CREATE TABLE IF NOT EXISTS materials_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Product identification
  sku TEXT,
  barcode TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'timber', 'sheet-materials', 'insulation', 'plasterboard',
    'roofing', 'bricks-blocks', 'cement', 'fixings',
    'plumbing', 'electrical', 'paint', 'flooring'
  )),
  subcategory TEXT,
  
  -- Specifications
  brand TEXT,
  dimensions TEXT,
  unit TEXT NOT NULL CHECK (unit IN (
    'each', 'pack', 'sheet', 'length', 'roll', 'bag', 'm2', 'm3', 'litre'
  )),
  pack_size INTEGER DEFAULT 1,
  weight_kg DECIMAL(10, 2),
  coverage TEXT,
  
  -- Pricing tiers
  retail_price DECIMAL(10, 2),
  trade_price DECIMAL(10, 2),
  contractor_price DECIMAL(10, 2),
  
  -- Bulk pricing
  bulk_breaks JSONB DEFAULT '[]', -- [{quantity: 10, price: 45.00}, {quantity: 50, price: 40.00}]
  
  -- Availability
  stock_status TEXT DEFAULT 'in-stock' CHECK (stock_status IN (
    'in-stock', 'low-stock', '3-5-days', 'order-only', 'discontinued'
  )),
  lead_time_days INTEGER,
  min_order_quantity INTEGER DEFAULT 1,
  
  -- Supplier info (anonymized)
  supplier_type TEXT CHECK (supplier_type IN ('national', 'regional', 'independent')),
  supplier_region TEXT,
  
  -- Metadata
  certifications JSONB, -- CE marking, FSC, etc.
  technical_specs JSONB,
  suitable_for TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ,
  
  -- Indexing
  UNIQUE(sku, supplier_type)
);

-- ============================================
-- AGGREGATES & BULK MATERIALS
-- ============================================

CREATE TABLE IF NOT EXISTS aggregates_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Material identification
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN (
    'sand', 'gravel', 'hardcore', 'topsoil', 'concrete',
    'crushed-stone', 'decorative', 'recycled'
  )),
  grade TEXT, -- MOT Type 1, Type 2, 20mm, 40mm, etc.
  
  -- Specifications
  particle_size TEXT,
  colour TEXT,
  density_kg_m3 DECIMAL(10, 2),
  moisture_content TEXT,
  
  -- Pricing options
  price_per_bag_25kg DECIMAL(10, 2),
  price_per_bulk_bag DECIMAL(10, 2), -- Usually 850kg
  price_per_tonne_loose DECIMAL(10, 2),
  
  -- Bulk discounts
  volume_discounts JSONB DEFAULT '[]', -- [{tonnes: 10, discount: 5}, {tonnes: 20, discount: 10}]
  
  -- Delivery pricing
  delivery_base_charge DECIMAL(10, 2),
  delivery_per_mile DECIMAL(10, 2),
  delivery_per_tonne DECIMAL(10, 2),
  max_delivery_distance INTEGER,
  min_order_tonnes DECIMAL(10, 2),
  
  -- Coverage calculations
  coverage_m2_at_50mm DECIMAL(10, 2),
  compaction_factor DECIMAL(3, 2) DEFAULT 1.3,
  
  -- Source info
  quarry_location TEXT,
  supplier_type TEXT CHECK (supplier_type IN ('quarry', 'merchant', 'specialist')),
  supplier_region TEXT,
  
  -- Quality/Compliance
  bs_standards TEXT[],
  suitable_for TEXT[], -- driveways, drainage, concrete-mix, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  seasonal_adjustment DECIMAL(3, 2) DEFAULT 1.0
);

-- ============================================
-- WASTE MANAGEMENT SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS waste_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Service identification
  service_type TEXT NOT NULL CHECK (service_type IN (
    'skip-hire', 'grab-hire', 'wait-load', 'muck-away',
    'hazardous', 'recycling', 'clearance'
  )),
  
  -- Skip specific
  skip_size TEXT CHECK (skip_size IN (
    '2-yard', '4-yard', '6-yard', '8-yard',
    '12-yard', '16-yard', '20-yard', '40-yard', 'ro-ro'
  )),
  capacity_tonnes DECIMAL(10, 2),
  dimensions_m TEXT,
  
  -- Pricing structure
  hire_period_days INTEGER DEFAULT 7,
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_day_extra DECIMAL(10, 2),
  
  -- Waste type pricing
  general_waste_included BOOLEAN DEFAULT true,
  soil_surcharge DECIMAL(10, 2),
  concrete_surcharge DECIMAL(10, 2),
  mixed_surcharge DECIMAL(10, 2),
  
  -- Environmental charges
  landfill_tax_per_tonne DECIMAL(10, 2) DEFAULT 98.60,
  environmental_permit DECIMAL(10, 2),
  
  -- Service details
  same_day_available BOOLEAN DEFAULT false,
  same_day_surcharge DECIMAL(10, 2),
  weekend_surcharge DECIMAL(10, 2),
  
  -- Permit requirements
  permit_required BOOLEAN DEFAULT false,
  permit_cost DECIMAL(10, 2),
  permit_duration_days INTEGER,
  
  -- Coverage
  coverage_radius_miles INTEGER,
  delivery_charge_per_mile DECIMAL(10, 2),
  supplier_region TEXT,
  
  -- Restrictions
  prohibited_waste TEXT[],
  weight_limit_tonnes DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LABOUR RATES
-- ============================================

CREATE TABLE IF NOT EXISTS labour_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Trade identification
  trade TEXT NOT NULL CHECK (trade IN (
    'groundworker', 'bricklayer', 'carpenter', 'electrician',
    'plumber', 'plasterer', 'painter', 'roofer', 'tiler',
    'joiner', 'labourer', 'scaffolder', 'glazier',
    'floor-layer', 'kitchen-fitter'
  )),
  
  -- Skill levels
  skill_level TEXT NOT NULL CHECK (skill_level IN (
    'apprentice', 'improver', 'qualified', 'experienced', 'specialist'
  )),
  years_experience INTEGER,
  
  -- Rate structure
  day_rate DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  overtime_rate DECIMAL(10, 2),
  saturday_rate DECIMAL(10, 2),
  sunday_rate DECIMAL(10, 2),
  
  -- Gang rates
  gang_size INTEGER,
  gang_day_rate DECIMAL(10, 2),
  
  -- Regional data
  region TEXT NOT NULL,
  urban_rural TEXT CHECK (urban_rural IN ('urban', 'suburban', 'rural')),
  
  -- Additional costs
  travel_time_charge BOOLEAN DEFAULT false,
  travel_radius_miles INTEGER DEFAULT 20,
  accommodation_required BOOLEAN DEFAULT false,
  
  -- Contract terms
  min_booking_days DECIMAL(3, 1) DEFAULT 1,
  cis_registered BOOLEAN DEFAULT true,
  self_employed BOOLEAN DEFAULT true,
  
  -- Insurance/Quals
  liability_insurance BOOLEAN DEFAULT true,
  trade_qualifications TEXT[],
  
  -- Source
  data_source TEXT CHECK (data_source IN (
    'industry-body', 'recruitment-agency', 'survey', 'forum'
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  market_adjustment DECIMAL(3, 2) DEFAULT 1.0
);

-- ============================================
-- SMALL TOOLS & EQUIPMENT
-- ============================================

CREATE TABLE IF NOT EXISTS tools_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tool identification
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'power-tools', 'hand-tools', 'access', 'safety',
    'measuring', 'cutting', 'mixing', 'lifting'
  )),
  brand TEXT,
  model TEXT,
  
  -- Specifications
  power_type TEXT CHECK (power_type IN (
    'electric-110v', 'electric-240v', 'battery', 'petrol', 'diesel', 'manual'
  )),
  power_rating TEXT,
  weight_kg DECIMAL(10, 2),
  
  -- Hire rates
  hire_rate_daily DECIMAL(10, 2),
  hire_rate_weekly DECIMAL(10, 2),
  hire_rate_monthly DECIMAL(10, 2),
  
  -- Damage waiver
  damage_waiver_daily DECIMAL(10, 2),
  excess_charge DECIMAL(10, 2),
  
  -- Consumables
  consumables_required TEXT[],
  consumables_cost_daily DECIMAL(10, 2),
  
  -- Availability
  requires_training BOOLEAN DEFAULT false,
  operator_required BOOLEAN DEFAULT false,
  
  -- Delivery
  collection_only BOOLEAN DEFAULT false,
  delivery_charge DECIMAL(10, 2),
  
  -- Supplier info
  supplier_type TEXT CHECK (supplier_type IN ('national', 'regional', 'local')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPECIALIST SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS specialist_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Service identification
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN (
    'scaffolding', 'crane-hire', 'surveying', 'engineering',
    'testing', 'design', 'consultation', 'certification'
  )),
  
  -- Pricing structure
  pricing_unit TEXT NOT NULL CHECK (pricing_unit IN (
    'per-m2', 'per-m3', 'per-day', 'per-week', 'per-project',
    'per-hour', 'fixed-fee', 'per-lift', 'per-visit'
  )),
  base_rate DECIMAL(10, 2) NOT NULL,
  
  -- Scaffolding specific
  scaffold_type TEXT,
  lift_height_m DECIMAL(10, 2),
  platform_levels INTEGER,
  
  -- Crane specific
  crane_capacity_tonnes DECIMAL(10, 2),
  reach_m DECIMAL(10, 2),
  operator_included BOOLEAN,
  
  -- Professional services
  qualification_level TEXT,
  insurance_level_gbp DECIMAL(12, 2),
  turnaround_days INTEGER,
  
  -- Additional charges
  setup_charge DECIMAL(10, 2),
  callout_charge DECIMAL(10, 2),
  emergency_surcharge DECIMAL(10, 2),
  
  -- Coverage
  service_area TEXT,
  travel_charge_per_mile DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REGIONAL PRICING ADJUSTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS regional_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  region TEXT NOT NULL,
  postcode_prefix TEXT[],
  
  -- Adjustment multipliers by category
  materials_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  labour_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  plant_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  waste_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Market factors
  competition_level TEXT CHECK (competition_level IN ('high', 'medium', 'low')),
  demand_level TEXT CHECK (demand_level IN ('high', 'medium', 'low')),
  
  -- Transport factors
  average_delivery_surcharge DECIMAL(10, 2),
  fuel_adjustment DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(region)
);

-- ============================================
-- PRICE LIST DOCUMENTS (for tracking PDF processing)
-- ============================================

CREATE TABLE IF NOT EXISTS price_list_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Document information
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('text-based', 'catalog-style')),
  supplier_name TEXT NOT NULL,
  supplier_type TEXT,
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  items_extracted INTEGER DEFAULT 0,
  processing_errors JSONB,
  
  -- Metadata
  document_date DATE,
  valid_until DATE,
  region TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(file_path)
);

-- ============================================
-- SEASONAL ADJUSTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS seasonal_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Category adjustments
  materials_adjustment DECIMAL(3, 2) DEFAULT 1.0,
  labour_adjustment DECIMAL(3, 2) DEFAULT 1.0,
  plant_adjustment DECIMAL(3, 2) DEFAULT 1.0,
  waste_adjustment DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Specific adjustments
  concrete_weather_charge DECIMAL(10, 2),
  winter_working_surcharge DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Notes
  typical_weather TEXT,
  demand_notes TEXT,
  
  UNIQUE(month)
);

-- ============================================
-- PACKAGE DEALS & BUNDLES
-- ============================================

CREATE TABLE IF NOT EXISTS package_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  package_name TEXT NOT NULL,
  package_type TEXT CHECK (package_type IN (
    'new-build', 'extension', 'renovation', 'bathroom', 'kitchen'
  )),
  
  -- Package contents (references to other tables)
  included_materials JSONB, -- [{material_id, quantity}]
  included_equipment JSONB, -- [{equipment_id, days}]
  included_labour JSONB,    -- [{trade, days}]
  included_waste JSONB,     -- [{service_id, quantity}]
  
  -- Pricing
  total_rrp DECIMAL(12, 2),
  package_price DECIMAL(12, 2),
  savings_amount DECIMAL(12, 2),
  savings_percent DECIMAL(5, 2),
  
  -- Validity
  valid_from DATE,
  valid_until DATE,
  
  -- Conditions
  min_project_value DECIMAL(12, 2),
  geographic_restrictions TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Materials
CREATE INDEX idx_materials_category ON materials_catalog(category);
CREATE INDEX idx_materials_description ON materials_catalog USING gin(to_tsvector('english', description));
CREATE INDEX idx_materials_sku ON materials_catalog(sku);
CREATE INDEX idx_materials_price ON materials_catalog(trade_price);

-- Aggregates
CREATE INDEX idx_aggregates_type ON aggregates_catalog(material_type);
CREATE INDEX idx_aggregates_grade ON aggregates_catalog(grade);

-- Waste
CREATE INDEX idx_waste_service ON waste_services(service_type);
CREATE INDEX idx_waste_skip_size ON waste_services(skip_size);

-- Labour
CREATE INDEX idx_labour_trade ON labour_rates(trade);
CREATE INDEX idx_labour_region ON labour_rates(region);
CREATE INDEX idx_labour_skill ON labour_rates(skill_level);

-- Tools
CREATE INDEX idx_tools_category ON tools_equipment(category);
CREATE INDEX idx_tools_name ON tools_equipment USING gin(to_tsvector('english', tool_name));

-- Regional
CREATE INDEX idx_regional_region ON regional_adjustments(region);

-- ============================================
-- FUNCTIONS FOR PRICING CALCULATIONS
-- ============================================

-- Function to get best price for a material
CREATE OR REPLACE FUNCTION get_best_material_price(
  p_description TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
  description TEXT,
  unit TEXT,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  supplier_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH price_options AS (
    SELECT 
      m.description,
      m.unit,
      CASE 
        WHEN p_quantity >= 100 AND m.bulk_breaks IS NOT NULL THEN
          (SELECT MIN((b->>'price')::DECIMAL)
           FROM jsonb_array_elements(m.bulk_breaks) b
           WHERE (b->>'quantity')::INTEGER <= p_quantity)
        WHEN p_quantity >= 10 THEN m.contractor_price
        ELSE m.trade_price
      END as effective_price,
      m.supplier_type
    FROM materials_catalog m
    WHERE m.description ILIKE '%' || p_description || '%'
      AND m.stock_status IN ('in-stock', 'low-stock', '3-5-days')
  )
  SELECT 
    po.description,
    po.unit,
    po.effective_price as unit_price,
    po.effective_price * p_quantity as total_price,
    po.supplier_type
  FROM price_options po
  WHERE po.effective_price IS NOT NULL
  ORDER BY po.effective_price ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate waste management cost
CREATE OR REPLACE FUNCTION calculate_waste_cost(
  p_skip_size TEXT,
  p_waste_type TEXT DEFAULT 'general',
  p_days INTEGER DEFAULT 7,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  service TEXT,
  base_cost DECIMAL(10, 2),
  surcharges DECIMAL(10, 2),
  permit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.service_type || ' - ' || ws.skip_size as service,
    ws.base_price + GREATEST(0, (p_days - ws.hire_period_days) * ws.price_per_day_extra) as base_cost,
    CASE p_waste_type
      WHEN 'soil' THEN COALESCE(ws.soil_surcharge, 0)
      WHEN 'concrete' THEN COALESCE(ws.concrete_surcharge, 0)
      WHEN 'mixed' THEN COALESCE(ws.mixed_surcharge, 0)
      ELSE 0
    END as surcharges,
    CASE WHEN ws.permit_required THEN COALESCE(ws.permit_cost, 0) ELSE 0 END as permit_cost,
    ws.base_price + 
    GREATEST(0, (p_days - ws.hire_period_days) * ws.price_per_day_extra) +
    CASE p_waste_type
      WHEN 'soil' THEN COALESCE(ws.soil_surcharge, 0)
      WHEN 'concrete' THEN COALESCE(ws.concrete_surcharge, 0)
      WHEN 'mixed' THEN COALESCE(ws.mixed_surcharge, 0)
      ELSE 0
    END +
    CASE WHEN ws.permit_required THEN COALESCE(ws.permit_cost, 0) ELSE 0 END as total_cost
  FROM waste_services ws
  WHERE ws.skip_size = p_skip_size
    AND (p_location IS NULL OR ws.supplier_region ILIKE '%' || p_location || '%')
  ORDER BY total_cost ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE materials_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregates_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for pricing data
CREATE POLICY "Public read materials" ON materials_catalog FOR SELECT USING (true);
CREATE POLICY "Public read aggregates" ON aggregates_catalog FOR SELECT USING (true);
CREATE POLICY "Public read waste" ON waste_services FOR SELECT USING (true);
CREATE POLICY "Public read labour" ON labour_rates FOR SELECT USING (true);
CREATE POLICY "Public read tools" ON tools_equipment FOR SELECT USING (true);
CREATE POLICY "Public read specialist" ON specialist_services FOR SELECT USING (true);
CREATE POLICY "Public read regional" ON regional_adjustments FOR SELECT USING (true);
CREATE POLICY "Public read seasonal" ON seasonal_adjustments FOR SELECT USING (true);
CREATE POLICY "Public read packages" ON package_deals FOR SELECT USING (true);
CREATE POLICY "Public read documents" ON price_list_documents FOR SELECT USING (true);

-- Service role can modify all data
CREATE POLICY "Service manages materials" ON materials_catalog FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages aggregates" ON aggregates_catalog FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages waste" ON waste_services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages labour" ON labour_rates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages tools" ON tools_equipment FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages specialist" ON specialist_services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages regional" ON regional_adjustments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages seasonal" ON seasonal_adjustments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages packages" ON package_deals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages documents" ON price_list_documents FOR ALL USING (auth.role() = 'service_role');