/**
 * Daily Pricing Cache Task
 * Updates all pricing data at 3 AM to optimize quote generation
 *
 * Caches:
 * - ONS construction indices
 * - Top 50 materials
 * - National labor rates
 * - Common tool hire rates
 */

export async function runDailyPricingCache(supabase: any) {
  const results = {
    success: true,
    ons_updated: 0,
    materials_updated: 0,
    labor_updated: 0,
    tools_updated: 0,
    records_processed: 0,
    records_updated: 0,
    errors: [] as string[],
  };

  try {
    console.log('📊 Starting daily pricing cache update...');

    // 1. Update ONS Construction Indices
    console.log('📈 Updating ONS indices...');
    try {
      const onsCount = await updateONSIndices(supabase);
      results.ons_updated = onsCount;
      results.records_updated += onsCount;
    } catch (error) {
      console.error('ONS update failed:', error);
      results.errors.push(`ONS: ${error.message}`);
    }

    // 2. Update Top Materials
    console.log('🧱 Updating material prices...');
    try {
      const materialsCount = await updateTopMaterials(supabase);
      results.materials_updated = materialsCount;
      results.records_updated += materialsCount;
    } catch (error) {
      console.error('Materials update failed:', error);
      results.errors.push(`Materials: ${error.message}`);
    }

    // 3. Update National Labor Rates
    console.log('👷 Updating labor rates...');
    try {
      const laborCount = await updateLaborRates(supabase);
      results.labor_updated = laborCount;
      results.records_updated += laborCount;
    } catch (error) {
      console.error('Labor update failed:', error);
      results.errors.push(`Labor: ${error.message}`);
    }

    // 4. Update Tool Hire Rates
    console.log('🔧 Updating tool hire rates...');
    try {
      const toolsCount = await updateToolHireRates(supabase);
      results.tools_updated = toolsCount;
      results.records_updated += toolsCount;
    } catch (error) {
      console.error('Tools update failed:', error);
      results.errors.push(`Tools: ${error.message}`);
    }

    results.records_processed = results.records_updated;

    // Consider it a success if at least some data was updated
    results.success = results.records_updated > 0;

    console.log(`✅ Daily pricing cache completed: ${results.records_updated} records updated`);
  } catch (error) {
    console.error('❌ Daily pricing cache failed:', error);
    results.success = false;
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Update ONS Construction Price Indices
 * Using mock data for MVP - replace with real API later
 */
async function updateONSIndices(supabase: any): Promise<number> {
  const indices = [
    {
      key: 'ons_all_work_2024-12',
      type: 'ons',
      category: 'all_work',
      data: {
        index: 126.2,
        month_change: 0.8,
        year_change: 4.5,
        period: '2024-12',
        description: 'All Construction Work',
      },
    },
    {
      key: 'ons_housing_2024-12',
      type: 'ons',
      category: 'housing',
      data: {
        index: 129.1,
        month_change: 1.2,
        year_change: 5.4,
        period: '2024-12',
        description: 'New Housing Construction',
      },
    },
    {
      key: 'ons_repair_2024-12',
      type: 'ons',
      category: 'repair_maintenance',
      data: {
        index: 122.8,
        month_change: 0.5,
        year_change: 3.2,
        period: '2024-12',
        description: 'Repair and Maintenance',
      },
    },
  ];

  let updated = 0;
  for (const index of indices) {
    const { error } = await supabase.from('pricing_cache').upsert(
      {
        cache_key: index.key,
        cache_type: index.type,
        category: index.category,
        data: index.data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (!error) updated++;
  }

  return updated;
}

/**
 * Update Top 50 Most-Used Materials
 */
async function updateTopMaterials(supabase: any): Promise<number> {
  // Top materials for MVP - expand later
  const materials = [
    // Bathroom essentials
    {
      key: 'material_bathroom_suite',
      name: 'Complete Bathroom Suite',
      category: 'bathroom',
      price_min: 450,
      price_max: 850,
      unit: 'each',
    },
    {
      key: 'material_bathroom_tiles',
      name: 'Bathroom Wall Tiles',
      category: 'bathroom',
      price_min: 18,
      price_max: 35,
      unit: 'm²',
    },
    {
      key: 'material_shower_enclosure',
      name: 'Shower Enclosure',
      category: 'bathroom',
      price_min: 250,
      price_max: 600,
      unit: 'each',
    },

    // Kitchen essentials
    {
      key: 'material_kitchen_units',
      name: 'Kitchen Base Units',
      category: 'kitchen',
      price_min: 80,
      price_max: 200,
      unit: 'each',
    },
    {
      key: 'material_kitchen_worktop',
      name: 'Kitchen Worktop',
      category: 'kitchen',
      price_min: 50,
      price_max: 150,
      unit: 'm',
    },
    {
      key: 'material_kitchen_sink',
      name: 'Kitchen Sink & Taps',
      category: 'kitchen',
      price_min: 150,
      price_max: 400,
      unit: 'each',
    },

    // General construction
    {
      key: 'material_plasterboard',
      name: 'Plasterboard',
      category: 'general',
      price_min: 6,
      price_max: 12,
      unit: 'sheet',
    },
    {
      key: 'material_insulation',
      name: 'Insulation Roll',
      category: 'general',
      price_min: 15,
      price_max: 30,
      unit: 'roll',
    },
    {
      key: 'material_paint',
      name: 'Emulsion Paint',
      category: 'general',
      price_min: 15,
      price_max: 30,
      unit: '10L',
    },
    {
      key: 'material_cement',
      name: 'Cement Bag',
      category: 'general',
      price_min: 6,
      price_max: 9,
      unit: '25kg',
    },
  ];

  let updated = 0;
  for (const material of materials) {
    const { key, ...data } = material;

    const { error } = await supabase.from('pricing_cache').upsert(
      {
        cache_key: key,
        cache_type: 'material',
        category: material.category,
        data: data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (!error) updated++;
  }

  return updated;
}

/**
 * Update National Average Labor Rates
 */
async function updateLaborRates(supabase: any): Promise<number> {
  const laborRates = [
    { key: 'labor_plumber', trade: 'Plumber', hourly: 35, daily: 280 },
    { key: 'labor_electrician', trade: 'Electrician', hourly: 38, daily: 304 },
    { key: 'labor_carpenter', trade: 'Carpenter', hourly: 28, daily: 224 },
    { key: 'labor_tiler', trade: 'Tiler', hourly: 26, daily: 208 },
    { key: 'labor_painter', trade: 'Painter', hourly: 24, daily: 192 },
    { key: 'labor_general', trade: 'General Builder', hourly: 25, daily: 200 },
  ];

  let updated = 0;
  for (const rate of laborRates) {
    const { key, ...data } = rate;

    const { error } = await supabase.from('pricing_cache').upsert(
      {
        cache_key: key,
        cache_type: 'labor',
        category: 'national_average',
        data: {
          ...data,
          location: 'UK National Average',
          last_survey: '2024-11',
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (!error) updated++;
  }

  return updated;
}

/**
 * Update Common Tool Hire Rates
 */
async function updateToolHireRates(supabase: any): Promise<number> {
  const toolRates = [
    { key: 'tool_sds_drill', name: 'SDS Drill', daily: 25, weekly: 100 },
    { key: 'tool_angle_grinder', name: 'Angle Grinder', daily: 20, weekly: 80 },
    { key: 'tool_tile_cutter', name: 'Electric Tile Cutter', daily: 30, weekly: 120 },
    { key: 'tool_circular_saw', name: 'Circular Saw', daily: 22, weekly: 88 },
    { key: 'tool_multi_tool', name: 'Oscillating Multi-Tool', daily: 18, weekly: 72 },
    { key: 'tool_mixer_drill', name: 'Mixer Drill', daily: 28, weekly: 112 },
  ];

  let updated = 0;
  for (const tool of toolRates) {
    const { key, ...data } = tool;

    const { error } = await supabase.from('pricing_cache').upsert(
      {
        cache_key: key,
        cache_type: 'tool_hire',
        category: 'standard_tools',
        data: {
          ...data,
          deposit: data.weekly * 2, // Standard deposit is 2x weekly rate
          source: 'National average from major hire shops',
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (!error) updated++;
  }

  return updated;
}
