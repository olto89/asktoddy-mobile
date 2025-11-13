# Bootstrap Pricing Strategy - Get Paying Customers First

## The Problem

The current system provides **60-70% accuracy** but we need **80%+ accuracy** to get paying customers. However, we can't invest £75,000 without revenue and customers.

## Solution: Quick Wins Strategy (£0-500 cost)

### Phase 0: Pre-Revenue Quick Fixes (0-2 weeks, £0 cost)

#### 1. Regional Price Multipliers

Use **free government data** to improve accuracy by 10-15%:

```typescript
const REGIONAL_MULTIPLIERS = {
  London: 1.35,
  Cambridge: 1.15,
  Manchester: 0.95,
  Birmingham: 0.9,
  Newcastle: 0.85,
};
```

**Data Sources (Free):**

- ONS House Price Index
- BCIS Regional Indices
- Government Construction Statistics

#### 2. Seasonal Adjustments

Simple **demand-based pricing** (no APIs needed):

```typescript
const getSeasonalMultiplier = (month: number) => {
  // Spring/Summer building boom
  if (month >= 3 && month <= 8) return 1.1;
  // Winter slower period
  if (month >= 11 || month <= 2) return 0.95;
  return 1.0; // Autumn normal
};
```

#### 3. Project Size Scaling

**Bulk discount logic** based on construction economics:

```typescript
const getSizeMultiplier = (floorArea: number) => {
  if (floorArea > 50) return 0.92; // Economies of scale
  if (floorArea > 25) return 0.96;
  if (floorArea < 10) return 1.08; // Small job premium
  return 1.0;
};
```

**Expected Improvement: 60% → 75% accuracy**

### Phase 1: Basic Customer Validation (2-4 weeks, £200 cost)

#### 1. Manual Quote Collection

**Crowdsource real quotes** from early users:

```typescript
// Simple feedback system
interface QuoteFeedback {
  projectDescription: string;
  ourEstimate: number;
  actualQuote: number;
  contractor: string;
  location: string;
}
```

**Implementation:**

- Add "Got a quote?" button after estimates
- £10 credit for each quote submitted
- Manual validation of submissions
- Update pricing weekly based on data

**Cost: £10 × 20 quotes = £200**

#### 2. Confidence Indicators

**Be transparent** about pricing uncertainty:

```typescript
interface PriceConfidence {
  level: 'Rough Estimate' | 'Good Estimate' | 'Accurate Quote';
  range: 'Wide (±30%)' | 'Moderate (±20%)' | 'Narrow (±10%)';
  recommendation: string;
}
```

**UI Changes:**

- "This is a rough estimate - get 3 professional quotes"
- "Based on 5 similar projects in your area"
- Color coding: Red (rough) → Amber (good) → Green (accurate)

#### 3. Local Price Learning

**Focus on specific regions** first:

- Start with Cambridge/London only
- Collect 50 quotes in each area
- Build local price profiles
- Expand to other regions gradually

**Expected Improvement: 75% → 80% accuracy**

### Phase 2: Revenue-First Improvements (1-3 months, £500 cost)

#### 1. Contractor Partnership (Revenue Positive)

**Turn pricing into a lead generation tool:**

```typescript
interface ContractorLead {
  projectEstimate: number;
  customerContact: string;
  projectDetails: string;
  urgency: 'low' | 'medium' | 'high';
}
```

**Business Model:**

- Charge contractors £25 per qualified lead
- Only send leads for projects >£5,000
- Track conversion rates
- **Revenue: £25 × 10 leads/month = £250/month**

#### 2. Premium Accuracy Service

**Tiered pricing model:**

- **Free**: Basic estimates (current accuracy)
- **Premium £9.99/month**:
  - Regional adjustments
  - Seasonal pricing
  - 3 detailed quotes/month
  - Contractor recommendations

#### 3. Community Pricing

**User-generated price database:**

- Users submit completed project costs
- Gamify with points/badges
- Build regional price profiles organically
- **Cost: Development time only**

**Expected Improvement: 80% → 85% accuracy**

## Business Model Validation

### Customer Acquisition Strategy

#### Target Customers (Pay £10-50/month)

1. **DIY Homeowners** planning extensions
2. **Property Developers** doing quick feasibility
3. **Small Builders** pricing jobs quickly
4. **Estate Agents** advising on renovation potential

#### Value Proposition Testing

- "Get accurate building costs in 30 seconds"
- "Save £500 on architect fees for initial estimates"
- "Know if your project budget is realistic before committing"

### Minimum Viable Revenue

**Target: £1,000/month revenue**

- 100 premium users × £10/month = £1,000
- OR 40 contractor leads × £25 = £1,000
- OR Mix: 50 premium + 20 leads = £500 + £500

**Customer Validation Metrics:**

- 10%+ conversion from free to premium
- 20%+ monthly retention rate
- Net Promoter Score >7

## Implementation Roadmap

### Week 1-2: Quick Accuracy Wins

- [x] Regional multipliers (government data)
- [x] Seasonal adjustments
- [x] Project size scaling
- [ ] Deploy updated pricing algorithm

### Week 3-4: Customer Feedback Loop

- [ ] Add quote collection UI
- [ ] Implement confidence scoring
- [ ] Set up manual validation process
- [ ] Launch with 20 beta users

### Month 2: Revenue Testing

- [ ] Build contractor lead system
- [ ] Test premium subscription model
- [ ] Launch in Cambridge market only
- [ ] Aim for first £100 revenue

### Month 3: Scale What Works

- [ ] Double down on working revenue streams
- [ ] Expand to London if Cambridge works
- [ ] Optimize conversion funnel
- [ ] Target £1,000/month revenue

## Risk Mitigation

### If Accuracy Doesn't Improve Enough

- **Pivot to comparison tool**: "Get 3 quotes from vetted contractors"
- **Focus on speed**: "Instant ballpark pricing in 30 seconds"
- **Emphasize transparency**: "Honest range pricing with confidence levels"

### If Customers Don't Pay

- **Freemium model**: Basic estimates free, detailed reports paid
- **Lead generation**: Free for users, revenue from contractors
- **B2B pivot**: Sell to estate agents/property developers

### If Regional Data Insufficient

- **User-generated**: Crowdsource pricing from community
- **Partnerships**: Team up with local builders for price data
- **Manual**: Research local suppliers for each major area

## Success Criteria for Investment

Once you achieve:

- **£1,000/month recurring revenue**
- **100+ paying customers**
- **20%+ monthly growth**

Then you can confidently approach investors for the £75,000 to build the advanced ML system outlined in the original strategy.

## Next Steps

1. **Week 1**: Deploy regional/seasonal adjustments
2. **Week 2**: Add quote collection feature
3. **Week 3**: Launch beta with 10 users
4. **Week 4**: Iterate based on feedback
5. **Month 2**: Test revenue models

**Total Bootstrap Investment: £500 maximum**
**Revenue Target: £1,000/month before seeking investment**
