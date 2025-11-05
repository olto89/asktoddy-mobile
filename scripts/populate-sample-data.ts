#!/usr/bin/env npx tsx
/**
 * Simple script to populate sample pricing data
 * Usage: npm run pricing:populate
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.staging' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function populateDatabase() {
  console.log('🚀 Starting sample data population...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Sample materials
  const materials = [
    {
      description: 'Plasterboard 12.5mm Standard',
      category: 'plasterboard',
      unit: 'sheet',
      trade_price: 8.5,
      contractor_price: 7.2,
      bulk_breaks: JSON.stringify([
        { quantity: 50, price: 6.8 },
        { quantity: 100, price: 6.2 },
      ]),
      stock_status: 'in-stock',
      supplier_type: 'national',
      supplier_region: 'UK',
    },
    {
      description: 'C24 Timber 47x200mm 4.8m',
      category: 'timber',
      unit: 'length',
      trade_price: 18.9,
      contractor_price: 16.5,
      stock_status: 'in-stock',
      supplier_type: 'regional',
      supplier_region: 'Southeast',
    },
    {
      description: 'Kingspan Insulation 100mm',
      category: 'insulation',
      unit: 'pack',
      trade_price: 45.2,
      contractor_price: 38.9,
      stock_status: 'in-stock',
      supplier_type: 'national',
      supplier_region: 'UK',
    },
  ];

  // Sample aggregates
  const aggregates = [
    {
      material_name: 'Sharp Sand',
      material_type: 'sand',
      grade: 'Concreting',
      price_per_bag_25kg: 4.5,
      price_per_bulk_bag: 85.0,
      price_per_tonne_loose: 28.5,
      delivery_base_charge: 45.0,
      delivery_per_mile: 2.5,
      coverage_m2_at_50mm: 20,
      supplier_type: 'quarry',
      supplier_region: 'Midlands',
    },
    {
      material_name: 'MOT Type 1',
      material_type: 'hardcore',
      grade: 'Type 1',
      price_per_bulk_bag: 95.0,
      price_per_tonne_loose: 22.0,
      delivery_base_charge: 45.0,
      delivery_per_mile: 2.5,
      coverage_m2_at_50mm: 18,
      supplier_type: 'quarry',
      supplier_region: 'Midlands',
    },
  ];

  // Sample waste services
  const wasteServices = [
    {
      service_type: 'skip-hire',
      skip_size: '6-yard',
      capacity_tonnes: 2.5,
      hire_period_days: 7,
      base_price: 180.0,
      price_per_day_extra: 15.0,
      soil_surcharge: 25.0,
      concrete_surcharge: 45.0,
      landfill_tax_per_tonne: 98.6,
      coverage_radius_miles: 25,
      supplier_region: 'National',
    },
    {
      service_type: 'skip-hire',
      skip_size: '8-yard',
      capacity_tonnes: 3.5,
      hire_period_days: 7,
      base_price: 220.0,
      price_per_day_extra: 18.0,
      soil_surcharge: 35.0,
      concrete_surcharge: 55.0,
      landfill_tax_per_tonne: 98.6,
      coverage_radius_miles: 25,
      supplier_region: 'National',
    },
  ];

  // Sample labour rates
  const labourRates = [];
  const regions = ['London', 'Birmingham', 'Manchester', 'Bristol', 'Newcastle'];
  const trades = ['bricklayer', 'carpenter', 'electrician', 'plumber', 'plasterer'];
  const skillLevels = ['qualified', 'experienced', 'specialist'];

  regions.forEach(region => {
    const regionMultiplier = region === 'London' ? 1.35 : region === 'Birmingham' ? 1.05 : 0.95;

    trades.forEach(trade => {
      skillLevels.forEach(skill => {
        const baseRate = skill === 'specialist' ? 280 : skill === 'experienced' ? 220 : 180;

        labourRates.push({
          trade,
          skill_level: skill,
          day_rate: Math.round(baseRate * regionMultiplier),
          hourly_rate: Math.round((baseRate * regionMultiplier) / 8),
          overtime_rate: Math.round(((baseRate * regionMultiplier) / 8) * 1.5),
          region,
          urban_rural: region === 'London' ? 'urban' : 'suburban',
          data_source: 'industry-body',
        });
      });
    });
  });

  try {
    // Insert materials
    console.log('📦 Inserting materials...');
    const { data: materialData, error: materialError } = await supabase
      .from('materials_catalog')
      .insert(materials);

    if (materialError) {
      console.error('❌ Materials error:', materialError.message);
    } else {
      console.log(`✅ Inserted ${materials.length} materials`);
    }

    // Insert aggregates
    console.log('🏗️ Inserting aggregates...');
    const { data: aggregateData, error: aggregateError } = await supabase
      .from('aggregates_catalog')
      .upsert(aggregates);

    if (aggregateError) {
      console.error('❌ Aggregates error:', aggregateError.message);
    } else {
      console.log(`✅ Inserted ${aggregates.length} aggregates`);
    }

    // Insert waste services
    console.log('🗑️ Inserting waste services...');
    const { data: wasteData, error: wasteError } = await supabase
      .from('waste_services')
      .upsert(wasteServices);

    if (wasteError) {
      console.error('❌ Waste services error:', wasteError.message);
    } else {
      console.log(`✅ Inserted ${wasteServices.length} waste services`);
    }

    // Insert labour rates
    console.log('👷 Inserting labour rates...');
    const { data: labourData, error: labourError } = await supabase
      .from('labour_rates')
      .upsert(labourRates);

    if (labourError) {
      console.error('❌ Labour rates error:', labourError.message);
    } else {
      console.log(`✅ Inserted ${labourRates.length} labour rates`);
    }

    console.log('\n🎉 Sample data population complete!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
populateDatabase().catch(console.error);
