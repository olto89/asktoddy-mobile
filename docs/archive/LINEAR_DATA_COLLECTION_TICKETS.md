# Linear Data Collection Tickets - AskToddy Pricing Engine

## Epic: ASK-200 - Comprehensive Pricing Database

**Goal**: Build UK's most comprehensive construction pricing database with 10,000+ items
**Timeline**: 4 weeks
**Success Criteria**: 95% coverage of common construction items with <10% price variance

---

## Phase 1: Database Schema & Infrastructure (Week 1)

### ASK-201: Comprehensive Pricing Database Schema

**Priority**: P0 - Critical
**Points**: 8
**Description**: Implement complete database schema for all construction categories
**Acceptance Criteria**:

- [ ] Execute 20251031_comprehensive_pricing_models.sql migration
- [ ] Create all 9 main tables (materials, aggregates, waste, labour, tools, specialist, regional, seasonal, packages)
- [ ] Implement proper indexes for performance
- [ ] Set up RLS policies for data security
- [ ] Test all pricing calculation functions

### ASK-202: Data Processing Pipeline Enhancement

**Priority**: P0 - Critical
**Points**: 5
**Description**: Extend existing PDF processor for all categories
**Acceptance Criteria**:

- [ ] Adapt process-price-pdfs.ts for materials, aggregates, waste
- [ ] Add category-specific extraction prompts for Gemini
- [ ] Implement bulk data validation
- [ ] Create progress tracking and error handling
- [ ] Add data quality scoring

### ASK-203: Regional & Seasonal Adjustment System

**Priority**: P1 - High
**Points**: 3
**Description**: Implement UK regional pricing variations
**Acceptance Criteria**:

- [ ] Populate regional_adjustments table with UK regions
- [ ] Map postcode prefixes to regions
- [ ] Implement seasonal pricing adjustments (12 months)
- [ ] Create adjustment calculation functions
- [ ] Test pricing variations by location

---

## Phase 2: Building Materials Data (Week 1-2)

### ASK-204: National Building Merchants Collection

**Priority**: P0 - Critical
**Points**: 5
**Description**: Collect pricing data from major national suppliers
**Acceptance Criteria**:

- [ ] Download Travis Perkins trade catalog PDF
- [ ] Download Jewson building materials price list
- [ ] Download Wickes Trade catalog
- [ ] Download B&Q Trade Point pricing
- [ ] Download Selco builders warehouse catalog
- [ ] Organize files in /data/building-materials/national/

### ASK-205: Regional Building Suppliers Collection

**Priority**: P1 - High
**Points**: 3
**Description**: Collect regional supplier catalogs
**Acceptance Criteria**:

- [ ] Gibbs & Dandy (Southeast) catalog
- [ ] RGB Building Supplies (Scotland) pricing
- [ ] Huws Gray (Wales/Northwest) catalog
- [ ] Bradfords (Yorkshire) price list
- [ ] Parker Building Supplies (Southwest) catalog
- [ ] Document supplier coverage areas

### ASK-206: Building Materials Processing

**Priority**: P0 - Critical
**Points**: 8
**Description**: Process building materials PDFs and populate database
**Acceptance Criteria**:

- [ ] Process 1,000+ material items
- [ ] Extract trade pricing with bulk discounts
- [ ] Validate cross-supplier price consistency
- [ ] Implement smart averaging without supplier exposure
- [ ] Quality check: materials coverage >90%

### ASK-207: Specialist Materials Collection

**Priority**: P2 - Medium
**Points**: 3
**Description**: Collect specialist supplier pricing
**Acceptance Criteria**:

- [ ] Insulation specialist catalogs
- [ ] Roofing merchant price lists
- [ ] Plumbing wholesaler pricing
- [ ] Electrical wholesaler catalogs
- [ ] Paint & decorating supplier lists

---

## Phase 3: Aggregates & Waste Data (Week 2)

### ASK-208: Quarry & Aggregate Producer Outreach

**Priority**: P0 - Critical
**Points**: 5
**Description**: Collect aggregate pricing from quarries and producers
**Acceptance Criteria**:

- [ ] Contact Aggregate Industries for national pricing
- [ ] Obtain Tarmac regional pricing lists
- [ ] Get Hanson bulk material pricing
- [ ] Collect Brett Aggregates (Southeast) catalog
- [ ] Obtain CEMEX concrete and aggregate pricing
- [ ] Document delivery zones and charges

### ASK-209: Aggregates Database Population

**Priority**: P0 - Critical
**Points**: 5
**Description**: Process aggregate pricing into database
**Acceptance Criteria**:

- [ ] Process 200+ aggregate items
- [ ] Include bag, bulk bag, and loose pricing
- [ ] Map delivery costs by distance
- [ ] Calculate coverage rates (m² per tonne)
- [ ] Quality check: aggregates coverage >95%

### ASK-210: Waste Management Collection

**Priority**: P1 - High
**Points**: 5
**Description**: Collect skip hire and waste pricing
**Acceptance Criteria**:

- [ ] Biffa national skip hire rates
- [ ] Veolia commercial waste pricing
- [ ] FCC Environment regional pricing
- [ ] Local skip hire operators (5+ regions)
- [ ] Specialist waste services (hazardous, grab hire)

### ASK-211: Waste Services Database Population

**Priority**: P1 - High
**Points**: 3
**Description**: Process waste management pricing
**Acceptance Criteria**:

- [ ] Process 50+ waste service options
- [ ] Include all skip sizes (2-yard to 40-yard)
- [ ] Map permit requirements by council
- [ ] Include landfill tax and environmental charges
- [ ] Quality check: waste services coverage >85%

---

## Phase 4: Labour Rates Research (Week 3)

### ASK-212: Industry Body Labour Data Collection

**Priority**: P0 - Critical
**Points**: 5
**Description**: Collect official trade rates from industry bodies
**Acceptance Criteria**:

- [ ] FMB (Federation of Master Builders) rate surveys
- [ ] NAPIT electrical contractor rates
- [ ] CIPHE plumbing contractor rates
- [ ] FIS plastering rates
- [ ] NFRC roofing contractor rates
- [ ] CITB apprentice rates

### ASK-213: Recruitment Agency Data Collection

**Priority**: P1 - High
**Points**: 3
**Description**: Collect labour rates from recruitment agencies
**Acceptance Criteria**:

- [ ] Hays Construction salary surveys
- [ ] Randstad Construction rate cards
- [ ] Indeed salary data extraction
- [ ] Reed recruitment rate analysis
- [ ] Local agency rate surveys (5+ regions)

### ASK-214: Labour Rates Database Population

**Priority**: P0 - Critical
**Points**: 5
**Description**: Process and populate labour rates
**Acceptance Criteria**:

- [ ] Process 15 trades × 5 skill levels × 10 regions = 750 rates
- [ ] Include day rates, hourly rates, overtime multipliers
- [ ] Map CIS registration and qualification requirements
- [ ] Apply regional variations
- [ ] Quality check: labour coverage >90%

---

## Phase 5: Tools & Specialist Services (Week 3-4)

### ASK-215: Small Tools Collection

**Priority**: P1 - High
**Points**: 3
**Description**: Collect small tools and equipment pricing
**Acceptance Criteria**:

- [ ] HSS Hire small tools catalog
- [ ] Speedy Services hand tools section
- [ ] Brandon Hire power tools pricing
- [ ] Local hire shops (3+ regions)
- [ ] Specialist tool suppliers

### ASK-216: Tools Database Population

**Priority**: P1 - High
**Points**: 3
**Description**: Process tools and equipment pricing
**Acceptance Criteria**:

- [ ] Process 300+ tool items
- [ ] Include daily/weekly/monthly rates
- [ ] Map damage waiver and insurance costs
- [ ] Include consumables and training requirements
- [ ] Quality check: tools coverage >80%

### ASK-217: Specialist Services Collection

**Priority**: P2 - Medium
**Points**: 3
**Description**: Collect specialist construction services pricing
**Acceptance Criteria**:

- [ ] Scaffolding contractors (per m²/week rates)
- [ ] Crane hire operators (per day + operator)
- [ ] Structural engineering consultants
- [ ] Building control fee schedules
- [ ] Surveying service rates

### ASK-218: Specialist Services Database Population

**Priority**: P2 - Medium
**Points**: 3
**Description**: Process specialist services pricing
**Acceptance Criteria**:

- [ ] Process 100+ specialist services
- [ ] Include qualification levels and insurance
- [ ] Map service areas and travel charges
- [ ] Include emergency and out-of-hours rates
- [ ] Quality check: specialist services coverage >75%

---

## Phase 6: Data Validation & Integration (Week 4)

### ASK-219: Cross-Category Price Validation

**Priority**: P0 - Critical
**Points**: 5
**Description**: Validate pricing consistency across suppliers
**Acceptance Criteria**:

- [ ] Cross-reference prices between suppliers
- [ ] Identify and investigate outliers (>2 std dev)
- [ ] Validate regional adjustment factors
- [ ] Confirm seasonal pricing patterns
- [ ] Generate data quality report

### ASK-220: Package Deal Logic Implementation

**Priority**: P1 - High
**Points**: 5
**Description**: Create intelligent package deals and bundles
**Acceptance Criteria**:

- [ ] Define common project packages (extension, renovation, etc.)
- [ ] Calculate bulk discount opportunities
- [ ] Implement cross-category bundling logic
- [ ] Create package pricing algorithms
- [ ] Test package recommendations

### ASK-221: Pricing API Integration

**Priority**: P0 - Critical
**Points**: 5
**Description**: Connect pricing database to AI chat system
**Acceptance Criteria**:

- [ ] Create pricing query API endpoints
- [ ] Implement smart price lookup functions
- [ ] Connect to conversation context system
- [ ] Add confidence scoring to all prices
- [ ] Test real-time pricing in chat

### ASK-222: Data Quality Dashboard

**Priority**: P2 - Medium
**Points**: 3
**Description**: Create admin dashboard for data monitoring
**Acceptance Criteria**:

- [ ] Build data coverage visualization
- [ ] Create price variance monitoring
- [ ] Implement data freshness tracking
- [ ] Add supplier anonymization verification
- [ ] Create data update scheduling

---

## Phase 7: Testing & Launch Preparation (Week 4)

### ASK-223: Real-World Price Testing

**Priority**: P0 - Critical
**Points**: 5
**Description**: Test pricing accuracy against real quotes
**Acceptance Criteria**:

- [ ] Generate 10 test quotes across all categories
- [ ] Compare against real supplier quotes
- [ ] Validate price variance is <10%
- [ ] Test regional pricing accuracy
- [ ] Verify anonymization is working

### ASK-224: Performance Optimization

**Priority**: P1 - High
**Points**: 3
**Description**: Optimize database queries for production load
**Acceptance Criteria**:

- [ ] Optimize pricing lookup queries (<100ms)
- [ ] Implement database indexing strategy
- [ ] Test with concurrent user load
- [ ] Implement caching where appropriate
- [ ] Monitor database performance metrics

### ASK-225: Data Documentation

**Priority**: P1 - High
**Points**: 2
**Description**: Document pricing data sources and methodology
**Acceptance Criteria**:

- [ ] Document all data sources and collection dates
- [ ] Create pricing methodology guide
- [ ] Document anonymization processes
- [ ] Create admin user guides
- [ ] Update API documentation

---

## Backlog Items (Post-MVP)

### ASK-226: Automated Price Updates

**Points**: 8
**Description**: Implement automated pricing updates from supplier feeds

### ASK-227: Supplier Integration API

**Points**: 13
**Description**: Direct API connections to major suppliers

### ASK-228: Machine Learning Price Prediction

**Points**: 8
**Description**: ML models for price trend prediction

### ASK-229: Competitive Intelligence

**Points**: 5
**Description**: Monitor competitor pricing and market changes

---

## Data Collection Sprint Plan

### Sprint 1 (Week 1)

- ASK-201: Database Schema
- ASK-202: Processing Pipeline
- ASK-204: National Merchants Collection
- ASK-208: Quarry Outreach

### Sprint 2 (Week 2)

- ASK-206: Materials Processing
- ASK-209: Aggregates Processing
- ASK-210: Waste Collection
- ASK-212: Industry Body Data

### Sprint 3 (Week 3)

- ASK-213: Agency Data Collection
- ASK-214: Labour Rates Processing
- ASK-215: Tools Collection
- ASK-217: Specialist Services

### Sprint 4 (Week 4)

- ASK-219: Data Validation
- ASK-221: API Integration
- ASK-223: Real-World Testing
- ASK-224: Performance Optimization

---

## Success Metrics

### Data Coverage Targets

| Category           | Target Items | Week 4 Goal   |
| ------------------ | ------------ | ------------- |
| Building Materials | 1,000+       | >90% coverage |
| Aggregates         | 200+         | >95% coverage |
| Waste Services     | 50+          | >85% coverage |
| Labour Rates       | 750+         | >90% coverage |
| Tools              | 300+         | >80% coverage |
| Specialist         | 100+         | >75% coverage |

### Quality Metrics

- **Price Accuracy**: <10% variance from real quotes
- **Data Freshness**: <3 months old
- **Supplier Anonymity**: 100% anonymized in customer-facing quotes
- **API Performance**: <100ms average response time
- **Coverage Confidence**: >80% confidence score on common items

---

## Risk Mitigation

### Data Collection Risks

- **Supplier Cooperation**: Have backup sources for each category
- **PDF Quality**: Manual validation for critical items
- **Legal Compliance**: Only use publicly available pricing
- **Data Staleness**: Quarterly refresh schedule

### Technical Risks

- **Database Performance**: Implement proper indexing and caching
- **API Load**: Design for concurrent users from day 1
- **Data Quality**: Automated validation and outlier detection
- **Integration Complexity**: Phased rollout with testing

## Team Allocation

- **Data Collection**: 2 people for outreach and PDF gathering
- **Data Processing**: 1 person for Gemini API and validation
- **Database/Backend**: 1 person for schema and API development
- **Testing/QA**: 1 person for validation and quality assurance
