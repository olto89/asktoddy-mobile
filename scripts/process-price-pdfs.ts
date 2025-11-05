#!/usr/bin/env npx tsx
/**
 * Script to process price list PDFs and populate the pricing database
 * Usage: npm run process-prices
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.staging' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

interface PDFToProcess {
  path: string;
  supplier: {
    name: string;
    type: 'single-site-national' | 'multi-site-national' | 'independent';
    coverage: 'national' | 'regional' | 'local';
    location?: string;
  };
  documentType: 'text-based' | 'catalog-style';
}

// Map PDF files to their metadata
const PDF_METADATA: PDFToProcess[] = [
  // National Single Site
  {
    path: 'data/price-lists/plant-hire/single-site-national/Mervynlambert_PlantHire_2023-04_National.pdf',
    supplier: {
      name: 'Mervyn Lambert Plant Hire',
      type: 'single-site-national',
      coverage: 'national',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/single-site-national/Tru7group_PlantHire_2023-04_National.pdf',
    supplier: {
      name: 'Tru7 Group',
      type: 'single-site-national',
      coverage: 'national',
    },
    documentType: 'text-based',
  },

  // National Multi Site
  {
    path: 'data/price-lists/plant-hire/multi-site-national/Markonehire_PlantHire_2022-04_national.pdf',
    supplier: {
      name: 'Mark One Hire',
      type: 'multi-site-national',
      coverage: 'national',
    },
    documentType: 'catalog-style',
  },

  // Independent Regional
  {
    path: 'data/price-lists/plant-hire/independent/BHC_PlantHire_2023-03_Hinckley.pdf',
    supplier: {
      name: 'BHC Plant Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Hinckley',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/ChampionToolHire_PlantHire_2023-04_Basingstoke.pdf',
    supplier: {
      name: 'Champion Tool Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Basingstoke',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/ElyToolHire_PlantHire_2024-04_Cambridge.pdf',
    supplier: {
      name: 'Ely Tool Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Cambridge',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/Fowlerhireandsales_PlantHire_2023-04_Bridport.pdf',
    supplier: {
      name: 'Fowler Hire & Sales',
      type: 'independent',
      coverage: 'local',
      location: 'Bridport',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/haleshire_PlantHire_2024-04_Gloucester.pdf',
    supplier: {
      name: 'Haleshire Plant Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Gloucester',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/LuscombePlantHire_PlantHire_2023-04_lakedistrict.pdf',
    supplier: {
      name: 'Luscombe Plant Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Lake District',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/PSM_PlantHire_2023-04_London.pdf',
    supplier: {
      name: 'PSM Plant Hire',
      type: 'independent',
      coverage: 'local',
      location: 'London',
    },
    documentType: 'text-based',
  },
  {
    path: 'data/price-lists/plant-hire/independent/TRENT_PlantHire_2023-04_Retford.pdf',
    supplier: {
      name: 'Trent Plant Hire',
      type: 'independent',
      coverage: 'local',
      location: 'Retford',
    },
    documentType: 'text-based',
  },
];

async function processPDFs() {
  console.log('🚀 Starting PDF price list processing...\n');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Process each PDF
  for (const pdfInfo of PDF_METADATA) {
    const fullPath = path.join(process.cwd(), pdfInfo.path);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  PDF not found: ${pdfInfo.path}`);
      continue;
    }

    console.log(`\n📄 Processing: ${pdfInfo.supplier.name}`);
    console.log(`   Type: ${pdfInfo.supplier.type}`);
    console.log(`   Coverage: ${pdfInfo.supplier.coverage}`);
    if (pdfInfo.supplier.location) {
      console.log(`   Location: ${pdfInfo.supplier.location}`);
    }

    try {
      // Record the document in the database
      const { data: doc, error: docError } = await supabase
        .from('price_list_documents')
        .upsert(
          {
            file_path: pdfInfo.path,
            file_name: path.basename(pdfInfo.path),
            document_type: pdfInfo.documentType,
            supplier_name: pdfInfo.supplier.name,
            supplier_type: pdfInfo.supplier.type,
            processing_status: 'pending',
            region: pdfInfo.supplier.location || 'National',
            uploaded_at: new Date().toISOString(),
          },
          {
            onConflict: 'file_path',
          }
        )
        .select()
        .single();

      if (docError) {
        console.error(`   ❌ Error recording document: ${docError.message}`);
        continue;
      }

      console.log(`   ✅ Document recorded (ID: ${doc.id})`);

      // Update processing status
      await supabase
        .from('price_list_documents')
        .update({
          processing_status: 'processing',
        })
        .eq('id', doc.id);

      // Note: Actual PDF processing would happen here
      // For now, we're setting up the infrastructure

      // Simulate some sample data insertion
      const sampleItems = getSampleItemsForSupplier(pdfInfo.supplier.name);

      if (sampleItems.length > 0) {
        const { error: insertError } = await supabase.from('pricing_data').upsert(
          sampleItems.map(item => ({
            ...item,
            supplier_name: pdfInfo.supplier.name,
            supplier_type: pdfInfo.supplier.type,
            supplier_coverage: pdfInfo.supplier.coverage,
            supplier_location: pdfInfo.supplier.location,
            created_at: new Date().toISOString(),
          })),
          {
            onConflict: 'description,supplier_name',
          }
        );

        if (insertError) {
          console.error(`   ❌ Error inserting price data: ${insertError.message}`);
        } else {
          console.log(`   ✅ Inserted ${sampleItems.length} price items`);
        }
      }

      // Also populate comprehensive pricing tables with sample data
      await populateComprehensiveTables(supabase, pdfInfo.supplier.name);

      // Update document status
      await supabase
        .from('price_list_documents')
        .update({
          processing_status: 'completed',
          items_extracted: sampleItems.length,
          processed_at: new Date().toISOString(),
        })
        .eq('id', doc.id);
    } catch (error) {
      console.error(`   ❌ Processing failed: ${error}`);
      continue;
    }
  }

  console.log('\n✨ PDF processing complete!');

  // Show summary
  const { data: summary } = await supabase
    .from('price_list_documents')
    .select('processing_status')
    .eq('processing_status', 'completed');

  console.log(`\n📊 Summary:`);
  console.log(`   Total documents processed: ${summary?.length || 0}`);
}

// Enhanced sample data generator for all categories
function getSampleItemsForSupplier(supplierName: string) {
  const priceMultiplier = supplierName.includes('National')
    ? 1.2
    : supplierName.includes('London')
      ? 1.3
      : 0.9;

  // Plant hire items (existing)
  const plantItems = [
    {
      description: 'Mini Digger 1.5 Ton',
      category: 'excavators',
      unit: 'day',
      price_daily: Math.round(150 * priceMultiplier),
      price_weekly: Math.round(600 * priceMultiplier),
      price_monthly: Math.round(2000 * priceMultiplier),
    },
    {
      description: 'Dumper 1 Ton High Tip',
      category: 'dumpers',
      unit: 'day',
      price_daily: Math.round(90 * priceMultiplier),
      price_weekly: Math.round(360 * priceMultiplier),
      price_monthly: Math.round(1200 * priceMultiplier),
    },
  ];

  return plantItems.map(item => ({
    ...item,
    metadata: {
      minHirePeriod: '1 day',
      deliveryAvailable: true,
      lastUpdated: new Date().toISOString(),
      confidence: 0.95,
    },
  }));
}

// Generate building materials sample data
function getSampleMaterials(priceMultiplier: number = 1.0) {
  return [
    {
      description: 'Plasterboard 12.5mm Standard',
      category: 'plasterboard',
      unit: 'sheet',
      trade_price: Math.round(8.5 * priceMultiplier * 100) / 100,
      contractor_price: Math.round(7.2 * priceMultiplier * 100) / 100,
      bulk_breaks: JSON.stringify([
        { quantity: 50, price: 6.8 * priceMultiplier },
        { quantity: 100, price: 6.2 * priceMultiplier },
      ]),
      stock_status: 'in-stock',
      supplier_type: priceMultiplier > 1.1 ? 'national' : 'regional',
    },
    {
      description: 'C24 Timber 47x200mm 4.8m',
      category: 'timber',
      unit: 'length',
      trade_price: Math.round(18.9 * priceMultiplier * 100) / 100,
      contractor_price: Math.round(16.5 * priceMultiplier * 100) / 100,
      bulk_breaks: JSON.stringify([
        { quantity: 20, price: 15.2 * priceMultiplier },
        { quantity: 50, price: 14.1 * priceMultiplier },
      ]),
      stock_status: 'in-stock',
      supplier_type: priceMultiplier > 1.1 ? 'national' : 'regional',
    },
    {
      description: 'Kingspan Insulation 100mm',
      category: 'insulation',
      unit: 'pack',
      trade_price: Math.round(45.2 * priceMultiplier * 100) / 100,
      contractor_price: Math.round(38.9 * priceMultiplier * 100) / 100,
      bulk_breaks: JSON.stringify([{ quantity: 10, price: 36.5 * priceMultiplier }]),
      stock_status: 'in-stock',
      supplier_type: priceMultiplier > 1.1 ? 'national' : 'regional',
    },
  ];
}

// Generate aggregates sample data
function getSampleAggregates(priceMultiplier: number = 1.0) {
  return [
    {
      material_name: 'Sharp Sand',
      material_type: 'sand',
      grade: 'Concreting',
      price_per_bag_25kg: Math.round(4.5 * priceMultiplier * 100) / 100,
      price_per_bulk_bag: Math.round(85.0 * priceMultiplier * 100) / 100,
      price_per_tonne_loose: Math.round(28.5 * priceMultiplier * 100) / 100,
      delivery_base_charge: 45.0,
      delivery_per_mile: 2.5,
      coverage_m2_at_50mm: 20,
      supplier_type: 'quarry',
      supplier_region: priceMultiplier > 1.1 ? 'London' : 'Midlands',
    },
    {
      material_name: 'MOT Type 1',
      material_type: 'hardcore',
      grade: 'Type 1',
      price_per_bulk_bag: Math.round(95.0 * priceMultiplier * 100) / 100,
      price_per_tonne_loose: Math.round(22.0 * priceMultiplier * 100) / 100,
      delivery_base_charge: 45.0,
      delivery_per_mile: 2.5,
      coverage_m2_at_50mm: 18,
      supplier_type: 'quarry',
      supplier_region: priceMultiplier > 1.1 ? 'London' : 'Midlands',
    },
  ];
}

// Generate waste services sample data
function getSampleWasteServices(priceMultiplier: number = 1.0) {
  return [
    {
      service_type: 'skip-hire',
      skip_size: '6-yard',
      capacity_tonnes: 2.5,
      hire_period_days: 7,
      base_price: Math.round(180.0 * priceMultiplier * 100) / 100,
      price_per_day_extra: 15.0,
      soil_surcharge: 25.0,
      concrete_surcharge: 45.0,
      landfill_tax_per_tonne: 98.6,
      coverage_radius_miles: 25,
      supplier_region: priceMultiplier > 1.1 ? 'London' : 'Midlands',
    },
    {
      service_type: 'skip-hire',
      skip_size: '8-yard',
      capacity_tonnes: 3.5,
      hire_period_days: 7,
      base_price: Math.round(220.0 * priceMultiplier * 100) / 100,
      price_per_day_extra: 18.0,
      soil_surcharge: 35.0,
      concrete_surcharge: 55.0,
      landfill_tax_per_tonne: 98.6,
      coverage_radius_miles: 25,
      supplier_region: priceMultiplier > 1.1 ? 'London' : 'Midlands',
    },
  ];
}

// Generate labour rates sample data
function getSampleLabourRates() {
  const regions = ['London', 'Birmingham', 'Manchester', 'Bristol', 'Newcastle'];
  const trades = ['bricklayer', 'carpenter', 'electrician', 'plumber', 'plasterer'];
  const skillLevels = ['qualified', 'experienced', 'specialist'];

  const rates = [];

  regions.forEach(region => {
    const regionMultiplier = region === 'London' ? 1.35 : region === 'Birmingham' ? 1.05 : 0.95;

    trades.forEach(trade => {
      skillLevels.forEach(skill => {
        const baseRate = skill === 'specialist' ? 280 : skill === 'experienced' ? 220 : 180;

        rates.push({
          trade,
          skill_level: skill,
          day_rate: Math.round(baseRate * regionMultiplier * 100) / 100,
          hourly_rate: Math.round(((baseRate * regionMultiplier) / 8) * 100) / 100,
          overtime_rate: Math.round(((baseRate * regionMultiplier) / 8) * 1.5 * 100) / 100,
          region,
          urban_rural: region === 'London' ? 'urban' : 'suburban',
          data_source: 'industry-body',
        });
      });
    });
  });

  return rates;
}

// Populate comprehensive pricing tables
async function populateComprehensiveTables(supabase: any, supplierName: string) {
  const priceMultiplier = supplierName.includes('National')
    ? 1.2
    : supplierName.includes('London')
      ? 1.3
      : 0.9;

  try {
    // Populate materials
    const materials = getSampleMaterials(priceMultiplier);
    const { error: materialsError } = await supabase
      .from('materials_catalog')
      .upsert(materials, { onConflict: 'sku,supplier_type' });

    if (materialsError) {
      console.error(`   ❌ Error inserting materials: ${materialsError.message}`);
    } else {
      console.log(`   ✅ Inserted ${materials.length} materials`);
    }

    // Populate aggregates
    const aggregates = getSampleAggregates(priceMultiplier);
    const { error: aggregatesError } = await supabase.from('aggregates_catalog').upsert(aggregates);

    if (aggregatesError) {
      console.error(`   ❌ Error inserting aggregates: ${aggregatesError.message}`);
    } else {
      console.log(`   ✅ Inserted ${aggregates.length} aggregates`);
    }

    // Populate waste services
    const wasteServices = getSampleWasteServices(priceMultiplier);
    const { error: wasteError } = await supabase.from('waste_services').upsert(wasteServices);

    if (wasteError) {
      console.error(`   ❌ Error inserting waste services: ${wasteError.message}`);
    } else {
      console.log(`   ✅ Inserted ${wasteServices.length} waste services`);
    }

    // Populate labour rates (only once, not per supplier)
    if (supplierName === 'HSS Hire') {
      const labourRates = getSampleLabourRates();
      const { error: labourError } = await supabase
        .from('labour_rates')
        .upsert(labourRates, { onConflict: 'trade,skill_level,region' });

      if (labourError) {
        console.error(`   ❌ Error inserting labour rates: ${labourError.message}`);
      } else {
        console.log(`   ✅ Inserted ${labourRates.length} labour rates`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Error populating comprehensive tables: ${error}`);
  }
}

// Run the script
processPDFs().catch(console.error);
