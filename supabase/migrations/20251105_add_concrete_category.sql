-- Add concrete category to materials_catalog
-- Required for concrete slab pricing integration

ALTER TABLE materials_catalog 
DROP CONSTRAINT IF EXISTS materials_catalog_category_check;

ALTER TABLE materials_catalog 
ADD CONSTRAINT materials_catalog_category_check 
CHECK (category IN (
  'timber', 'sheet-materials', 'insulation', 'plasterboard',
  'roofing', 'bricks-blocks', 'cement', 'fixings',
  'plumbing', 'electrical', 'paint', 'flooring', 'concrete'
));

-- Add concrete labour specialties to labour_rates table
INSERT INTO labour_rates (
  trade, task_description, hourly_rate, daily_rate, 
  rate_per_unit, unit_type, skill_level, region, pricing_notes
) VALUES 
  ('concrete-specialist', 'Concrete slab installation', 40, 320, 12, 'm2', 'specialist', 'UK Average', 'Includes prep, pour, and basic finish'),
  ('concrete-pumping', 'Concrete pump operation', 65, 520, 8, 'm2', 'specialist', 'UK Average', 'Specialist pump operator rates'),
  ('groundwork-prep', 'Site preparation for concrete', 35, 280, 8, 'm2', 'skilled', 'UK Average', 'Excavation and base preparation')
ON CONFLICT DO NOTHING;