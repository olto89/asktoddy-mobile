# Linear Tickets: API-First Architecture

## 🏗️ **EPIC: Supabase Edge Functions Middleware**

### **[API-001] Set up Supabase Edge Functions infrastructure**
**Priority:** Urgent | **Estimate:** 2 points | **Labels:** backend, infrastructure

**Objective:** Initialize Supabase functions structure for all business logic

**Description:**
Set up the foundation for housing ALL business logic in Supabase Edge Functions to prevent frontend technical debt.

**Acceptance Criteria:**
- [ ] `supabase/functions/analyze-construction/` directory created
- [ ] `supabase/functions/get-pricing/` directory created  
- [ ] `supabase/functions/generate-document/` directory created
- [ ] TypeScript configuration for Deno environment
- [ ] Environment variables configured (GEMINI_API_KEY, OPENAI_API_KEY)
- [ ] Local development server running with `supabase functions serve`
- [ ] Basic "hello world" endpoints responding

**Technical Notes:**
```bash
# Commands to run:
supabase functions new analyze-construction
supabase functions new get-pricing
supabase functions new generate-document
```

**Definition of Done:**
- All three Edge Functions respond to basic requests
- TypeScript compilation working
- Environment variables accessible
- Local development workflow established

---

### **[API-002] Migrate AIMiddleware to analyze-construction Edge Function**
**Priority:** Urgent | **Estimate:** 5 points | **Labels:** backend, ai, migration

**Objective:** Move ALL AI logic from mobile app to Supabase Edge Function

**Description:**
Transfer the complete AIMiddleware system (455 lines) from mobile to server-side to eliminate technical debt and enable proper API-first architecture.

**Files to Migrate:**
- `src/services/ai/AIMiddleware.ts` → `supabase/functions/analyze-construction/middleware.ts`
- `src/services/ai/providers/GeminiProvider.ts` → `supabase/functions/analyze-construction/providers/gemini.ts`
- `src/services/ai/types.ts` → `supabase/functions/analyze-construction/types.ts`

**Acceptance Criteria:**
- [ ] AIMiddleware class working in Deno environment
- [ ] Provider registration system functional
- [ ] Gemini provider integrated with API key from environment
- [ ] Mock provider available for development
- [ ] Timeout handling (30 seconds)
- [ ] Error handling and fallback logic
- [ ] Health check endpoint: `GET /analyze-construction/health`
- [ ] Main analysis endpoint: `POST /analyze-construction`

**API Contract:**
```typescript
// Request
interface AnalysisRequest {
  imageUri?: string
  message?: string
  context?: {
    projectType?: string
    location?: string
    budgetRange?: { min: number; max: number }
  }
  history?: Message[]
}

// Response  
interface AnalysisResponse {
  projectType: string
  description: string
  costBreakdown: CostBreakdown
  timeline: Timeline
  recommendations: string[]
  confidence: number
  aiProvider: string
  processingTimeMs: number
}
```

**Testing:**
- Unit tests for middleware functions
- Integration test with real Gemini API
- Error handling scenarios
- Performance benchmarks

---

### **[API-003] Build comprehensive UK pricing Edge Function**
**Priority:** Urgent | **Estimate:** 8 points | **Labels:** backend, pricing, data

**Objective:** Create complete UK construction pricing services in middleware

**Description:**
Build comprehensive pricing intelligence covering all UK construction costs - tools, materials, aggregates, and labour - to provide accurate market-rate quotes.

**Services to Implement:**

#### **ToolHireService**
- [ ] HSS Hire rates scraping (daily updates)
- [ ] Speedy Hire rates (API or scraping)
- [ ] Local hire shop integration
- [ ] Tool category classification
- [ ] Regional availability checking

#### **MaterialsService**
- [ ] Screwfix pricing integration
- [ ] B&Q rates (scraping)
- [ ] Travis Perkins trade prices
- [ ] Material category mapping
- [ ] Bulk pricing calculations

#### **AggregateService**
- [ ] Sand and gravel supplier rates
- [ ] Concrete pricing by mix type
- [ ] Delivery cost calculations
- [ ] Regional supplier networks
- [ ] Volume discount structures

#### **LabourService**
- [ ] ONS construction wage data integration
- [ ] Regional multipliers (London +25%, etc.)
- [ ] Trade-specific rates (carpenter, electrician, etc.)
- [ ] Skill level variations
- [ ] Seasonal demand adjustments

**Technical Implementation:**
```typescript
// API Endpoint: POST /get-pricing
interface PricingRequest {
  location: string
  projectType: string
  materials?: string[]
  tools?: string[]
  timeline?: string
}

interface PricingResponse {
  toolHire: ToolHireRate[]
  materials: MaterialPrice[]
  aggregates: AggregateRate[]
  labour: LabourRate[]
  contextFactors: {
    regionMultiplier: number
    seasonalMultiplier: number
    demandIndex: number
  }
  recommendations: PricingRecommendation[]
  lastUpdated: string
}
```

**Data Sources:**
- HSS Hire API/scraping
- Screwfix product API
- ONS construction statistics
- BCIS building cost data
- Regional supplier databases

**Caching Strategy:**
- Redis/Supabase cache with 4-hour TTL
- Daily batch updates for stable pricing
- Real-time updates for volatile items
- Regional cache segmentation

---

### **[API-004] Add OpenAI provider for LLM switching**
**Priority:** High | **Estimate:** 3 points | **Labels:** backend, ai, openai

**Objective:** Enable provider switching (Gemini ↔ OpenAI) for best results

**Description:**
Add OpenAI GPT-4 Vision as an alternative AI provider to compare results and choose the best performing model for different construction scenarios.

**Acceptance Criteria:**
- [ ] OpenAIProvider class implementing AIProvider interface
- [ ] GPT-4 Vision integration for image analysis
- [ ] GPT-4 text completion for text-only queries
- [ ] Token usage tracking and cost calculation
- [ ] Provider selection via request parameter
- [ ] Performance comparison logging
- [ ] Fallback chain: Primary → Secondary → Mock

**Provider Configuration:**
```typescript
interface ProviderConfig {
  primary: 'gemini' | 'openai'
  fallback: ('gemini' | 'openai' | 'mock')[]
  models: {
    gemini: 'gemini-2.0-flash-exp' | 'gemini-pro-vision'
    openai: 'gpt-4-vision-preview' | 'gpt-4o'
  }
}
```

**Cost Tracking:**
```typescript
interface UsageMetrics {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  responseTime: number
  timestamp: string
}
```

**A/B Testing Support:**
- Route 50% of requests to each provider
- Compare accuracy, speed, cost
- Log results for analysis
- Configurable routing rules

---

### **[API-005] Implement document generation Edge Function**
**Priority:** High | **Estimate:** 5 points | **Labels:** backend, documents, pdf

**Objective:** Generate professional PDF quotes, project plans, and task lists

**Description:**
Create document generation service that produces professional, branded PDF documents from analysis results.

**Document Types:**

#### **PDF Quote Generation**
- [ ] Detailed cost breakdown with line items
- [ ] AskToddy branding and logo
- [ ] VAT calculations and totals
- [ ] Terms and conditions
- [ ] Contact information
- [ ] Professional formatting

#### **Project Plan Timeline**
- [ ] Gantt-style visual timeline
- [ ] Phase breakdown with dependencies
- [ ] Resource allocation
- [ ] Milestone markers
- [ ] Critical path highlighting
- [ ] Risk assessments

#### **Task List Generation**  
- [ ] Categorized task breakdown
- [ ] Dependencies and prerequisites
- [ ] Estimated durations
- [ ] Skills required
- [ ] Tools and materials needed
- [ ] Safety considerations

**API Contract:**
```typescript
// POST /generate-document
interface DocumentRequest {
  type: 'quote' | 'timeline' | 'tasklist'
  projectType: string
  analysis: ProjectAnalysis
  pricing: PricingResponse
  userDetails?: {
    name: string
    email: string
    address: string
  }
}

// Response: PDF blob with proper headers
Content-Type: application/pdf
Content-Disposition: attachment; filename="project-quote-20250115.pdf"
```

**Templates:**
- Professional AskToddy branding
- Consistent typography and colors
- Mobile-optimized layouts
- Print-friendly formatting

**Technical Stack:**
- Puppeteer for PDF generation
- HTML/CSS templates
- Dynamic data injection
- Asset management (logos, fonts)

---

### **[API-006] Add authentication and rate limiting**
**Priority:** High | **Estimate:** 3 points | **Labels:** backend, auth, security

**Objective:** Secure APIs with authentication and usage quotas

**Description:**
Implement proper authentication, rate limiting, and usage tracking to prepare for freemium model.

**Authentication:**
- [ ] Supabase Auth integration with Edge Functions
- [ ] JWT token validation
- [ ] User session management
- [ ] Guest user support (limited access)

**Rate Limiting:**
- [ ] Free tier: 10 analyses per day
- [ ] Usage quota enforcement
- [ ] Graceful quota exceeded handling
- [ ] Reset timing (daily/monthly)

**Database Schema:**
```sql
-- Usage tracking
CREATE TABLE user_usage (
  user_id UUID REFERENCES auth.users(id),
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  plan_type TEXT DEFAULT 'free',
  last_reset_daily TIMESTAMPTZ DEFAULT NOW(),
  last_reset_monthly TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis history  
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  input_data JSONB,
  result JSONB,
  cost DECIMAL(10,4),
  provider TEXT,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing cache
CREATE TABLE pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT,
  category TEXT,
  data JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Monitoring:**
- Request logging and analytics
- Error tracking with Sentry
- Performance metrics
- Cost tracking per user

---

## 🏗️ **EPIC: Mobile App Refactor (Thin Client)**

### **[MOBILE-101] Create thin client ChatScreen**
**Priority:** High | **Estimate:** 5 points | **Labels:** frontend, chat, ui

**Objective:** Build chat-first UI that ONLY calls APIs (zero business logic)

**Description:**
Replace camera-first navigation with ChatGPT-style interface that matches the web app design, calling only APIs for all business logic.

**Design Requirements:**
- [ ] Match `ToddyAdviceChat.tsx` design exactly
- [ ] AskToddy orange (#FF6B35) and navy (#2C3E50) colors
- [ ] Message bubbles with gradients and shadows
- [ ] Toddy avatar for assistant messages
- [ ] User avatar for user messages
- [ ] Professional enterprise appearance

**Functionality:**
- [ ] Real-time message interface
- [ ] Conversation history persistence
- [ ] Loading states with typing indicators
- [ ] Error handling with retry options
- [ ] Auto-scroll to latest message
- [ ] Message timestamps
- [ ] Copy message content functionality

**API Integration:**
```typescript
// ONLY API calls - NO business logic
const handleSend = async () => {
  const { data, error } = await supabase.functions.invoke('analyze-construction', {
    body: { 
      message: input, 
      imageUri: attachedImage,
      history: messages.slice(-6),
      context: userContext
    }
  })
  
  if (data) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.response,
      showDocumentButtons: data.canGenerateDocuments
    }])
  }
}
```

**No Business Logic:**
- ❌ No AI providers in frontend
- ❌ No pricing calculations  
- ❌ No cost analysis
- ❌ No document generation logic
- ✅ Only UI state management
- ✅ Only API calls and display

---

### **[MOBILE-102] Extract camera logic to reusable hooks**
**Priority:** High | **Estimate:** 2 points | **Labels:** frontend, camera, hooks

**Objective:** Reuse existing camera functionality in chat interface

**Description:**
Extract working camera/gallery logic from CameraScreen into reusable hooks for integration with chat input.

**Hooks to Create:**
```typescript
// useCameraCapture.ts
export const useCameraCapture = () => {
  const capturePhoto = async () => {
    // Use existing camera logic
    // Return only URI - no analysis
  }
  
  return {
    capturePhoto,
    isLoading,
    error,
    hasPermission
  }
}

// useGalleryPicker.ts  
export const useGalleryPicker = () => {
  const pickImage = async () => {
    // Use existing gallery logic
  }
  
  return { pickImage, isLoading, error }
}

// useFileUpload.ts
export const useFileUpload = () => {
  const uploadFile = async (files: FileList) => {
    // Handle PDFs, videos, images
    // File validation and compression
  }
  
  return { uploadFile, isLoading, error }
}
```

**Integration Pattern:**
```typescript
// ChatInput.tsx
const ChatInput = () => {
  const { capturePhoto } = useCameraCapture()
  const { pickImage } = useGalleryPicker()
  
  return (
    <div className="chat-input">
      <input type="text" />
      <button onClick={capturePhoto}>📷</button>
      <button onClick={pickImage}>🖼️</button>
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}
```

**File Management:**
- [ ] Image preview before sending
- [ ] Multiple file selection (up to 4)
- [ ] File type validation
- [ ] Size limits and compression
- [ ] Remove attached files option

---

### **[MOBILE-103] Integrate multi-modal input system**
**Priority:** High | **Estimate:** 3 points | **Labels:** frontend, input, multimodal

**Objective:** Support text + photos + videos + PDFs in chat interface

**Description:**
Build comprehensive input system supporting all media types like the web app.

**Input Types:**
- [ ] **Text**: Auto-resize textarea with placeholder
- [ ] **Photos**: Camera capture + gallery selection  
- [ ] **Videos**: Recording + gallery selection (60 second max)
- [ ] **PDFs**: File picker with preview
- [ ] **Multiple files**: Up to 4 attachments per message

**ChatGPT-style Integration:**
```typescript
interface ChatInputProps {
  onSend: (data: {
    text?: string
    attachments?: Attachment[]
  }) => void
}

interface Attachment {
  type: 'image' | 'video' | 'pdf'
  uri: string
  name: string
  size: number
  preview?: string
}
```

**UI Components:**
- [ ] Expandable text input
- [ ] Attachment preview grid
- [ ] Remove attachment buttons
- [ ] File type icons
- [ ] Upload progress indicators
- [ ] File size validation messages

**Validation:**
- Images: 10MB max, JPG/PNG/HEIC
- Videos: 10MB max, MP4/MOV, 60s max
- PDFs: 200MB max, architectural drawings
- Total: 4 files maximum per message

---

### **[MOBILE-104] Add document download integration**
**Priority:** Medium | **Estimate:** 2 points | **Labels:** frontend, documents, download

**Objective:** Download PDFs generated by middleware

**Description:**
Integrate document generation buttons that appear after analysis, calling the document generation API.

**Document Types:**
- [ ] **PDF Quote**: Detailed cost breakdown
- [ ] **Project Plan**: Timeline and phases
- [ ] **Task List**: Actionable checklist

**UI Integration:**
```typescript
// Message with document buttons
{message.showDocumentButtons && (
  <div className="document-buttons">
    <button onClick={() => downloadDocument('quote')}>
      📄 Download PDF Quote
    </button>
    <button onClick={() => downloadDocument('timeline')}>
      📅 Download Project Plan
    </button>
    <button onClick={() => downloadDocument('tasklist')}>
      ✅ Download Task List
    </button>
  </div>
)}
```

**Download Flow:**
```typescript
const downloadDocument = async (type: DocumentType) => {
  const response = await supabase.functions.invoke('generate-document', {
    body: { 
      type,
      projectType: analysis.projectType,
      analysis,
      pricing
    }
  })
  
  // Handle PDF blob download
  // Show success message
  // Track download event
}
```

**Mobile Optimization:**
- [ ] Native sharing integration
- [ ] Download progress indicators
- [ ] Save to device storage
- [ ] Share via email/messaging
- [ ] Offline access to downloaded documents

---

## 📊 **Sprint Planning**

### **Sprint 1: Middleware Foundation (Week 1)**
- API-001: Supabase setup (Day 1)
- API-002: AIMiddleware migration (Day 1-2)  
- API-003: UK pricing services (Day 2-3)
- API-004: OpenAI provider (Day 3)
- API-005: Document generation (Day 4)
- API-006: Auth and rate limiting (Day 4-5)

### **Sprint 2: Mobile Refactor (Week 2)**
- MOBILE-101: ChatScreen (Day 6-7)
- MOBILE-102: Camera hooks (Day 6)
- MOBILE-103: Multi-modal input (Day 7)
- MOBILE-104: Document downloads (Day 7)

### **Sprint 3: Testing & Polish (Week 3)**
- End-to-end testing
- Performance optimization  
- Error handling refinement
- Production deployment

**Total Estimate:** 29 points over 3 weeks
**Result:** Zero technical debt, API-first architecture, chat-first mobile app

---

## 🎯 **Success Metrics**

### **Technical Debt Elimination:**
- [ ] 0 lines of business logic in mobile app
- [ ] All AI/pricing logic in middleware
- [ ] Reusable API for future web/desktop apps
- [ ] Testable, maintainable codebase

### **Feature Completeness:**
- [ ] Chat-first interface matching web app
- [ ] Multi-modal input (text/photo/video/PDF)
- [ ] Document generation working
- [ ] Provider switching functional
- [ ] Rate limiting operational

### **Performance Standards:**
- [ ] API response times <2 seconds
- [ ] Chat interface loads <1 second
- [ ] Document generation <10 seconds
- [ ] 99%+ uptime reliability

**This approach ensures we build the right architecture from day 1!**