#!/usr/bin/env npx tsx
/**
 * Test the pricing database functions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.staging' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testPricingFunctions() {
  console.log('🧪 Testing pricing database functions...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Test 1: Check all tables have data
    console.log('📊 Checking data counts...');

    const tables = ['materials_catalog', 'aggregates_catalog', 'waste_services', 'labour_rates'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Error counting ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    }

    console.log('\n🔍 Testing pricing functions...');

    // Test 2: Material price lookup
    console.log('\n📦 Testing material price lookup...');
    const { data: materialPrices, error: materialError } = await supabase.rpc(
      'get_best_material_price',
      {
        p_description: 'timber',
        p_quantity: 10,
      }
    );

    if (materialError) {
      console.error('❌ Material price lookup failed:', materialError.message);
    } else {
      console.log('✅ Material price results:', materialPrices);
    }

    // Test 3: Waste cost calculation
    console.log('\n🗑️ Testing waste cost calculation...');
    const { data: wasteCosts, error: wasteError } = await supabase.rpc('calculate_waste_cost', {
      p_skip_size: '6-yard',
      p_waste_type: 'general',
      p_days: 7,
    });

    if (wasteError) {
      console.error('❌ Waste cost calculation failed:', wasteError.message);
    } else {
      console.log('✅ Waste cost results:', wasteCosts);
    }

    // Test 4: Regional labour rates
    console.log('\n👷 Testing labour rate queries...');
    const { data: labourRates, error: labourError } = await supabase
      .from('labour_rates')
      .select('*')
      .eq('trade', 'bricklayer')
      .eq('region', 'London')
      .limit(3);

    if (labourError) {
      console.error('❌ Labour rate query failed:', labourError.message);
    } else {
      console.log('✅ London bricklayer rates:', labourRates);
    }

    // Test 5: Aggregate pricing
    console.log('\n🏗️ Testing aggregate pricing...');
    const { data: aggregates, error: aggregateError } = await supabase
      .from('aggregates_catalog')
      .select('material_name, price_per_tonne_loose, delivery_base_charge')
      .eq('material_type', 'sand');

    if (aggregateError) {
      console.error('❌ Aggregate query failed:', aggregateError.message);
    } else {
      console.log('✅ Sand pricing:', aggregates);
    }

    console.log('\n🎉 All pricing function tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testPricingFunctions().catch(console.error);
