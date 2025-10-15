# API-First Roadmap: Prevent Frontend Technical Debt

## 🎯 **Core Principle: Business Logic ONLY in Middleware**

### ❌ **What We Must Avoid:**
```typescript
// WRONG: Business logic in mobile app
const analysis = await geminiProvider.analyzeImage(imageUri)
const pricing = await pricingService.getCurrentRates()
const enhanced = await enhanceWithPricing(analysis, pricing)
```

### ✅ **What We Must Build:**
```typescript  
// RIGHT: Thin client calling middleware
const { data } = await supabase.functions.invoke('analyze-construction', {
  body: { imageUri, context }
})
```

---

## 📋 **Phase 1: Supabase Edge Functions (Week 1)**

### **[API-001] Set up Supabase Edge Functions infrastructure**
**Priority:** Critical | **Estimate:** 2 points | **Day:** 1

**Objective:** Initialize Supabase functions structure for all business logic

**Acceptance Criteria:**
- [ ] `supabase/functions/analyze-construction/` directory structure
- [ ] `supabase/functions/get-pricing/` for pricing services
- [ ] `supabase/functions/generate-document/` for PDF generation
- [ ] TypeScript configuration for Deno
- [ ] Environment variables setup
- [ ] Local development server running

**Commands:**
```bash
supabase functions new analyze-construction
supabase functions new get-pricing  
supabase functions new generate-document
supabase functions serve --debug
```

---

### **[API-002] Migrate AIMiddleware to Edge Function**
**Priority:** Critical | **Estimate:** 5 points | **Day:** 1-2

**Objective:** Move ALL AI logic from mobile to Supabase

**Acceptance Criteria:**
- [ ] Copy `src/services/ai/AIMiddleware.ts` to Edge Function
- [ ] Convert React Native imports to Deno/Web APIs
- [ ] Provider management (Gemini + OpenAI + Mock)
- [ ] Timeout handling and error management
- [ ] Health check endpoints
- [ ] Request/response validation

**Edge Function Structure:**
```typescript
// supabase/functions/analyze-construction/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { AIMiddleware } from './middleware.ts'
import { GeminiProvider } from './providers/gemini.ts'
import { OpenAIProvider } from './providers/openai.ts'

serve(async (req) => {
  // Authentication check
  // Rate limiting  
  // Business logic execution
  // Response formatting
})
```

**Files to Migrate:**
- `AIMiddleware.ts` → `analyze-construction/middleware.ts`
- `GeminiProvider.ts` → `analyze-construction/providers/gemini.ts`
- `PricingService.ts` → `get-pricing/pricing-service.ts`

---

### **[API-003] Create comprehensive UK pricing Edge Function**
**Priority:** Critical | **Estimate:** 8 points | **Day:** 2-3

**Objective:** Build ALL UK construction pricing services in middleware

**Acceptance Criteria:**
- [ ] **ToolHireService**: HSS, Speedy hire rates scraping
- [ ] **MaterialsService**: Screwfix, B&Q, Travis Perkins pricing
- [ ] **AggregateService**: Sand, gravel, concrete supplier rates
- [ ] **LabourService**: UK trade rates by region (ONS data)
- [ ] **BuildingRegsService**: UK building regulations context
- [ ] Real-time data scraping where possible
- [ ] Cached pricing with Redis/Supabase storage
- [ ] Regional multipliers (London +25%, etc.)

**Edge Function:**
```typescript
// supabase/functions/get-pricing/index.ts
export interface PricingRequest {
  location: string
  projectType: string
  materials?: string[]
  tools?: string[]
}

export interface PricingResponse {
  toolHire: ToolHireRate[]
  materials: MaterialPrice[]
  aggregates: AggregateRate[]
  labour: LabourRate[]
  contextFactors: RegionalFactors
}
```

**Data Sources:**
- **HSS Hire**: Daily scraping of rates
- **Speedy Hire**: API if available, scraping fallback
- **ONS Construction**: Government labour statistics
- **BCIS**: Building cost information service
- **Local suppliers**: Regional rate variations

---

### **[API-004] Add OpenAI provider to middleware**
**Priority:** High | **Estimate:** 3 points | **Day:** 3

**Objective:** Support provider switching (Gemini ↔ OpenAI) in API only

**Acceptance Criteria:**
- [ ] OpenAIProvider using GPT-4 Vision for image analysis
- [ ] GPT-4 text completion for text-only queries
- [ ] Cost tracking and token usage monitoring
- [ ] Provider selection via request parameter
- [ ] Fallback logic: OpenAI → Gemini → Mock
- [ ] Performance comparison logging

**Implementation:**
```typescript
// analyze-construction/providers/openai.ts
export class OpenAIProvider implements AIProvider {
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // GPT-4 Vision API call
    // Same prompt engineering as Gemini
    // Parse to standardized ProjectAnalysis format
  }
}
```

---

### **[API-005] Implement document generation service**
**Priority:** High | **Estimate:** 5 points | **Day:** 4

**Objective:** Generate PDF quotes, project plans, task lists in middleware

**Acceptance Criteria:**
- [ ] PDF quote generation with AskToddy branding
- [ ] Project timeline/plan generation (Gantt-style)
- [ ] Task list generation with dependencies
- [ ] Professional template design
- [ ] Logo and branding integration
- [ ] Email sharing capability
- [ ] Mobile-optimized download flow

**Templates:**
```typescript
interface DocumentRequest {
  type: 'quote' | 'timeline' | 'tasklist'
  projectType: string
  analysis: ProjectAnalysis
  pricing: PricingResponse
}
```

---

### **[API-006] Add authentication and rate limiting**
**Priority:** High | **Estimate:** 3 points | **Day:** 4-5

**Objective:** Secure APIs with proper authentication and usage limits

**Acceptance Criteria:**
- [ ] Supabase Auth integration with Edge Functions
- [ ] Rate limiting: 10 analyses/day free tier
- [ ] Usage tracking in database
- [ ] User quota management
- [ ] API key validation
- [ ] Request logging for analytics

**Database Schema:**
```sql
-- Usage tracking
CREATE TABLE user_usage (
  user_id UUID REFERENCES auth.users(id),
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis history
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  input_data JSONB,
  result JSONB,
  cost DECIMAL(10,4),
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 **Phase 2: Mobile App Refactor (Week 2)**

### **[MOBILE-101] Create thin client ChatScreen**
**Priority:** Critical | **Estimate:** 5 points | **Day:** 6

**Objective:** Build chat-first UI that ONLY calls APIs (no business logic)

**Acceptance Criteria:**
- [ ] ChatGPT-style message interface
- [ ] Message bubbles matching web app design
- [ ] AskToddy branding (orange/navy colors)
- [ ] Conversation history persistence
- [ ] Loading states and error handling
- [ ] No AI logic in frontend - API calls only

**Implementation:**
```typescript
// ChatScreen.tsx - THIN CLIENT ONLY
const handleSend = async () => {
  const { data, error } = await supabase.functions.invoke('analyze-construction', {
    body: { message: input, imageUri, history }
  })
  // Display response - NO business logic
}
```

---

### **[MOBILE-102] Extract camera logic to hooks**
**Priority:** High | **Estimate:** 2 points | **Day:** 6

**Objective:** Reuse camera functionality in chat interface

**Acceptance Criteria:**
- [ ] `useCameraCapture` hook for photo capture
- [ ] `useGalleryPicker` hook for image selection
- [ ] `useFileUpload` hook for PDF/video handling
- [ ] Permission handling in hooks
- [ ] File validation and compression
- [ ] ChatGPT-style camera integration (button in chat input)

**Hooks:**
```typescript
export const useCameraCapture = () => {
  const capturePhoto = async () => {
    // Reuse existing camera logic
    // Return URI only - no analysis
  }
  return { capturePhoto, isLoading, error }
}
```

---

### **[MOBILE-103] Integrate multi-modal input**
**Priority:** High | **Estimate:** 3 points | **Day:** 7

**Objective:** Support text + photos + videos + PDFs in chat

**Acceptance Criteria:**
- [ ] Text input with auto-resize
- [ ] Photo attachment with preview
- [ ] Video recording and attachment
- [ ] PDF upload and preview
- [ ] Multiple file selection (up to 4)
- [ ] File type validation
- [ ] Upload progress indicators

---

### **[MOBILE-104] Add document download integration**
**Priority:** Medium | **Estimate:** 2 points | **Day:** 7

**Objective:** Download PDFs generated by middleware

**Acceptance Criteria:**
- [ ] Document buttons appear after analysis
- [ ] PDF quote download
- [ ] Project plan download
- [ ] Task list download
- [ ] Native sharing integration
- [ ] Download progress indicators

---

## 📋 **Phase 3: Testing & Polish (Week 3)**

### **[TEST-001] End-to-end API testing**
**Priority:** High | **Estimate:** 3 points | **Day:** 8

**Acceptance Criteria:**
- [ ] Edge Function unit tests
- [ ] API endpoint integration tests
- [ ] Performance testing (response times)
- [ ] Error handling validation
- [ ] Rate limiting verification

---

### **[TEST-002] Mobile app testing**
**Priority:** High | **Estimate:** 2 points | **Day:** 8-9

**Acceptance Criteria:**
- [ ] Chat interface functionality
- [ ] Multi-modal input testing
- [ ] Document generation flow
- [ ] Error handling scenarios
- [ ] Performance optimization

---

## 🎯 **Success Criteria**

### **Week 1 Completion:**
- [ ] All business logic removed from mobile app
- [ ] Working Supabase Edge Functions for all core features
- [ ] UK pricing services fully operational
- [ ] Document generation working
- [ ] API authentication and rate limiting active

### **Week 2 Completion:**
- [ ] Chat-first mobile app
- [ ] No business logic in frontend
- [ ] Multi-modal input working
- [ ] Document downloads functional
- [ ] Professional AskToddy design

### **Week 3 Completion:**
- [ ] Production-ready API
- [ ] Comprehensive testing
- [ ] Performance optimized
- [ ] Ready for user testing

---

## 📊 **Current vs Target Architecture**

### **BEFORE (Technical Debt):**
```
Mobile App (1100+ lines business logic)
├── AIMiddleware
├── GeminiProvider  
├── PricingService
├── Document generation
└── UK construction data
```

### **AFTER (Clean Architecture):**
```
Mobile App (Thin Client)
├── ChatScreen
├── API calls only
└── UI/UX logic only

Supabase Edge Functions (Business Logic)
├── /analyze-construction
├── /get-pricing
├── /generate-document
└── All AI and pricing logic
```

---

## 🚀 **Immediate Next Steps**

1. **Today**: Set up Supabase Edge Functions infrastructure
2. **Tomorrow**: Migrate AIMiddleware to Edge Functions
3. **Day 3**: Build comprehensive pricing services
4. **Day 4**: Add OpenAI provider and document generation
5. **Day 5**: Authentication and rate limiting
6. **Week 2**: Build thin client mobile app

**This approach ensures ZERO technical debt in the frontend!**