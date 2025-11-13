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
 * Aggregate Rates - Based on regional suppliers and concrete companies
 */
export const AGGREGATE_RATES: AggregateRate[] = [
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
 * VAT Rate - Current UK standard rate
 */
export const UK_VAT_RATE = 0.2; // 20%
