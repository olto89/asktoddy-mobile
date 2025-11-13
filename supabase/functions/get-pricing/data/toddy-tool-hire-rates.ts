/**
 * Toddy Tool Hire - Real Local Supplier Rates 2025
 * Woodbridge, Suffolk IP12 4SD
 * Contact: Oliver Todd 077965844715 or oliver@toddytoolhire.co.uk
 *
 * NOTE: All prices exclude delivery, collection, blades, fuel, consumables and VAT
 * Delivery charges apply based on distance from Woodbridge
 */

import { ToolHireRate } from '../types.ts';

export const TODDY_TOOL_HIRE_RATES: ToolHireRate[] = [
  // Mini Excavators
  {
    id: 'toddy_1000',
    name: 'Mini Digger Micro (Bobcat/Kubota)',
    category: 'plant',
    dailyRate: 100,
    rates: {
      day: 100,
      '2days': 140, // £70/day avg
      '3days': 170, // £56.67/day avg
      week: 195, // £32.50/day avg
      weekend: 130,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Bobcat or Kubota micro excavator for tight access work',
    location: 'Woodbridge, Suffolk',
    contact: '077965844715',
    alternatives: [],
  },
  {
    id: 'toddy_1001',
    name: 'Mini Digger 1.7T Canopy (Kubota)',
    category: 'plant',
    dailyRate: 100,
    rates: {
      day: 100,
      '2days': 140,
      '3days': 170,
      week: 195,
      weekend: 130,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Kubota 1.7T with canopy protection',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_1002',
    name: 'Mini Digger 1.8T Canopy (Volvo)',
    category: 'plant',
    dailyRate: 100,
    rates: {
      day: 100,
      '2days': 140,
      '3days': 170,
      week: 195,
      weekend: 130,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Volvo 1.8T excavator with canopy',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_1003',
    name: 'Mini Digger 1.9T Cab (Bobcat)',
    category: 'plant',
    dailyRate: 120,
    rates: {
      day: 120,
      '2days': 160, // £80/day avg
      '3days': 190, // £63.33/day avg
      week: 220, // £36.67/day avg
      weekend: 140,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Bobcat 1.9T with enclosed cab for weather protection',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_1004',
    name: 'Mini Digger 2.5T Cab (Volvo)',
    category: 'plant',
    dailyRate: 140,
    rates: {
      day: 140,
      '2days': 170, // £85/day avg
      '3days': 240, // £80/day avg
      week: 290, // £48.33/day avg
      weekend: 150,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'medium',
    description: 'Volvo 2.5T excavator with full cab',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Excavator Attachments
  {
    id: 'toddy_2000',
    name: 'Post Hole Borer (for 1.8T + 2.5T)',
    category: 'attachments',
    dailyRate: 50,
    rates: {
      day: 50,
      '2days': 80, // £40/day avg
      '3days': 100, // £33.33/day avg
      week: 120, // £20/day avg
      weekend: 70,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Post hole borer attachment for excavators',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_2001',
    name: 'Concrete Pecker (for Micro/1.8T/2.5T)',
    category: 'attachments',
    dailyRate: 80,
    rates: {
      day: 80,
      '2days': 110, // £55/day avg
      '3days': 130, // £43.33/day avg
      week: 150, // £25/day avg
      weekend: 100,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'medium',
    description: 'Concrete breaking attachment for excavators',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Dumpers
  {
    id: 'toddy_3000',
    name: 'Tracked Micro Dumper 800mm',
    category: 'plant',
    dailyRate: 70,
    rates: {
      day: 70,
      '2days': 100, // £50/day avg
      '3days': 130, // £43.33/day avg
      week: 150, // £25/day avg
      weekend: 90,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Compact tracked dumper for narrow access',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_3001',
    name: '1 Ton Skip Loader',
    category: 'plant',
    dailyRate: 70,
    rates: {
      day: 70,
      '2days': 100,
      '3days': 130,
      week: 150,
      weekend: 90,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: '1 tonne capacity skip loading dumper',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_3002',
    name: '3 Ton Dumper',
    category: 'plant',
    dailyRate: 90,
    rates: {
      day: 90,
      '2days': 120, // £60/day avg
      '3days': 140, // £46.67/day avg
      week: 160, // £26.67/day avg
      weekend: 100,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'medium',
    description: '3 tonne capacity dumper for larger loads',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Access Equipment
  {
    id: 'toddy_4000',
    name: 'Cherry Picker Trailer 12m (Nifty 120T)',
    category: 'access',
    dailyRate: 160,
    rates: {
      day: 160,
      '2days': 200, // £100/day avg
      '3days': 250, // £83.33/day avg
      week: 290, // £48.33/day avg
      weekend: 200,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'medium',
    description: 'Trailer mounted cherry picker, 12m working height',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_4001',
    name: 'Cherry Picker Tracked 12m (TD 120T)',
    category: 'access',
    dailyRate: 180,
    rates: {
      day: 180,
      '2days': 220, // £110/day avg
      '3days': 280, // £93.33/day avg
      week: 320, // £53.33/day avg
      weekend: 220,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'low',
    description: 'Tracked cherry picker, 12m working height',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Scaffold Towers - Multiple types available
  {
    id: 'toddy_5000',
    name: 'Scaffold Tower 4.2m Platform (Euro/Single/Double)',
    category: 'access',
    dailyRate: 70,
    rates: {
      day: 70,
      '2days': 80, // £40/day avg
      '3days': 90, // £30/day avg
      week: 100, // £16.67/day avg
      weekend: 80,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Mobile scaffold tower, 4.2m platform height',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_5001',
    name: 'Scaffold Tower 6.2m Platform (Single/Double)',
    category: 'access',
    dailyRate: 100,
    rates: {
      day: 100,
      '2days': 120, // £60/day avg
      '3days': 140, // £46.67/day avg
      week: 160, // £26.67/day avg
      weekend: 120,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Mobile scaffold tower, 6.2m platform height',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Podiums
  {
    id: 'toddy_6000',
    name: 'Podium Steps 1.45m Platform',
    category: 'access',
    dailyRate: 30,
    rates: {
      day: 30,
      '2days': 40, // £20/day avg
      '3days': 50, // £16.67/day avg
      week: 60, // £10/day avg
      weekend: 40,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Mobile podium platform, 1.45m working height',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Breaking and Drilling
  {
    id: 'toddy_7000',
    name: 'SDS Drill Cordless (Hilti)',
    category: 'power_tools',
    dailyRate: 35,
    rates: {
      day: 35,
      '2days': 45, // £22.50/day avg
      '3days': 55, // £18.33/day avg
      week: 60, // £10/day avg
      weekend: 40,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Hilti cordless SDS drill/breaker',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_7001',
    name: 'Electric Breaker SDS 900W (Milwaukee 110V)',
    category: 'breaking',
    dailyRate: 40,
    rates: {
      day: 40,
      '2days': 50, // £25/day avg
      '3days': 60, // £20/day avg
      week: 70, // £11.67/day avg
      weekend: 50,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Milwaukee 900W electric breaker, 110V',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_7002',
    name: 'Heavy Duty Electric Breaker (Makita 1700W)',
    category: 'breaking',
    dailyRate: 50,
    rates: {
      day: 50,
      '2days': 60, // £30/day avg
      '3days': 70, // £23.33/day avg
      week: 80, // £13.33/day avg
      weekend: 60,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'medium',
    description: 'Makita 1700W heavy duty electric breaker',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Compaction
  {
    id: 'toddy_8000',
    name: 'Compaction Plate Small/Medium',
    category: 'plant',
    dailyRate: 40,
    rates: {
      day: 40,
      '2days': 45, // £22.50/day avg
      '3days': 55, // £18.33/day avg
      week: 60, // £10/day avg
      weekend: 45,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Petrol compaction plate for soil/aggregate compaction',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },

  // Concrete Equipment
  {
    id: 'toddy_9000',
    name: 'Concrete Mixer Electric (Belle)',
    category: 'concrete',
    dailyRate: 25,
    rates: {
      day: 25,
      '2days': 35, // £17.50/day avg
      '3days': 40, // £13.33/day avg
      week: 45, // £7.50/day avg
      weekend: 30,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Belle electric concrete mixer',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
  {
    id: 'toddy_9001',
    name: 'Concrete Poker Vibrating',
    category: 'concrete',
    dailyRate: 40,
    rates: {
      day: 40,
      '2days': 50, // £25/day avg
      '3days': 60, // £20/day avg
      week: 70, // £11.67/day avg
      weekend: 40,
    },
    supplier: 'Toddy Tool Hire',
    availability: 'high',
    description: 'Concrete vibrating poker for air removal',
    location: 'Woodbridge, Suffolk',
    alternatives: [],
  },
];

// Export for use in pricing service
export function getToddyToolHireRate(toolName: string): ToolHireRate | undefined {
  return TODDY_TOOL_HIRE_RATES.find(
    tool =>
      tool.name.toLowerCase().includes(toolName.toLowerCase()) ||
      toolName.toLowerCase().includes(tool.name.toLowerCase())
  );
}

// Calculate proper multi-day rates based on Toddy's pricing structure
export function calculateMultiDayRate(tool: ToolHireRate, days: number): number {
  if (!tool.rates) {
    // Fallback to old calculation if rates not available
    if (days <= 1) return tool.dailyRate;
    if (days <= 2) return tool.dailyRate * 1.4; // 40% more for 2 days
    if (days <= 3) return tool.dailyRate * 1.7; // 70% more for 3 days
    if (days <= 7) return tool.dailyRate * 1.95; // 95% more for week
    return tool.dailyRate * 1.95; // Use weekly rate for longer periods
  }

  // Use actual rates from Toddy structure
  if (days <= 1) return tool.rates.day;
  if (days <= 2) return tool.rates['2days'];
  if (days <= 3) return tool.rates['3days'];
  if (days <= 7) return tool.rates.week;

  // For longer than a week, calculate additional weeks
  const additionalWeeks = Math.ceil((days - 7) / 7);
  return tool.rates.week + additionalWeeks * tool.rates.week * 0.9; // 10% discount for additional weeks
}

// Regional delivery charges from Woodbridge base
export function getToddyDeliveryCharge(location: string): number {
  const deliveryZones: Record<string, number> = {
    Ipswich: 25,
    Colchester: 35,
    Norwich: 45,
    Cambridge: 65,
    London: 120,
    Suffolk: 30,
    Essex: 40,
    Norfolk: 50,
    Hertfordshire: 80,
    Kent: 90,
  };

  // Find best match for location
  for (const [zone, charge] of Object.entries(deliveryZones)) {
    if (location.toLowerCase().includes(zone.toLowerCase())) {
      return charge;
    }
  }

  // Default delivery charge for unknown areas
  return 60;
}
