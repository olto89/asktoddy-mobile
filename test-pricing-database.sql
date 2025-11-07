-- Test the comprehensive pricing database
-- Run this to verify the schema is working

-- Check all tables exist
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'materials_catalog',
    'aggregates_catalog', 
    'waste_services',
    'labour_rates',
    'tools_equipment',
    'specialist_services',
    'regional_adjustments',
    'seasonal_adjustments',
    'package_deals'
  )
ORDER BY tablename;

-- Test material price function
SELECT * FROM get_best_material_price('timber', 10);

-- Test waste cost function  
SELECT * FROM calculate_waste_cost('6-yard', 'general', 7);

-- Check indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename LIKE '%catalog%'
ORDER BY tablename, indexname;