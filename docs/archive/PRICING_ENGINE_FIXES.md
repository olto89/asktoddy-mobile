# Pricing Engine Fix List - MVP Critical

## 🚨 Critical Issues Found (Dec 5, 2024)

### Test Results Analysis

- **Kitchen (12m²)**: £11,077 - £19,020 ❌ (Too high)
- **Bathroom (7.5m²)**: £5,690 - £9,522 ✅ (Reasonable)
- **Expected Kitchen**: £8,000 - £15,000

---

## 🔴 Priority 1: Labor Calculations (URGENT)

### Issue:

- Kitchen showing 48 hours labor = £8,710
- Reality: Kitchen renovation = 3-5 days = 24-40 hours

### Fix Required:

```javascript
// Current (WRONG)
estimatedHours: roomSize * 4; // 12m² * 4 = 48 hours

// Should be:
const LABOR_HOURS_BY_PROJECT = {
  bathroom: { min: 16, max: 32 }, // 2-4 days
  kitchen: { min: 24, max: 40 }, // 3-5 days
  extension: { min: 80, max: 160 }, // 2-4 weeks
  loft: { min: 60, max: 120 }, // 1.5-3 weeks
};
```

### Impact: Reduces quotes by 30-40%

---

## 🔴 Priority 2: Missing Kitchen Appliances

### Issue:

- No appliances included in kitchen quotes
- Missing: Oven, hob, extractor, dishwasher, fridge

### Fix Required:

```javascript
const KITCHEN_APPLIANCES = {
  budget: {
    oven: 250,
    hob: 150,
    extractor: 100,
    dishwasher: 250,
    fridge: 300,
    total: 1050,
  },
  'mid-range': {
    oven: 500,
    hob: 300,
    extractor: 250,
    dishwasher: 450,
    fridge: 600,
    total: 2100,
  },
  premium: {
    oven: 1200,
    hob: 800,
    extractor: 600,
    dishwasher: 800,
    fridge: 1500,
    total: 4900,
  },
};
```

### Impact: Adds £1,000-5,000 to kitchen quotes

---

## 🟡 Priority 3: Material Quantities

### Issue:

- Kitchen: Only 6 units for 12m² (should be 10-12)
- Tiles: Generic m² without splash-back calculation

### Fix Required:

```javascript
// Kitchen units calculation
const UNITS_PER_METER = 2.5; // Standard 600mm units
const wallLength = Math.sqrt(roomSize) * 2; // Approximate
const unitsNeeded = Math.ceil(wallLength * UNITS_PER_METER);

// Tile calculation
const splashbackHeight = 0.6; // 60cm standard
const splashbackArea = wallLength * splashbackHeight;
```

### Impact: More accurate material costs

---

## 🟡 Priority 4: Regional Variations Not Applied

### Issue:

- All quotes showing "National" pricing
- London should be +35%, North -10%

### Fix Required:

- Detect user location (IP or ask)
- Apply regional multipliers to labor & materials
- Show "London pricing" vs "Manchester pricing"

---

## 🟢 Priority 5: Breakdown Clarity

### Current Issues:

- Labor shown as single line item
- No trade breakdown (plumber, electrician, etc.)
- Tool hire not itemized properly

### Improvement:

```javascript
labor: {
  plumber: { days: 2, rate: 300, total: 600 },
  electrician: { days: 1, rate: 350, total: 350 },
  carpenter: { days: 3, rate: 250, total: 750 },
  tiler: { days: 2, rate: 200, total: 400 }
}
```

---

## 📊 Validation Benchmarks

### Realistic UK Pricing (2024):

- **Bathroom Basic**: £3,000 - £5,000
- **Bathroom Mid**: £5,000 - £8,000
- **Bathroom Premium**: £8,000 - £15,000

- **Kitchen Basic**: £5,000 - £8,000
- **Kitchen Mid**: £8,000 - £15,000
- **Kitchen Premium**: £15,000 - £30,000

- **Extension (per m²)**: £1,500 - £2,500
- **Loft Conversion**: £20,000 - £60,000

---

## 🚀 Implementation Plan

### Week 1 (Dec 5-11):

1. ✅ Fix labor hour calculations
2. ✅ Add appliance pricing to kitchens
3. ✅ Test new pricing accuracy

### Week 2 (Dec 12-18):

1. ⏳ Improve material quantities
2. ⏳ Add regional variations
3. ⏳ Beta test with real contractors

### Week 3 (Dec 19-25):

1. ⏳ Polish breakdown presentation
2. ⏳ Final validation tests
3. ⏳ Production deployment

---

## ✅ Success Metrics

- Quotes within 20% of real contractor prices
- Labor costs = 40-50% of total (not 70-80%)
- Materials = 30-40% of total
- Clear, itemized breakdowns
- Regional accuracy

---

_Last Updated: December 5, 2024_
_Target: MVP Launch January 1, 2025_
