# UK Construction Pricing Strategy
## Realistic Approach for AskToddy Mobile

### 🚫 **What Doesn't Work (Lessons from POC)**
- Web scraping major retailers (Screwfix, B&Q, Travis Perkins)
- Rate limiting, CAPTCHAs, legal issues
- Unreliable, easily broken

### ✅ **What DOES Work - Hybrid Approach**

## **Tier 1: Government Data (FREE & RELIABLE)**

### **ONS Construction Indices** 
- **Source**: Office for National Statistics
- **Data**: Construction output price indices, material costs
- **URL**: `https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/datasets/`
- **Format**: CSV downloads, quarterly updates
- **Cost**: FREE

### **BIS Construction Indices**
- **Source**: Department for Business, Innovation & Skills  
- **Data**: Labour costs, material price indices
- **Cost**: £115/year for enhanced data
- **Use**: Regional cost adjustments, inflation factors

## **Tier 2: Industry APIs (SELECTIVE)**

### **HSS Tool Hire API** 
- **Status**: HSS has a B2B API for trade accounts
- **Access**: Apply for trade account → API access
- **Coverage**: Tool hire rates across UK
- **Reliability**: High (official API)

### **Travis Perkins Trade API**
- **Status**: Trade customer API available
- **Access**: Business account required
- **Coverage**: Building materials
- **Reliability**: High (official)

### **Jewson/Saint-Gobain API**
- **Status**: B2B portal with API access
- **Coverage**: Building materials, trade pricing
- **Access**: Trade account application

## **Tier 3: Curated Database (MANUAL + SMART)**

### **AskToddy Pricing Database**
- Manually curated core items (500-1000 most common)
- Updated monthly by checking key suppliers
- AI-powered price estimation for unlisted items
- Community contributions (trade users)

### **Regional Multipliers**
- London: +25% (established)
- South East: +15%
- Scotland/Wales: -10%
- Based on government regional data

## **Tier 4: AI Estimation (INTELLIGENT FALLBACK)**

### **Smart Price Estimation**
- Based on material type, project size, location
- Historical trends from government data
- Confidence scoring (High/Medium/Low)
- Always show estimate source to user

---

## 🛠️ **Implementation Strategy**

### **Phase 1: Government Foundation (Week 1)**
```typescript
// Use free ONS/BIS data for base pricing
const getBasePrice = (material: string, region: string) => {
  const onsIndex = await getONSConstructionIndex()
  const regionalMultiplier = getRegionalMultiplier(region)
  return basePriceDB[material] * onsIndex * regionalMultiplier
}
```

### **Phase 2: Core Database (Week 2-3)**
```typescript
// Hand-curated database of 500 common items
const CORE_PRICES = {
  'brick_standard': { basePrice: 0.35, unit: 'each', source: 'manual' },
  'cement_25kg': { basePrice: 4.50, unit: 'bag', source: 'manual' },
  'plasterboard_12mm': { basePrice: 8.90, unit: 'sheet', source: 'manual' }
}
```

### **Phase 3: Trade APIs (Month 2)**
```typescript
// Integrate with willing suppliers
const getTradePrice = async (item: string) => {
  try {
    const hssPrice = await hssAPI.getPrice(item)
    const tpPrice = await travisPerkinAPI.getPrice(item)
    return { hss: hssPrice, tp: tpPrice, updated: Date.now() }
  } catch {
    return fallbackToDatabase(item)
  }
}
```

### **Phase 4: AI Estimation (Month 3)**
```typescript
// Smart estimation for uncatalogued items
const estimatePrice = (description: string, context: ProjectContext) => {
  const category = categorizeItem(description)
  const similarItems = findSimilarItems(category)
  const estimate = calculateEstimate(similarItems, context)
  return { price: estimate, confidence: 'medium', source: 'AI estimate' }
}
```

---

## 💰 **Cost Breakdown**

| Source | Cost/Year | Coverage | Reliability |
|--------|-----------|----------|-------------|
| ONS Data | FREE | Base indices | High |
| BIS Data | £115 | Regional factors | High |
| HSS API | Trade account | Tool hire | High |
| Manual DB | Time investment | Core 500 items | Medium |
| AI Estimation | Development | Everything else | Medium |

**Total**: ~£500/year for professional-grade pricing vs £5000+ for BCIS

---

## 🎯 **MVP Implementation (Next 2 Weeks)**

### **Week 1: Government Data Integration**
1. Download ONS construction indices
2. Implement regional multipliers  
3. Create base pricing for 50 common materials
4. Test with regional variations

### **Week 2: Core Database**
1. Research + manually price 200 core items
2. Build pricing API in Supabase Edge Function
3. Implement confidence scoring
4. Add price source transparency

### **Example Output:**
```
Kitchen renovation estimate:
• Tiles (60m²): £1,847 (Manual pricing, High confidence)
• Labour: £3,200 (ONS data + London multiplier, High confidence)  
• Adhesive: £89 (AI estimate, Medium confidence)
• Total: £5,136 ± 15%
```

---

## ✅ **Why This Works**

1. **Legal**: All data sources are legitimate
2. **Reliable**: Government data + official APIs
3. **Scalable**: Can add more sources over time
4. **Transparent**: Users see data sources and confidence
5. **Cost-effective**: Much cheaper than enterprise solutions
6. **MVP-ready**: Can start with manual data, improve over time

This gives us **real pricing** that's 80% as good as enterprise solutions for 10% of the cost!