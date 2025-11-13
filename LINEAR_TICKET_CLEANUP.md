# Linear Ticket Cleanup & New Roadmap

## 🧹 **Tickets to CLOSE/REMOVE**

### **Legacy Tickets (No Longer Relevant)**

- **[MOBILE-103] Integrate multi-modal input system** - ✅ DONE (working middleware)
- **[API-006] Add authentication and rate limiting** - Defer to later phase
- **ChatGPT-style Authentication Flow** - Defer to later phase
- **AI Learning System** - Defer to later phase (post-launch)

### **Completed Tickets to Mark DONE**

- **🔌 Set up Supabase Edge Functions API** - ✅ COMPLETED
- **📦 Create monorepo structure** - ✅ COMPLETED
- **🏗️ Set up React Native project** - ✅ COMPLETED
- **🔗 Connect mobile app to middleware API** - ✅ COMPLETED
- **💬 Implement chat interface** - ✅ COMPLETED
- **📊 Create analysis results screen** - ✅ COMPLETED

---

## 🎯 **NEW ROADMAP TICKETS**

### **EPIC 1: Comprehensive Pricing Engine (Priority 1)**

#### **ASK-101: Build Pricing Enhancement Pipeline**

**Priority**: Urgent | **Estimate**: 8h

```
Build additive pricing enhancement pipeline that connects your existing 704+ pricing database to the AI middleware.

Core Features:
- [ ] Create PricingEnhancer class with graceful degradation
- [ ] Connect to existing get-pricing Edge Function
- [ ] Implement material price matching logic
- [ ] Add regional multipliers (London +35%, etc.)
- [ ] Test with your existing scrapers data

Technical Requirements:
- Additive enhancement pattern (never breaks base analysis)
- Integration with existing pricing database
- Real-time market data from scrapers
- Regional variation support

Success Criteria:
- Base analysis always works
- Enhanced analysis shows real supplier prices
- Regional adjustments applied correctly
```

#### **ASK-102: Advanced Material Classification**

**Priority**: High | **Estimate**: 6h

```
Enhance AI to extract specific materials from user descriptions and match to your pricing database.

Features:
- [ ] Material extraction from natural language
- [ ] Smart categorization (structural/finishing/electrical)
- [ ] Price matching with alternatives
- [ ] Quality grade recommendations (budget/standard/premium)

Integration:
- Use your BuyMaterials, PlumbBuild scraper data
- Connect to existing material categories
- Support 300+ materials from database
```

#### **ASK-103: Labour Rate Integration**

**Priority**: High | **Estimate**: 4h

```
Connect AI analysis to your labour rate database with regional variations.

Features:
- [ ] Trade-specific rate application
- [ ] Regional multipliers by location
- [ ] Experience level adjustments
- [ ] Seasonal demand factors

Data Source:
- Your existing labour rates database
- Regional variations already captured
```

#### **ASK-104: Tool Hire Recommendations**

**Priority**: Medium | **Estimate**: 4h

```
Integrate tool hire pricing and recommendations using your existing data.

Features:
- [ ] Tool requirement extraction
- [ ] HSS Hire integration (from scrapers)
- [ ] Daily/weekly rate calculations
- [ ] Alternative tool suggestions
- [ ] Delivery cost integration
```

#### **ASK-105: Waste & Aggregates Pricing**

**Priority**: Medium | **Estimate**: 3h

```
Add waste disposal and aggregates pricing from your existing scrapers.

Features:
- [ ] Skip hire by region with permits
- [ ] Concrete delivery pricing
- [ ] Environmental disposal fees
- [ ] Bulk order optimizations
```

---

### **EPIC 2: 3-Comment Quote Refinement (Priority 2)**

#### **ASK-201: Comment Processing Engine**

**Priority**: High | **Estimate**: 6h

```
Build intelligent comment processing that understands user refinement requests.

Features:
- [ ] Natural language processing for quote changes
- [ ] Smart categorization (cost/timeline/materials/scope)
- [ ] Adjustment calculation logic
- [ ] Question generation for clarification

Example Comments:
- "Make it cheaper" → Budget alternatives + extended timeline
- "Premium kitchen" → Upgrade kitchen materials + specialist trades
- "Perfect!" → Finalize quote
```

#### **ASK-202: Interactive Quote Adjustment**

**Priority**: High | **Estimate**: 5h

```
Build UI for showing quote adjustments and asking clarifying questions.

Features:
- [ ] Before/after quote comparison
- [ ] Adjustment explanation with reasoning
- [ ] Interactive question prompts
- [ ] 3-comment progress tracking
```

#### **ASK-203: Quote Finalization System**

**Priority**: Medium | **Estimate**: 4h

```
Convert refined quotes into final project specifications.

Features:
- [ ] Final quote generation
- [ ] Project specification document
- [ ] Contractor matching suggestions
- [ ] Timeline confirmation
```

---

### **EPIC 3: Advanced Document Analysis (Priority 3)**

#### **ASK-301: Enhanced Image Analysis**

**Priority**: High | **Estimate**: 6h

```
Upgrade Gemini provider to handle construction photos, floor plans, and technical drawings.

Features:
- [ ] Document type detection (photo/plan/technical)
- [ ] Measurement extraction from floor plans
- [ ] Material identification from photos
- [ ] Damage assessment capabilities
- [ ] Scale interpretation for technical drawings
```

#### **ASK-302: Multi-Modal AI Prompts**

**Priority**: Medium | **Estimate**: 4h

```
Create specialized prompts for different document types.

Features:
- [ ] Floor plan analysis prompts
- [ ] Construction photo assessment
- [ ] Technical drawing interpretation
- [ ] Measurement accuracy validation
```

#### **ASK-303: Document Preprocessing**

**Priority**: Medium | **Estimate**: 5h

```
Add image preprocessing for better AI analysis.

Features:
- [ ] Image orientation correction
- [ ] Quality enhancement
- [ ] Scale detection and normalization
- [ ] OCR for text extraction from drawings
```

---

### **EPIC 4: Performance & Polish (Priority 4)**

#### **ASK-401: Response Time Optimization**

**Priority**: High | **Estimate**: 3h

```
Optimize middleware performance for <2s responses consistently.

Features:
- [ ] Prompt optimization for speed
- [ ] Caching for pricing data
- [ ] Concurrent processing where possible
- [ ] Response streaming for better UX
```

#### **ASK-402: Input Clearing Bug Fix**

**Priority**: Medium | **Estimate**: 2h

```
Fix text input clearing behavior in chat interface.

Features:
- [ ] Reliable input clearing after send
- [ ] Loading state management
- [ ] Error state handling
```

#### **ASK-403: Enhanced Error Handling**

**Priority**: Medium | **Estimate**: 3h

```
Improve error handling and user feedback throughout the system.

Features:
- [ ] Detailed error messages
- [ ] Retry mechanisms
- [ ] Graceful degradation messaging
- [ ] Performance monitoring
```

---

## 🚀 **IMMEDIATE PRIORITY ORDER**

### **Sprint 1 (This Week): Pricing Foundation**

1. ASK-101: Build Pricing Enhancement Pipeline ⭐
2. ASK-102: Advanced Material Classification
3. ASK-401: Response Time Optimization

### **Sprint 2 (Next Week): Advanced Pricing**

1. ASK-103: Labour Rate Integration
2. ASK-104: Tool Hire Recommendations
3. ASK-105: Waste & Aggregates Pricing

### **Sprint 3: Document Analysis**

1. ASK-301: Enhanced Image Analysis
2. ASK-302: Multi-Modal AI Prompts

### **Sprint 4: Quote Refinement**

1. ASK-201: Comment Processing Engine
2. ASK-202: Interactive Quote Adjustment

---

## 📋 **TICKET CREATION COMMANDS**

Would you like me to:

1. **Create these new tickets in Linear** using the API
2. **Close/update existing tickets** to reflect current state
3. **Set up the sprint planning** with proper priorities

The new ticket structure focuses on your key differentiators:

- ✅ Leverages your existing pricing assets (704+ items)
- ✅ Builds USP features (3-comment refinement)
- ✅ Maintains stable foundation (middleware working)
- ✅ Clear priority order for maximum impact

Ready to execute this ticket plan?
