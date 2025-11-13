# AskToddy Mobile - Realistic Data Acquisition Strategy

## The Hard Truth: Major Retailers Are Unscrappable

### 🚫 **Why Screwfix/B&Q/Travis Perkins Won't Work**

- **Technical**: CAPTCHA, rate limiting, bot detection, JavaScript-heavy
- **Legal**: ToS violations, copyright issues, lawsuit risk
- **Business**: IP blocks, permanent bans, reputational damage

### ✅ **What's Actually Achievable**

## Tier 1: Scrapeable Targets (Immediate - Week 1)

### **Small Independent Suppliers**

```
✅ LocalBuildersSupplies.co.uk (basic HTML sites)
✅ Independent timber merchants (often WordPress)
✅ Specialist roofing suppliers (simple catalogs)
✅ Regional tool hire companies (basic price lists)
✅ Aggregate quarries (often display bulk pricing)

Accuracy: 70-80% for niche items
Coverage: 200+ specialist materials
Legal Risk: Low (basic sites, minimal protection)
```

### **Online Building Material Aggregators**

```
✅ BuildingMaterials.co.uk (marketplace model)
✅ MaterialsMarket.co.uk (price comparison)
✅ TradeMaterials.com (trade-focused)
✅ OnlineBuildingPlastics.co.uk (specialist)

Accuracy: 75-85% (competitive pricing)
Coverage: 500+ items across categories
Legal Risk: Medium (check ToS case by case)
```

## Tier 2: Partnership Opportunities (Month 2)

### **Suppliers Seeking Digital Presence**

```
💡 Regional builder's merchants (want online visibility)
💡 Specialist suppliers (electrical, plumbing wholesalers)
💡 Tool hire independents (competing with HSS)
💡 Waste management (skip hire, disposal)
💡 Delivery/logistics companies
```

### **Data Exchange Models**

```typescript
// Revenue sharing with suppliers
interface PartnershipModel {
  dataAccess: 'real-time pricing feed';
  compensation: 'referral fees' | 'subscription' | 'lead generation';
  mutual_benefit: 'supplier gets customers, we get data';
}
```

## Tier 3: Public/Semi-Public Data (Immediate)

### **Government & Industry Sources**

```
✅ ONS Construction Cost Indices (free, reliable)
✅ Local authority tender databases (public record)
✅ Planning application cost estimates (public)
✅ Industry association rate cards (often public)
✅ Manufacturer MSRPs (publicly available)
✅ BCIS sample data (limited but free)
```

### **Trade Publications & Catalogs**

```
✅ PDF price lists (many available publicly)
✅ Trade magazine price surveys
✅ Construction industry reports
✅ Supplier catalog scraping (with permission)
✅ Trade show materials (pricing guides)
```

## Implementation Plan: Realistic 80% Accuracy

### **Phase 1: Foundation Data (2 weeks)**

```
Sources:
1. Small independent suppliers (5-10 targets)
2. Government construction indices
3. Existing trade catalog PDFs
4. Online aggregators (legal scraping)

Expected Results:
- 300+ core materials with pricing
- 70-75% accuracy for foundation estimates
- Regional variations for major materials
- Legal compliance and sustainable sourcing
```

### **Phase 2: Partnership Development (Month 2)**

```
Outreach to:
1. 50+ regional builder's merchants
2. Specialist trade suppliers
3. Independent tool hire companies
4. Material delivery services

Partnership Models:
- Data for lead generation
- Referral fee arrangements
- Joint marketing opportunities
- White-label supplier directory
```

### **Phase 3: Advanced Intelligence (Month 3)**

```
Build:
1. Price validation algorithms
2. Seasonal trend analysis
3. Regional variation models
4. Supplier reliability scoring
5. User feedback integration
```

## Legal & Ethical Framework

### **✅ Safe Scraping Practices**

```
1. Check robots.txt compliance
2. Respect rate limits (1 request/5 seconds)
3. Use residential proxies (avoid detection)
4. Implement polite crawling patterns
5. Monitor for access restrictions
6. Have legal review for each target
```

### **🤝 Partnership Approach**

```
Email Template:
"We're building AskToddy, a UK construction estimating app.
We'd like to feature your pricing to drive customers to your business.
Revenue sharing model available. Interested in discussing?"

Win-Win: Suppliers get customers, we get data
```

## Expected Accuracy Results

### **With Realistic Strategy**

| Data Source        | Accuracy   | Coverage        | Legal Risk |
| ------------------ | ---------- | --------------- | ---------- |
| Small suppliers    | 75-80%     | 200 items       | Low        |
| Gov/industry data  | 85-90%     | Indices only    | None       |
| Trade catalogs     | 80-85%     | 300+ items      | Low        |
| Partnership data   | 90-95%     | 500+ items      | None       |
| **Combined Total** | **80-85%** | **1000+ items** | **Low**    |

### **vs Current State**

- Current: 70% accuracy (stale data)
- Realistic: 80-85% accuracy (fresh, diverse sources)
- Timeline: 2-3 months to full implementation
- Cost: £2-5k/month (vs BCIS enterprise pricing)

## Backup Strategy: If Scraping Fails

### **Manual Data Collection Network**

```
1. Partner with quantity surveyors
2. Crowdsource from contractors
3. Trade association partnerships
4. User-generated pricing feedback
5. Regional pricing surveys
```

### **Hybrid Static-Dynamic Model**

```typescript
interface PricingStrategy {
  static_baseline: 'Government indices + trade catalogs';
  dynamic_updates: 'Small supplier scraping + partnerships';
  validation: 'User feedback + QS partnerships';
  refresh_cycle: 'Weekly for core, monthly for specialty';
}
```

## Next Steps

### **Week 1: Feasibility Testing**

1. Test 5 small supplier websites for scrapability
2. Legal review of target site Terms of Service
3. Set up partnership outreach templates
4. Implement government data integration

### **Week 2: MVP Data Collection**

1. Deploy ethical scraping for validated targets
2. Process existing trade catalog PDFs
3. Launch partnership outreach campaign
4. Integrate ONS construction indices

### **Month 2: Scale & Validate**

1. Expand to 20+ ethical scraping targets
2. Close 3-5 supplier partnerships
3. Implement price validation algorithms
4. Launch user feedback system

## Conclusion

**80-85% accuracy IS achievable** without risking lawsuits from major retailers. The key is focusing on:

- ✅ Willing partners who benefit from exposure
- ✅ Public/semi-public data sources
- ✅ Small suppliers without fortress-level protection
- ✅ Ethical, sustainable scraping practices

This approach builds a credible pricing foundation while avoiding legal risks and creating win-win partnerships with suppliers.
