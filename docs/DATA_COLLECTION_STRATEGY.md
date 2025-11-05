# AskToddy Data Collection Strategy

## Building Comprehensive Construction Pricing Models

> **Objective**: Create the UK's most comprehensive construction pricing database
> **Method**: Systematic collection following our proven plant hire approach
> **Timeline**: 4 weeks to populate all categories

---

## 🎯 Data Collection Principles

Following our successful plant hire PDF collection model:

1. **Source Diversity**: National chains, regional suppliers, independents
2. **Geographic Coverage**: All UK regions with location metadata
3. **Format Types**: Text PDFs, catalog PDFs, online price lists
4. **Update Frequency**: Quarterly refresh cycle
5. **Anonymization**: Store source but never expose in quotes

---

## 📊 Category 1: Building Materials

**Target: 1,000+ items**

### Collection Sources

#### National Chains (40% of data)

```
Travis Perkins    - PDF catalog + online prices
Jewson           - Trade price list PDF
Wickes Trade     - Online catalog scraping
B&Q Trade Point  - PDF downloads
Selco            - Trade catalog PDF
Buildbase        - Regional price lists
MKM              - Branch price lists
```

#### Regional Suppliers (30% of data)

```
Gibbs & Dandy    - Southeast catalog
RGB Building     - Scotland pricing
Huws Gray        - Wales/Northwest
Bradfords        - Yorkshire region
Parker Building  - Southwest
```

#### Independent/Specialist (30% of data)

```
Local timber yards     - Direct contact
Insulation specialists - Trade pricing
Roofing suppliers     - Contractor rates
Plumbing merchants    - Trade accounts
Electrical wholesalers - Contractor pricing
```

### Data Structure

```typescript
interface BuildingMaterial {
  // Core fields
  sku: string;
  description: string;
  category: 'timber' | 'insulation' | 'plasterboard' | 'roofing' | 'plumbing' | 'electrical';
  unit: 'sheet' | 'length' | 'pack' | 'roll' | 'bag' | 'each';

  // Pricing tiers
  retailPrice: number;
  tradePrice: number;
  bulkPrice?: { quantity: number; price: number }[];

  // Specifications
  dimensions?: string;
  coverage?: string;
  weight?: number;
  brand?: string;

  // Availability
  stockStatus: 'in-stock' | 'order-only' | '3-5-days';
  leadTime?: string;
}
```

### Collection Method

1. **Week 1**: Download all PDF catalogs from major suppliers
2. **Week 2**: Process PDFs using Gemini Vision API
3. **Week 3**: Validate and cross-reference prices
4. **Week 4**: Regional adjustment factors

---

## 📊 Category 2: Aggregates & Bulk Materials

**Target: 200+ items**

### Collection Sources

#### Quarries & Producers (50% of data)

```
Aggregate Industries  - National pricing
Tarmac               - Regional quarries
Hanson               - Bulk pricing
Brett Aggregates     - Southeast
CEMEX                - Concrete/aggregates
Day Aggregates       - Regional supplier
```

#### Builders Merchants (30% of data)

```
Travis Perkins       - Bagged/bulk
Jewson              - Standard pricing
Local merchants     - Delivery included
```

#### Specialist Suppliers (20% of data)

```
Decorative stone suppliers
Specialist sand providers
Recycled aggregate suppliers
Topsoil specialists
```

### Data Structure

```typescript
interface AggregateMaterial {
  // Core fields
  material: string;
  type: 'sand' | 'gravel' | 'hardcore' | 'topsoil' | 'concrete' | 'decorative';
  grade?: string; // MOT Type 1, Type 2, etc.

  // Pricing options
  bagPrice?: number; // Per 25kg bag
  bulkBagPrice?: number; // Per 850kg bag
  loosePrice?: number; // Per tonne

  // Delivery
  deliveryBase: number;
  deliveryPerMile: number;
  minOrder?: number;

  // Specifications
  density: number; // kg/m³
  coverage: string; // m² at depth
  suitableFor: string[];
}
```

### Collection Method

1. **Contact quarries** for trade price lists
2. **PDF extraction** from merchant catalogs
3. **Delivery matrices** by distance/quantity
4. **Regional variations** mapping

---

## 📊 Category 3: Waste Management

**Target: 50+ options**

### Collection Sources

#### National Skip Hire (40% of data)

```
Biffa               - National pricing
Veolia              - Commercial rates
FCC Environment     - Regional pricing
```

#### Regional Operators (40% of data)

```
London Skip Hire
Manchester Skips
Birmingham Waste
Scottish Skip Hire
Bristol Waste
```

#### Specialist Services (20% of data)

```
Grab hire operators
Muck away specialists
Hazardous waste handlers
Recycling specialists
```

### Data Structure

```typescript
interface WasteService {
  // Service type
  service: 'skip' | 'grab' | 'wait-load' | 'muck-away' | 'hazardous';

  // Skip specific
  skipSize?: '2yd' | '4yd' | '6yd' | '8yd' | '12yd' | '16yd' | '20yd' | '40yd';

  // Pricing
  hirePeriod: number; // days
  basePrice: number;
  extensionDaily: number;

  // Waste types
  wasteTypes: ('general' | 'soil' | 'concrete' | 'wood' | 'metal' | 'mixed')[];
  landfillTax: number;

  // Service area
  coverageRadius: number;
  sameDay: boolean;
  permitRequired?: boolean;
}
```

---

## 📊 Category 4: Labour Rates

**Target: 15 trades × 3 skill levels × 10 regions**

### Collection Sources

#### Industry Bodies (30% of data)

```
FMB (Federation of Master Builders)
NAPIT (Electrical)
CIPHE (Plumbing)
FIS (Plastering)
NFRC (Roofing)
```

#### Recruitment Agencies (40% of data)

```
Hays Construction
Randstad Construction
Indeed salary data
Reed recruitment
Local agencies
```

#### Direct Research (30% of data)

```
Contractor surveys
Forum discussions
Trade publications
Government statistics
```

### Data Structure

```typescript
interface LabourRate {
  // Trade details
  trade: 'groundwork' | 'brickwork' | 'carpentry' | 'electrical' | 'plumbing' | etc;
  skillLevel: 'apprentice' | 'qualified' | 'experienced' | 'specialist';

  // Rates
  dayRate: number;
  hourlyRate: number;
  overtimeMultiplier: number;
  weekendMultiplier: number;

  // Gang rates
  gangSize?: number;
  gangDayRate?: number;

  // Regional variation
  region: string;
  urbanRural: 'urban' | 'suburban' | 'rural';

  // Additional costs
  travelTime?: number;
  accommodation?: boolean;
}
```

---

## 📊 Category 5: Small Tools & Equipment

**Target: 300+ items**

### Collection Sources

Follow plant hire model but focus on:

```
HSS Hire         - Small tools catalog
Speedy Services  - Hand tools section
Brandon Hire     - Power tools
Local hire shops - Specialist equipment
```

---

## 📊 Category 6: Specialist Services

**Target: 100+ services**

### Services to Include

```
- Scaffolding (per m² per week)
- Crane hire (per day + operator)
- Specialist drilling
- Surveying services
- Structural engineering
- Building control fees
- Planning application costs
```

---

## 🔄 Data Processing Pipeline

### Stage 1: Collection (Week 1)

```bash
/data/price-lists/
├── building-materials/
│   ├── national/
│   │   ├── TravisPerkins_2024_Q4.pdf
│   │   ├── Jewson_Trade_2024.pdf
│   │   └── Wickes_Trade_2024.pdf
│   ├── regional/
│   │   ├── GibbsDandy_Southeast_2024.pdf
│   │   └── HuwsGray_Wales_2024.pdf
│   └── independent/
│       └── [Local suppliers]
├── aggregates/
│   ├── quarries/
│   ├── merchants/
│   └── specialists/
├── waste/
│   ├── national/
│   ├── regional/
│   └── specialist/
└── labour/
    ├── industry-reports/
    ├── agency-data/
    └── survey-results/
```

### Stage 2: Extraction (Week 2)

```typescript
// Batch process all PDFs
async function processCategory(category: string) {
  const pdfs = await listPDFs(category);

  for (const pdf of pdfs) {
    const type = detectPDFType(pdf); // text-based or catalog

    if (type === 'catalog') {
      await extractWithGeminiVision(pdf);
    } else {
      await extractWithTextParsing(pdf);
    }

    await validateExtraction(pdf);
    await storeInDatabase(pdf);
  }
}
```

### Stage 3: Validation (Week 3)

- Cross-reference prices between suppliers
- Identify outliers (>2 standard deviations)
- Fill gaps with interpolation
- Apply regional adjustments

### Stage 4: Integration (Week 4)

- Connect to AI chat system
- Build quote generation templates
- Create pricing API endpoints
- Test with real scenarios

---

## 📈 Success Metrics

### Data Quality

- **Coverage**: 95% of common construction items
- **Accuracy**: ±10% of actual market prices
- **Freshness**: Updated quarterly
- **Confidence**: >80% confidence on all prices

### Collection Targets

| Week | Target                    | Items          |
| ---- | ------------------------- | -------------- |
| 1    | Collect all PDFs          | 100+ documents |
| 2    | Process materials         | 1,000 items    |
| 3    | Process aggregates/waste  | 250 items      |
| 4    | Labour rates & validation | 450 rates      |

---

## 🔒 Data Governance

### Anonymization Rules

1. **Never expose supplier names** in customer-facing quotes
2. **Store source for internal tracking** only
3. **Present as "market rates"** based on multiple suppliers
4. **Use percentile ranges** (25th, 50th, 75th) not specific prices

### Legal Compliance

- Respect supplier terms of service
- Use publicly available pricing only
- No automated scraping without permission
- Clear data retention policies

---

## 🚀 Implementation Checklist

### Week 1: Collection Sprint

- [ ] Create supplier contact list
- [ ] Download all available PDFs
- [ ] Set up web scraping where permitted
- [ ] Organize file structure
- [ ] Document data sources

### Week 2: Processing Sprint

- [ ] Configure Gemini Vision API
- [ ] Build extraction pipelines
- [ ] Process building materials
- [ ] Process aggregates
- [ ] Initial database population

### Week 3: Validation Sprint

- [ ] Cross-reference pricing
- [ ] Regional adjustment factors
- [ ] Outlier detection
- [ ] Gap filling
- [ ] Labour rate research

### Week 4: Integration Sprint

- [ ] Connect to chat system
- [ ] Build pricing APIs
- [ ] Test quote generation
- [ ] Performance optimization
- [ ] Documentation

---

## 📚 Data Source Templates

### Email Template for Suppliers

```
Subject: Trade Price List Request - AskToddy Platform

Dear [Supplier],

We're building AskToddy, a professional quoting platform for UK construction contractors. We'd like to include your pricing to help contractors make informed decisions.

We will:
- Never expose your company name in quotes
- Present prices as "market rates"
- Drive qualified leads to suppliers
- Respect your pricing policies

Could you please share your current trade price list?

Best regards,
AskToddy Team
```

### PDF Naming Convention

```
[Company]_[Category]_[Year]-[Quarter]_[Region].pdf

Examples:
TravisPerkins_BuildingMaterials_2024-Q4_National.pdf
LocalTimber_Timber_2024-Q4_Manchester.pdf
Biffa_SkipHire_2024-Q4_London.pdf
```

---

## 🎯 End Goal

By Week 4, AskToddy will have:

- **10,000+ priced items** in the database
- **Complete UK coverage** with regional variations
- **Professional quote generation** with real prices
- **Competitive advantage** over generic AI tools
- **Industry credibility** as a specialist platform

This positions AskToddy as the **"Bloomberg Terminal for Construction Pricing"** - the go-to source for accurate, real-time construction costs in the UK.
