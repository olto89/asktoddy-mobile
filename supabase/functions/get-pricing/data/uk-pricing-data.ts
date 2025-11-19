/**
 * UK Construction Pricing Data - 2024 Market Averages
 * Based on realistic market research from multiple sources
 * TO BE ENHANCED: With real API partnerships when available
 */

import {
  ToolHireRate,
  MaterialPrice,
  AggregateRate,
  LabourRate,
  RegionData,
  SeasonalFactors,
  ContingencyFactors,
} from '../types.ts';

// Import national hire rates and Toddy Tool Hire rates
import { NATIONAL_HIRE_RATES } from './national-hire-rates.ts';
import { TODDY_TOOL_HIRE_RATES } from './toddy-tool-hire-rates.ts';

/**
 * UK Regional Pricing Multipliers
 * Based on ONS regional price variations and industry research
 */
export const UK_REGIONS: RegionData[] = [
  {
    name: 'London',
    multiplier: 1.35,
    majorCities: ['London', 'Westminster', 'Camden', 'Islington'],
    averageDeliveryCharge: 85,
    labourAvailability: 'medium',
  },
  {
    name: 'South East',
    multiplier: 1.25,
    majorCities: ['Brighton', 'Canterbury', 'Oxford', 'Reading', 'Guildford'],
    averageDeliveryCharge: 65,
    labourAvailability: 'medium',
  },
  {
    name: 'South West',
    multiplier: 1.1,
    majorCities: ['Bristol', 'Bath', 'Plymouth', 'Exeter', 'Bournemouth'],
    averageDeliveryCharge: 55,
    labourAvailability: 'high',
  },
  {
    name: 'East of England',
    multiplier: 1.15,
    majorCities: ['Cambridge', 'Norwich', 'Ipswich', 'Luton'],
    averageDeliveryCharge: 50,
    labourAvailability: 'medium',
  },
  {
    name: 'West Midlands',
    multiplier: 1.05,
    majorCities: ['Birmingham', 'Coventry', 'Wolverhampton', 'Stoke'],
    averageDeliveryCharge: 45,
    labourAvailability: 'high',
  },
  {
    name: 'East Midlands',
    multiplier: 1.0,
    majorCities: ['Nottingham', 'Leicester', 'Derby', 'Lincoln'],
    averageDeliveryCharge: 40,
    labourAvailability: 'high',
  },
  {
    name: 'Yorkshire',
    multiplier: 0.95,
    majorCities: ['Leeds', 'Sheffield', 'Bradford', 'York', 'Hull'],
    averageDeliveryCharge: 40,
    labourAvailability: 'high',
  },
  {
    name: 'North West',
    multiplier: 1.0,
    majorCities: ['Manchester', 'Liverpool', 'Preston', 'Blackpool'],
    averageDeliveryCharge: 45,
    labourAvailability: 'high',
  },
  {
    name: 'North East',
    multiplier: 0.9,
    majorCities: ['Newcastle', 'Sunderland', 'Middlesbrough', 'Durham'],
    averageDeliveryCharge: 35,
    labourAvailability: 'high',
  },
  {
    name: 'Wales',
    multiplier: 0.95,
    majorCities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham'],
    averageDeliveryCharge: 50,
    labourAvailability: 'medium',
  },
  {
    name: 'Scotland',
    multiplier: 1.05,
    majorCities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
    averageDeliveryCharge: 60,
    labourAvailability: 'medium',
  },
  {
    name: 'Northern Ireland',
    multiplier: 0.85,
    majorCities: ['Belfast', 'Derry', 'Lisburn', 'Newry'],
    averageDeliveryCharge: 45,
    labourAvailability: 'medium',
  },
];

/**
 * Seasonal Pricing Factors
 * Based on construction industry seasonal demand patterns
 */
export const SEASONAL_FACTORS: SeasonalFactors = {
  spring: 1.1, // High demand - good weather starts
  summer: 1.15, // Peak demand - optimal working conditions
  autumn: 1.05, // Moderate demand - last chance before winter
  winter: 0.95, // Lower demand - weather constraints
};

/**
 * Weather-based Contingency Percentages
 * Accounts for weather risks, delays, and labor availability
 * Applied to total project cost as a risk buffer
 */
export const CONTINGENCY_FACTORS: ContingencyFactors = {
  spring: {
    percentage: 12, // 12% contingency
    weatherRisk: 'Moderate - occasional rain, unpredictable weather',
    laborAvailability: 'Good - contractors returning from winter break',
  },
  summer: {
    percentage: 8, // 8% contingency - lowest risk
    weatherRisk: 'Low - best working conditions, minimal weather delays',
    laborAvailability: 'Challenging - high demand, contractors fully booked',
  },
  autumn: {
    percentage: 15, // 15% contingency
    weatherRisk: 'Increasing - more rain, shorter days, storm risk',
    laborAvailability: 'Moderate - rush to complete before winter',
  },
  winter: {
    percentage: 20, // 20% contingency - highest risk
    weatherRisk: 'High - frost delays, snow risk, limited working hours',
    laborAvailability: 'Limited - many contractors reduce winter work',
  },
};

/**
 * Tool Hire Rates - National averages from major UK hire companies
 * Includes typical rates from multiple suppliers across the UK
 */
export const TOOL_HIRE_RATES: ToolHireRate[] = [
  // Use national rates as primary source
  ...NATIONAL_HIRE_RATES,
  // Add Toddy Tool Hire as local supplier option
  ...TODDY_TOOL_HIRE_RATES,
  // Add additional specialty tools from other suppliers
  {
    id: 'angle_grinder_9inch',
    name: 'Angle Grinder (9")',
    category: 'power_tools',
    dailyRate: 22.0,
    weeklyRate: 88.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Heavy-duty angle grinder for cutting and grinding',
    alternatives: ['4.5" angle grinder', 'Cut-off saw'],
  },
  {
    id: 'circular_saw_230mm',
    name: 'Circular Saw (230mm)',
    category: 'power_tools',
    dailyRate: 25.0,
    weeklyRate: 100.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Professional circular saw for timber and sheet materials',
  },
  {
    id: 'reciprocating_saw',
    name: 'Reciprocating Saw',
    category: 'power_tools',
    dailyRate: 20.0,
    weeklyRate: 80.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Versatile demolition and cutting tool',
  },
  {
    id: 'planer_electric',
    name: 'Electric Planer',
    category: 'power_tools',
    dailyRate: 18.0,
    weeklyRate: 72.0,
    supplier: 'Average Market Rate',
    availability: 'medium',
    description: 'Professional electric planer for timber work',
  },

  // Heavy Machinery
  {
    id: 'concrete_mixer_240l',
    name: 'Concrete Mixer (240L)',
    category: 'heavy_machinery',
    dailyRate: 45.0,
    weeklyRate: 180.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Petrol-powered concrete mixer for medium jobs',
  },
  {
    id: 'mini_digger_1_5t',
    name: 'Mini Digger (1.5 Tonne)',
    category: 'heavy_machinery',
    dailyRate: 185.0,
    weeklyRate: 740.0,
    supplier: 'Average Market Rate',
    availability: 'medium',
    description: 'Compact excavator with operator training required',
    alternatives: ['Hand digging', 'Larger excavator'],
  },
  {
    id: 'scaffold_tower',
    name: 'Scaffold Tower (6.2m)',
    category: 'access',
    dailyRate: 35.0,
    weeklyRate: 140.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Mobile aluminium scaffold tower for working at height',
  },
  {
    id: 'cherry_picker_12m',
    name: 'Cherry Picker (12m)',
    category: 'access',
    dailyRate: 165.0,
    weeklyRate: 660.0,
    supplier: 'Average Market Rate',
    availability: 'low',
    description: 'Self-propelled aerial work platform',
  },

  // Hand Tools & Safety
  {
    id: 'hand_tools_basic_set',
    name: 'Basic Hand Tools Set',
    category: 'hand_tools',
    dailyRate: 15.0,
    weeklyRate: 60.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Complete set of basic hand tools for general work',
  },
  {
    id: 'safety_equipment_personal',
    name: 'Personal Safety Equipment',
    category: 'safety',
    dailyRate: 12.0,
    weeklyRate: 48.0,
    supplier: 'Average Market Rate',
    availability: 'high',
    description: 'Hard hat, safety glasses, gloves, and hi-vis vest',
  },
];

/**
 * BuildBuddy Scraped Materials - Fresh brick/block pricing from verified supplier aggregator
 * Scraped: 2025-11-13 from BuildBuddy.co.uk (Lords, Jewson, Builder Depot, Building Materials Direct)
 */
const BUILDBUDDY_MATERIALS: MaterialPrice[] = [
  {
    id: 'buildbuddy_ibstock_red_common_65mm',
    name: 'Ibstock Red Common Brick 65mm',
    category: 'structural',
    priceRange: { min: 0.62, max: 0.76, average: 0.69 },
    unit: 'per brick',
    supplier: 'BuildBuddy (Builder Depot)',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 100,
  },
  {
    id: 'buildbuddy_forterra_buff_common_65mm',
    name: 'Forterra Buff Common Brick 65mm',
    category: 'structural',
    priceRange: { min: 0.85, max: 1.03, average: 0.94 },
    unit: 'per brick',
    supplier: 'BuildBuddy (Jewson)',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 100,
  },
  {
    id: 'buildbuddy_wienerberger_facing_65mm',
    name: 'Wienerberger Red Smooth Facing Brick 65mm',
    category: 'structural',
    priceRange: { min: 1.08, max: 1.32, average: 1.2 },
    unit: 'per brick',
    supplier: 'BuildBuddy (Lords)',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 100,
  },
  {
    id: 'buildbuddy_engineering_brick_class_b',
    name: 'Engineering Brick Class B 65mm',
    category: 'structural',
    priceRange: { min: 1.21, max: 1.48, average: 1.35 },
    unit: 'per brick',
    supplier: 'BuildBuddy (Building Materials Direct)',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 100,
  },
  {
    id: 'buildbuddy_concrete_block_100mm_7_3n',
    name: 'Concrete Block 100mm 7.3N',
    category: 'structural',
    priceRange: { min: 2.03, max: 2.47, average: 2.25 },
    unit: 'per block',
    supplier: 'BuildBuddy (Jewson)',
    wasteFactor: 0.03,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 10,
  },
  {
    id: 'buildbuddy_aircrete_block_100mm_3_6n',
    name: 'Aircrete Block 100mm 3.6N',
    category: 'structural',
    priceRange: { min: 1.76, max: 2.14, average: 1.95 },
    unit: 'per block',
    supplier: 'BuildBuddy (Builder Depot)',
    wasteFactor: 0.03,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 10,
  },
];

/**
 * Material Prices - Based on Screwfix, B&Q, Travis Perkins average prices + BuildBuddy scraped data
 * Research from online retailers and trade suppliers 2024, Enhanced with fresh BuildBuddy pricing 2025
 */
export const MATERIAL_PRICES: MaterialPrice[] = [
  // Fresh BuildBuddy scraped data (priority - most recent pricing)
  ...BUILDBUDDY_MATERIALS,
  // Structural Materials
  {
    id: 'cement_25kg',
    name: 'Cement (25kg bag)',
    category: 'structural',
    priceRange: { min: 4.2, max: 5.8, average: 4.95 },
    unit: 'per bag',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 25,
    minimumOrder: 10,
  },
  {
    id: 'sand_building_bulk',
    name: 'Building Sand (Bulk)',
    category: 'structural',
    priceRange: { min: 45.0, max: 65.0, average: 55.0 },
    unit: 'per tonne',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'aggregate_20mm',
    name: 'Aggregate 20mm (Bulk)',
    category: 'structural',
    priceRange: { min: 48.0, max: 68.0, average: 58.0 },
    unit: 'per tonne',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
  },
  {
    id: 'brick_common_engineering',
    name: 'Engineering Bricks',
    category: 'structural',
    priceRange: { min: 0.45, max: 0.85, average: 0.65 },
    unit: 'per brick',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 65,
    minimumOrder: 100,
  },
  {
    id: 'timber_2x4_treated',
    name: 'Treated Timber 2x4 (2.4m)',
    category: 'structural',
    priceRange: { min: 4.5, max: 7.2, average: 5.85 },
    unit: 'per length',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },

  // Finishing Materials
  {
    id: 'plasterboard_12_5mm',
    name: 'Plasterboard 12.5mm (2400x1200)',
    category: 'finishing',
    priceRange: { min: 8.5, max: 12.0, average: 10.25 },
    unit: 'per sheet',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
  },
  {
    id: 'paint_emulsion_10l',
    name: 'Emulsion Paint (10L)',
    category: 'finishing',
    priceRange: { min: 35.0, max: 65.0, average: 48.0 },
    unit: 'per tin',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
  },
  {
    id: 'ceramic_tiles_m2',
    name: 'Ceramic Wall Tiles',
    category: 'finishing',
    priceRange: { min: 15.0, max: 45.0, average: 28.0 },
    unit: 'per m²',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },

  // Electrical
  {
    id: 'cable_twin_earth_2_5mm',
    name: 'Twin & Earth Cable 2.5mm',
    category: 'electrical',
    priceRange: { min: 1.85, max: 2.45, average: 2.15 },
    unit: 'per metre',
    supplier: 'Average Market Rate',
    wasteFactor: 0.15,
    vat: 'included',
  },
  {
    id: 'socket_outlet_13a',
    name: '13A Socket Outlet',
    category: 'electrical',
    priceRange: { min: 3.2, max: 8.5, average: 5.85 },
    unit: 'per unit',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
  },

  // Plumbing
  {
    id: 'copper_pipe_15mm',
    name: 'Copper Pipe 15mm',
    category: 'plumbing',
    priceRange: { min: 4.2, max: 6.8, average: 5.5 },
    unit: 'per metre',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },
  {
    id: 'radiator_double_panel',
    name: 'Double Panel Radiator (600x1000)',
    category: 'plumbing',
    priceRange: { min: 85.0, max: 165.0, average: 125.0 },
    unit: 'per unit',
    supplier: 'Average Market Rate',
    wasteFactor: 0.02,
    vat: 'included',
    leadTimeDays: 7,
  },
];

/**
 * Enhanced Aggregate Rates - Original + TW Aggregates & PGR Timber bulk delivery
 */
export const AGGREGATE_RATES: AggregateRate[] = [
  // Original concrete and basic rates
  {
    id: 'concrete_c25_ready_mix',
    name: 'Ready Mix Concrete C25',
    type: 'concrete',
    pricePerCubicMetre: 125.0,
    deliveryCharge: 85.0,
    minimumOrder: 4,
    supplier: 'Average Market Rate',
    region: 'National',
  },
  {
    id: 'concrete_c35_ready_mix',
    name: 'Ready Mix Concrete C35',
    type: 'concrete',
    pricePerCubicMetre: 140.0,
    deliveryCharge: 85.0,
    minimumOrder: 4,
    supplier: 'Average Market Rate',
    region: 'National',
  },
  {
    id: 'topsoil_screened',
    name: 'Screened Topsoil',
    type: 'soil',
    pricePerTonne: 35.0,
    deliveryCharge: 65.0,
    minimumOrder: 5,
    supplier: 'Average Market Rate',
    region: 'National',
  },
  {
    id: 'mot_type1_sub_base',
    name: 'MOT Type 1 Sub Base',
    type: 'stone',
    pricePerTonne: 28.0,
    deliveryCharge: 55.0,
    minimumOrder: 8,
    supplier: 'Average Market Rate',
    region: 'National',
  },

  // NEW: Enhanced aggregate rates from verified suppliers
  {
    id: 'tw_aggregates_mot_type1_loose',
    name: 'MOT Type 1 Sub Base (Loose) - TW Aggregates',
    type: 'stone',
    pricePerTonne: 32.0, // Calculated from bulk bag pricing
    deliveryCharge: 75.0,
    minimumOrder: 8,
    supplier: 'TW Aggregates',
    region: 'National',
  },
  {
    id: 'pgr_ballast_loose',
    name: 'Ballast (Loose Delivery) - PGR Timber',
    type: 'aggregate',
    pricePerTonne: 48.0, // Calculated from bulk bag pricing
    deliveryCharge: 45.0,
    minimumOrder: 5,
    supplier: 'PGR Timber',
    region: 'National',
  },
  {
    id: 'tw_granite_chippings_loose',
    name: 'Granite Chippings (Loose) - TW Aggregates',
    type: 'stone',
    pricePerTonne: 88.0,
    deliveryCharge: 75.0,
    minimumOrder: 3,
    supplier: 'TW Aggregates',
    region: 'National',
  },
  {
    id: 'pgr_building_sand_loose',
    name: 'Building Sand (Loose Delivery) - PGR Timber',
    type: 'sand',
    pricePerTonne: 50.0,
    deliveryCharge: 45.0,
    minimumOrder: 5,
    supplier: 'PGR Timber',
    region: 'National',
  },
];

/**
 * Labour Rates - Based on ONS data and recruitment agencies
 * Updated for 2024 market conditions
 */
export const LABOUR_RATES: LabourRate[] = [
  {
    id: 'general_labourer',
    tradeType: 'General Labourer',
    skillLevel: 'competent',
    hourlyRate: { min: 16.0, max: 22.0, average: 19.0 },
    dailyRate: { min: 128.0, max: 176.0, average: 152.0 },
    region: 'National',
    inDemand: false,
  },
  {
    id: 'carpenter_skilled',
    tradeType: 'Carpenter',
    skillLevel: 'skilled',
    hourlyRate: { min: 25.0, max: 40.0, average: 32.5 },
    dailyRate: { min: 200.0, max: 320.0, average: 260.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['City & Guilds Level 2', 'NVQ Level 2'],
  },
  {
    id: 'electrician_qualified',
    tradeType: 'Electrician',
    skillLevel: 'expert',
    hourlyRate: { min: 35.0, max: 55.0, average: 45.0 },
    dailyRate: { min: 280.0, max: 440.0, average: 360.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['18th Edition', 'Part P Certified', 'ECS Card'],
  },
  {
    id: 'plumber_qualified',
    tradeType: 'Plumber',
    skillLevel: 'expert',
    hourlyRate: { min: 30.0, max: 50.0, average: 40.0 },
    dailyRate: { min: 240.0, max: 400.0, average: 320.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['City & Guilds Level 2', 'Gas Safe (if applicable)'],
  },
  {
    id: 'bricklayer_skilled',
    tradeType: 'Bricklayer',
    skillLevel: 'skilled',
    hourlyRate: { min: 22.0, max: 38.0, average: 30.0 },
    dailyRate: { min: 176.0, max: 304.0, average: 240.0 },
    region: 'National',
    inDemand: true,
  },
  {
    id: 'plasterer_skilled',
    tradeType: 'Plasterer',
    skillLevel: 'skilled',
    hourlyRate: { min: 20.0, max: 35.0, average: 27.5 },
    dailyRate: { min: 160.0, max: 280.0, average: 220.0 },
    region: 'National',
    inDemand: false,
  },
  {
    id: 'roofer_skilled',
    tradeType: 'Roofer',
    skillLevel: 'skilled',
    hourlyRate: { min: 25.0, max: 42.0, average: 33.5 },
    dailyRate: { min: 200.0, max: 336.0, average: 268.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['CITB Safety Awareness', 'Working at Height'],
  },
  {
    id: 'painter_decorator',
    tradeType: 'Painter & Decorator',
    skillLevel: 'skilled',
    hourlyRate: { min: 18.0, max: 30.0, average: 24.0 },
    dailyRate: { min: 144.0, max: 240.0, average: 192.0 },
    region: 'National',
    inDemand: false,
  },
];

/**
 * Enhanced Pricing Data - Direct Integration
 * Checkatrade Waste Disposal, Build & Plumb, and Flooring Data
 * Integrated November 2025 for 88-93% accuracy target
 */

// Checkatrade Waste Disposal Data (2024-2025 Market Data)
const CHECKATRADE_WASTE_DISPOSAL: MaterialPrice[] = [
  {
    id: 'skip_hire_6_yard_national',
    name: '6 Yard Skip Hire (National Average)',
    category: 'waste_disposal',
    priceRange: { min: 200, max: 280, average: 240 },
    unit: 'per week',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
  {
    id: 'skip_hire_8_yard_large',
    name: '8 Yard Skip Hire (Large)',
    category: 'waste_disposal',
    priceRange: { min: 280, max: 360, average: 320 },
    unit: 'per week',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
  {
    id: 'rubbish_removal_hourly',
    name: 'Man and Van Rubbish Removal (Hourly)',
    category: 'waste_disposal',
    priceRange: { min: 60, max: 150, average: 95 },
    unit: 'per hour',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
  {
    id: 'rubbish_removal_full_load',
    name: 'Rubbish Removal Full Load (up to 1000kg)',
    category: 'waste_disposal',
    priceRange: { min: 260, max: 320, average: 290 },
    unit: 'per load',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
  {
    id: 'builders_waste_disposal',
    name: 'Builders Waste Disposal (Construction Materials)',
    category: 'waste_disposal',
    priceRange: { min: 180, max: 350, average: 265 },
    unit: 'per m³',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
];

// Build and Plumb Materials (Verified Pricing)
const BUILD_PLUMB_MATERIALS: MaterialPrice[] = [
  {
    id: 'build_plumb_radiator_valve_extension_100mm',
    name: '100mm Rigid Radiator Valve Extension Tail',
    category: 'plumbing',
    priceRange: { min: 4.95, max: 8.95, average: 6.95 },
    unit: 'per unit',
    supplier: 'Build and Plumb',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'build_plumb_pipe_collars_15mm',
    name: 'Talon 15mm Pipe Collars Black',
    category: 'plumbing',
    priceRange: { min: 9.99, max: 9.99, average: 9.99 },
    unit: 'per pack',
    supplier: 'Build and Plumb',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'build_plumb_double_panel_radiator_600x1000',
    name: 'Double Panel Radiator 600x1000mm',
    category: 'plumbing',
    priceRange: { min: 75.0, max: 145.0, average: 110.0 },
    unit: 'per unit',
    supplier: 'Build and Plumb',
    wasteFactor: 0.02,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'build_plumb_copper_pipe_15mm',
    name: 'Copper Pipe 15mm (3m length)',
    category: 'plumbing',
    priceRange: { min: 12.5, max: 18.5, average: 15.5 },
    unit: 'per 3m length',
    supplier: 'Build and Plumb',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'build_plumb_guttering_half_round',
    name: 'Half Round Guttering 112mm (4m length)',
    category: 'structural',
    priceRange: { min: 15.0, max: 25.0, average: 20.0 },
    unit: 'per 4m length',
    supplier: 'Build and Plumb',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
];

// Checkatrade Flooring Materials (2024-2025 Market Data)
const CHECKATRADE_FLOORING_MATERIALS: MaterialPrice[] = [
  {
    id: 'checkatrade_solid_hardwood_oak',
    name: 'Solid Hardwood Oak Flooring',
    category: 'flooring',
    priceRange: { min: 80, max: 120, average: 100 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.08,
    vat: 'included',
    deliveryCharge: 50,
    minimumOrder: 5,
  },
  {
    id: 'checkatrade_engineered_wood_mid',
    name: 'Engineered Wood Flooring (Mid-Range)',
    category: 'flooring',
    priceRange: { min: 40, max: 69, average: 50 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.08,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 5,
  },
  {
    id: 'checkatrade_laminate_premium',
    name: 'Premium Laminate Flooring (AC5 Commercial)',
    category: 'flooring',
    priceRange: { min: 25, max: 50, average: 37.5 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.08,
    vat: 'included',
    deliveryCharge: 40,
    minimumOrder: 8,
  },
  {
    id: 'checkatrade_laminate_budget',
    name: 'Budget Laminate Flooring (AC3)',
    category: 'flooring',
    priceRange: { min: 6, max: 16, average: 11 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 30,
    minimumOrder: 15,
  },
  {
    id: 'checkatrade_ceramic_tiles',
    name: 'Ceramic Floor Tiles',
    category: 'flooring',
    priceRange: { min: 15, max: 25, average: 20 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 5,
  },
  {
    id: 'checkatrade_underlay_standard',
    name: 'Standard Flooring Underlay',
    category: 'flooring',
    priceRange: { min: 2, max: 6, average: 4 },
    unit: 'per m²',
    supplier: 'Checkatrade Market Data',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 25,
    minimumOrder: 15,
  },
];

// Flooring Labour Rates
const FLOORING_LABOUR_RATES: LabourRate[] = [
  {
    id: 'flooring_installer_wooden',
    tradeType: 'Wooden Floor Installer',
    skillLevel: 'skilled',
    hourlyRate: { min: 25.0, max: 45.0, average: 35.0 },
    dailyRate: { min: 200.0, max: 360.0, average: 280.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['Flooring trade qualification'],
  },
  {
    id: 'flooring_installer_laminate',
    tradeType: 'Laminate Floor Installer',
    skillLevel: 'competent',
    hourlyRate: { min: 20.0, max: 35.0, average: 27.5 },
    dailyRate: { min: 160.0, max: 280.0, average: 220.0 },
    region: 'National',
    inDemand: false,
  },
];

const SKIP_PERMIT_COSTS: MaterialPrice[] = [
  {
    id: 'skip_permit_national',
    name: 'Skip Permit (National Average)',
    category: 'waste_disposal',
    priceRange: { min: 25, max: 65, average: 45 },
    unit: 'per week',
    supplier: 'UK Council Data',
    wasteFactor: 0,
    vat: 'included',
    minimumOrder: 1,
  },
];

// TW Aggregates Materials (National Supplier - £2.60-£80.00 range)
const TW_AGGREGATES_MATERIALS: MaterialPrice[] = [
  {
    id: 'tw_golden_gravel_10mm',
    name: 'Golden Gravel 10mm',
    category: 'aggregates',
    priceRange: { min: 45.0, max: 65.0, average: 55.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
  },
  {
    id: 'tw_mot_type1',
    name: 'MOT Type 1 Sub Base Material',
    category: 'aggregates',
    priceRange: { min: 35.0, max: 45.0, average: 40.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
  },
  {
    id: 'tw_recycled_6f2',
    name: 'Recycled 6F2 Hardcore',
    category: 'aggregates',
    priceRange: { min: 25.0, max: 35.0, average: 30.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
  },
  {
    id: 'tw_granite_dust',
    name: 'Granite Dust',
    category: 'aggregates',
    priceRange: { min: 40.0, max: 55.0, average: 47.5 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.03,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
  },
  {
    id: 'tw_slate_grey_40mm',
    name: 'Grey Slate Chippings 40mm',
    category: 'aggregates',
    priceRange: { min: 65.0, max: 80.0, average: 72.5 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
  },
];

// PGR Timber Aggregate Materials (£3.69-£104.80 range)
const PGR_TIMBER_MATERIALS: MaterialPrice[] = [
  {
    id: 'pgr_ballast_bulk',
    name: 'Ballast (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 57.62, max: 70.0, average: 63.81 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'pgr_mot_type1_bulk',
    name: 'MOT Type 1 (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 65.0, max: 78.0, average: 71.5 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'pgr_granite_bulk',
    name: 'Granite Chippings (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 85.0, max: 104.8, average: 94.9 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.03,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'pgr_sand_bulk',
    name: 'Building Sand (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 58.0, max: 72.0, average: 65.0 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.08,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'pgr_ballast_small',
    name: 'Ballast (25kg Bag)',
    category: 'aggregates',
    priceRange: { min: 3.69, max: 4.5, average: 4.1 },
    unit: 'per 25kg bag',
    supplier: 'PGR Timber',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 15,
    minimumOrder: 10,
  },
];

/**
 * Enhanced Material Prices - Now includes comprehensive verified sources
 * Base materials + BuildBuddy + Build&Plumb + Checkatrade Flooring
 */
export const ENHANCED_MATERIAL_PRICES: MaterialPrice[] = [
  // Original BuildBuddy and manual materials
  ...BUILDBUDDY_MATERIALS,
  // All other existing materials (cement, sand, aggregate, etc.)
  {
    id: 'cement_25kg',
    name: 'Cement (25kg bag)',
    category: 'structural',
    priceRange: { min: 4.2, max: 5.8, average: 4.95 },
    unit: 'per bag',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 25,
    minimumOrder: 10,
  },
  {
    id: 'sand_building_bulk',
    name: 'Building Sand (Bulk)',
    category: 'structural',
    priceRange: { min: 45.0, max: 65.0, average: 55.0 },
    unit: 'per tonne',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
  },
  {
    id: 'aggregate_20mm',
    name: 'Aggregate 20mm (Bulk)',
    category: 'structural',
    priceRange: { min: 48.0, max: 68.0, average: 58.0 },
    unit: 'per tonne',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
  },
  {
    id: 'brick_common_engineering',
    name: 'Engineering Bricks',
    category: 'structural',
    priceRange: { min: 0.45, max: 0.85, average: 0.65 },
    unit: 'per brick',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 65,
    minimumOrder: 100,
  },
  {
    id: 'timber_2x4_treated',
    name: 'Treated Timber 2x4 (2.4m)',
    category: 'structural',
    priceRange: { min: 4.5, max: 7.2, average: 5.85 },
    unit: 'per length',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },
  // Finishing Materials
  {
    id: 'plasterboard_12_5mm',
    name: 'Plasterboard 12.5mm (2400x1200)',
    category: 'finishing',
    priceRange: { min: 8.5, max: 12.0, average: 10.25 },
    unit: 'per sheet',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 45,
  },
  {
    id: 'paint_emulsion_10l',
    name: 'Emulsion Paint (10L)',
    category: 'finishing',
    priceRange: { min: 35.0, max: 65.0, average: 48.0 },
    unit: 'per tin',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
  },
  {
    id: 'ceramic_tiles_m2',
    name: 'Ceramic Wall Tiles',
    category: 'finishing',
    priceRange: { min: 15.0, max: 45.0, average: 28.0 },
    unit: 'per m²',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },
  // Electrical
  {
    id: 'cable_twin_earth_2_5mm',
    name: 'Twin & Earth Cable 2.5mm',
    category: 'electrical',
    priceRange: { min: 1.85, max: 2.45, average: 2.15 },
    unit: 'per metre',
    supplier: 'Average Market Rate',
    wasteFactor: 0.15,
    vat: 'included',
  },
  {
    id: 'socket_outlet_13a',
    name: '13A Socket Outlet',
    category: 'electrical',
    priceRange: { min: 3.2, max: 8.5, average: 5.85 },
    unit: 'per unit',
    supplier: 'Average Market Rate',
    wasteFactor: 0.05,
    vat: 'included',
  },
  // Plumbing (basic - enhanced by Build&Plumb data)
  {
    id: 'copper_pipe_15mm',
    name: 'Copper Pipe 15mm',
    category: 'plumbing',
    priceRange: { min: 4.2, max: 6.8, average: 5.5 },
    unit: 'per metre',
    supplier: 'Average Market Rate',
    wasteFactor: 0.1,
    vat: 'included',
  },
  {
    id: 'radiator_double_panel',
    name: 'Double Panel Radiator (600x1000)',
    category: 'plumbing',
    priceRange: { min: 85.0, max: 165.0, average: 125.0 },
    unit: 'per unit',
    supplier: 'Average Market Rate',
    wasteFactor: 0.02,
    vat: 'included',
    leadTimeDays: 7,
  },

  // NEW ENHANCED SOURCES
  // Build and Plumb verified plumbing supplies
  ...BUILD_PLUMB_MATERIALS,

  // Checkatrade comprehensive flooring materials
  ...CHECKATRADE_FLOORING_MATERIALS,

  // TW Aggregates Materials (8 verified items)
  {
    id: 'tw_golden_gravel_10mm',
    name: 'Golden Gravel 10mm',
    category: 'aggregates',
    priceRange: { min: 45.0, max: 65.0, average: 55.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Premium golden decorative gravel',
  },
  {
    id: 'tw_cotswold_gravel_20mm',
    name: 'Cotswold Gravel 20mm',
    category: 'aggregates',
    priceRange: { min: 50.0, max: 70.0, average: 60.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Natural Cotswold limestone gravel',
  },
  {
    id: 'tw_mot_type1',
    name: 'MOT Type 1 Sub Base Material',
    category: 'aggregates',
    priceRange: { min: 35.0, max: 45.0, average: 40.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Standard road sub-base material',
  },
  {
    id: 'tw_recycled_6f2',
    name: 'Recycled 6F2 Hardcore',
    category: 'aggregates',
    priceRange: { min: 25.0, max: 35.0, average: 30.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Recycled hardcore for sub-base',
  },
  {
    id: 'tw_granite_dust',
    name: 'Granite Dust',
    category: 'aggregates',
    priceRange: { min: 40.0, max: 55.0, average: 47.5 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.03,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Fine granite dust for pathways and surfaces',
  },
  {
    id: 'tw_slate_grey_40mm',
    name: 'Grey Slate Chippings 40mm',
    category: 'aggregates',
    priceRange: { min: 65.0, max: 80.0, average: 72.5 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Premium decorative slate chippings',
  },
  {
    id: 'tw_solent_gold_gravel',
    name: 'Solent Gold Gravel',
    category: 'aggregates',
    priceRange: { min: 48.0, max: 68.0, average: 58.0 },
    unit: 'per bulk bag (850kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.05,
    vat: 'excluded',
    deliveryCharge: 75,
    minimumOrder: 1,
    description: 'Premium golden aggregate for driveways',
  },
  {
    id: 'tw_golden_gravel_handy_bag',
    name: 'Golden Gravel 10mm (Handy Bag)',
    category: 'aggregates',
    priceRange: { min: 8.0, max: 12.0, average: 10.0 },
    unit: 'per handy bag (25kg)',
    supplier: 'TW Aggregates',
    wasteFactor: 0.1,
    vat: 'excluded',
    deliveryCharge: 25,
    minimumOrder: 5,
    description: 'Small bag option for DIY projects',
  },

  // PGR Timber Materials (8 verified items)
  {
    id: 'pgr_ballast_bulk',
    name: 'Ballast (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 57.62, max: 70.0, average: 63.81 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
    description: 'Mixed sand and gravel for concrete',
  },
  {
    id: 'pgr_mot_type1_bulk',
    name: 'MOT Type 1 (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 65.0, max: 78.0, average: 71.5 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
    description: 'Road sub-base material Type 1',
  },
  {
    id: 'pgr_granite_bulk',
    name: 'Granite Chippings (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 85.0, max: 104.8, average: 94.9 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.03,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
    description: 'Premium granite decorative chippings',
  },
  {
    id: 'pgr_shingle_bulk',
    name: 'Shingle (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 72.0, max: 88.0, average: 80.0 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.05,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
    description: 'Natural shingle for drainage and decoration',
  },
  {
    id: 'pgr_sand_bulk',
    name: 'Building Sand (Bulk Bag)',
    category: 'aggregates',
    priceRange: { min: 58.0, max: 72.0, average: 65.0 },
    unit: 'per bulk bag (800kg)',
    supplier: 'PGR Timber',
    wasteFactor: 0.08,
    vat: 'included',
    deliveryCharge: 45,
    minimumOrder: 1,
    description: 'Washed building sand for mortar and concrete',
  },
  {
    id: 'pgr_ballast_small',
    name: 'Ballast (25kg Bag)',
    category: 'aggregates',
    priceRange: { min: 3.69, max: 4.5, average: 4.1 },
    unit: 'per 25kg bag',
    supplier: 'PGR Timber',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 15,
    minimumOrder: 10,
    description: 'Small bag ballast for DIY projects',
  },
  {
    id: 'pgr_sand_small',
    name: 'Building Sand (25kg Bag)',
    category: 'aggregates',
    priceRange: { min: 4.2, max: 5.5, average: 4.85 },
    unit: 'per 25kg bag',
    supplier: 'PGR Timber',
    wasteFactor: 0.1,
    vat: 'included',
    deliveryCharge: 15,
    minimumOrder: 10,
    description: 'Small bag building sand for small projects',
  },
  {
    id: 'pgr_salt_winter',
    name: 'Rock Salt (25kg Bag)',
    category: 'aggregates',
    priceRange: { min: 5.5, max: 6.99, average: 6.25 },
    unit: 'per 25kg bag',
    supplier: 'PGR Timber',
    wasteFactor: 0.02,
    vat: 'included',
    deliveryCharge: 15,
    minimumOrder: 5,
    description: 'Rock salt for winter gritting',
  },
];

/**
 * Enhanced Labour Rates - Now includes flooring specialists
 */
export const ENHANCED_LABOUR_RATES: LabourRate[] = [
  // Original labour rates
  {
    id: 'general_labourer',
    tradeType: 'General Labourer',
    skillLevel: 'competent',
    hourlyRate: { min: 16.0, max: 22.0, average: 19.0 },
    dailyRate: { min: 128.0, max: 176.0, average: 152.0 },
    region: 'National',
    inDemand: false,
  },
  {
    id: 'carpenter_skilled',
    tradeType: 'Carpenter',
    skillLevel: 'skilled',
    hourlyRate: { min: 25.0, max: 40.0, average: 32.5 },
    dailyRate: { min: 200.0, max: 320.0, average: 260.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['City & Guilds Level 2', 'NVQ Level 2'],
  },
  {
    id: 'electrician_qualified',
    tradeType: 'Electrician',
    skillLevel: 'expert',
    hourlyRate: { min: 35.0, max: 55.0, average: 45.0 },
    dailyRate: { min: 280.0, max: 440.0, average: 360.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['18th Edition', 'Part P Certified', 'ECS Card'],
  },
  {
    id: 'plumber_qualified',
    tradeType: 'Plumber',
    skillLevel: 'expert',
    hourlyRate: { min: 30.0, max: 50.0, average: 40.0 },
    dailyRate: { min: 240.0, max: 400.0, average: 320.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['City & Guilds Level 2', 'Gas Safe (if applicable)'],
  },
  {
    id: 'bricklayer_skilled',
    tradeType: 'Bricklayer',
    skillLevel: 'skilled',
    hourlyRate: { min: 22.0, max: 38.0, average: 30.0 },
    dailyRate: { min: 176.0, max: 304.0, average: 240.0 },
    region: 'National',
    inDemand: true,
  },
  {
    id: 'plasterer_skilled',
    tradeType: 'Plasterer',
    skillLevel: 'skilled',
    hourlyRate: { min: 20.0, max: 35.0, average: 27.5 },
    dailyRate: { min: 160.0, max: 280.0, average: 220.0 },
    region: 'National',
    inDemand: false,
  },
  {
    id: 'roofer_skilled',
    tradeType: 'Roofer',
    skillLevel: 'skilled',
    hourlyRate: { min: 25.0, max: 42.0, average: 33.5 },
    dailyRate: { min: 200.0, max: 336.0, average: 268.0 },
    region: 'National',
    inDemand: true,
    certificationRequired: ['CITB Safety Awareness', 'Working at Height'],
  },
  {
    id: 'painter_decorator',
    tradeType: 'Painter & Decorator',
    skillLevel: 'skilled',
    hourlyRate: { min: 18.0, max: 30.0, average: 24.0 },
    dailyRate: { min: 144.0, max: 240.0, average: 192.0 },
    region: 'National',
    inDemand: false,
  },

  // NEW: Flooring specialists from Checkatrade
  ...FLOORING_LABOUR_RATES,
];

/**
 * Enhanced Waste Disposal Rates from Checkatrade
 */
export const WASTE_DISPOSAL_RATES = [...CHECKATRADE_WASTE_DISPOSAL, ...SKIP_PERMIT_COSTS];

/**
 * Maintain backward compatibility
 * Note: MATERIAL_PRICES and LABOUR_RATES are already exported above
 * These enhanced versions are available as separate exports
 */
// export const MATERIAL_PRICES = ENHANCED_MATERIAL_PRICES;
// export const LABOUR_RATES = ENHANCED_LABOUR_RATES;

/**
 * VAT Rate - Current UK standard rate
 */
export const UK_VAT_RATE = 0.2; // 20%
