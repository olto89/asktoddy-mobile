# Detailed Linear Tickets for AskToddy Mobile MVP

## 🏗️ **EPIC 1: Chat-First UI Architecture**

### **[MOBILE-001] Build ChatGPT-style conversation interface**

**Priority:** Urgent | **Estimate:** 8 points | **Sprint:** 1

**Objective:** Replace camera-first UI with ChatGPT-style chat interface matching web app

**Acceptance Criteria:**

- [ ] Full-screen chat interface with message bubbles
- [ ] User messages: Orange gradient background, white text, right-aligned
- [ ] Assistant messages: White background, gray border, left-aligned with Toddy avatar
- [ ] Message timestamps and loading indicators
- [ ] Auto-scroll to latest message
- [ ] Mobile-optimized message bubbles (85% max width)

**Design Requirements:**

- Match ToddyAdviceChat.tsx exactly:
  - Orange gradient header (#FF6B35 to #FF8C42)
  - Toddy character avatar for assistant messages
  - Professional message bubble styling
  - Proper mobile touch interactions

**Technical Implementation:**

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
  showDocumentButtons?: DocumentButtons;
}
```

**Dependencies:** None
**Files to Create:**

- `src/screens/ChatScreen.tsx`
- `src/components/MessageBubble.tsx`
- `src/components/ChatInput.tsx`

---

### **[MOBILE-002] Implement multi-modal input system**

**Priority:** Urgent | **Estimate:** 5 points | **Sprint:** 1

**Objective:** Support text, photo, video, and PDF input in chat interface

**Acceptance Criteria:**

- [ ] Text input with auto-resize textarea (like web app)
- [ ] Camera capture button (existing functionality)
- [ ] Gallery selection for photos/videos
- [ ] PDF file upload and preview
- [ ] Multiple file selection (up to 4 files)
- [ ] File type validation and size limits
- [ ] Image/video previews before sending

**File Support:**

- **Images:** JPG, PNG, HEIC (10MB limit)
- **Videos:** MP4, MOV (10MB limit)
- **PDFs:** PDF files (200MB limit)
- **Validation:** Mime type checking + file extension

**Technical Implementation:**

```typescript
interface InputAttachment {
  type: 'image' | 'video' | 'pdf';
  uri: string;
  name: string;
  size: number;
}
```

**Dependencies:** MOBILE-001
**Files to Modify:**

- `src/screens/CameraScreen.tsx` → Remove as primary screen
- `src/components/ChatInput.tsx` → Multi-modal input

---

### **[MOBILE-003] Add conversation context management**

**Priority:** High | **Estimate:** 3 points | **Sprint:** 1

**Objective:** Maintain conversation history and context like web app

**Acceptance Criteria:**

- [ ] Store last 6 messages for context (like web app)
- [ ] Persist conversation locally
- [ ] Clear conversation option
- [ ] Message count tracking
- [ ] Context passed to AI for better responses

**Technical Implementation:**

```typescript
interface ConversationContext {
  messages: Message[];
  totalUserMessages: number;
  sessionId: string;
  startedAt: Date;
}
```

**Dependencies:** MOBILE-001
**Storage:** AsyncStorage for offline persistence

---

## 🏗️ **EPIC 2: AI Middleware Enhancement**

### **[MOBILE-004] Build OpenAI provider for LLM switching**

**Priority:** High | **Estimate:** 5 points | **Sprint:** 2

**Objective:** Add OpenAI GPT-4 Vision as alternative to Gemini

**Acceptance Criteria:**

- [ ] OpenAIProvider implementing AIProvider interface
- [ ] Support for GPT-4 Vision (image analysis)
- [ ] GPT-4 text completion for text-only queries
- [ ] Configurable model selection (gpt-4-vision-preview, gpt-4o)
- [ ] Cost tracking and token usage
- [ ] Provider switching via config

**Technical Implementation:**

```typescript
class OpenAIProvider implements AIProvider {
  name = 'openai';

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // Use GPT-4 Vision for image analysis
    // Use same prompt engineering as Gemini
    // Parse response to ProjectAnalysis format
  }
}
```

**Configuration:**

```typescript
// Support provider switching
const config = {
  primaryProvider: 'openai' | 'gemini',
  fallbackProviders: ['gemini', 'mock'],
};
```

**Dependencies:** Current AIMiddleware
**API Requirements:** OpenAI API key

---

### **[MOBILE-005] Create comprehensive UK pricing services**

**Priority:** High | **Estimate:** 8 points | **Sprint:** 2

**Objective:** Build detailed UK construction pricing like web app

**Acceptance Criteria:**

- [ ] **ToolHireService**: HSS, Speedy, local hire shops
- [ ] **MaterialsService**: Screwfix, B&Q, Travis Perkins pricing
- [ ] **AggregateService**: Sand, gravel, concrete suppliers
- [ ] **LabourService**: UK trade rates by region
- [ ] **BuildingRegsService**: UK building regulations context
- [ ] Real-time scraping where possible
- [ ] Cached pricing with TTL
- [ ] Regional multipliers (London +25%, etc.)

**Data Sources:**

- **HSS Tool Hire**: Scrape daily rates
- **Speedy Hire**: API if available, otherwise scrape
- **ONS Construction Stats**: Government labour data
- **BCIS**: Building cost information
- **Local suppliers**: Phone-scraped rates

**Technical Implementation:**

```typescript
interface PricingService {
  getToolHireRates(location: string): Promise<ToolHireRate[]>;
  getMaterialPrices(location: string): Promise<MaterialPrice[]>;
  getAggregateRates(location: string): Promise<AggregateRate[]>;
  getLabourRates(trade: string, region: string): Promise<LabourRate>;
}
```

**Dependencies:** None
**Files to Create:**

- `src/services/pricing/ToolHireService.ts`
- `src/services/pricing/MaterialsService.ts`
- `src/services/pricing/AggregateService.ts`
- `src/services/pricing/LabourService.ts`

---

### **[MOBILE-006] Build groundworks and landscaping knowledge base**

**Priority:** Medium | **Estimate:** 5 points | **Sprint:** 3

**Objective:** Add specialized construction context for comprehensive quotes

**Acceptance Criteria:**

- [ ] **Groundworks**: Excavation, foundations, drainage
- [ ] **Landscaping**: Garden design, planting, hardscaping
- [ ] **Building Regulations**: UK-specific compliance requirements
- [ ] **Safety Standards**: HSE requirements, CDM regulations
- [ ] **Planning Permission**: Guidance on when required
- [ ] **Utilities**: Gas, electric, water connection requirements

**Knowledge Areas:**

```typescript
interface ConstructionKnowledge {
  groundworks: {
    excavationRates: ExcavationRate[];
    foundationTypes: FoundationType[];
    drainageRequirements: DrainageReq[];
  };
  landscaping: {
    plantingCosts: PlantingCost[];
    hardscaping: HardscapingOption[];
    gardenDesign: DesignGuideline[];
  };
  regulations: {
    buildingRegs: BuildingRegulation[];
    planningPermission: PlanningReq[];
    safetyStandards: SafetyStandard[];
  };
}
```

**Dependencies:** MOBILE-005
**Data Sources:** HSE, UK.gov, industry standards

---

## 🏗️ **EPIC 3: Document Generation System**

### **[MOBILE-007] Implement structured document generation**

**Priority:** High | **Estimate:** 8 points | **Sprint:** 2

**Objective:** Generate professional PDF quotes, project plans, and task lists

**Acceptance Criteria:**

- [ ] **PDF Quote Generation**: Detailed cost breakdown with company branding
- [ ] **Project Plan Timeline**: Gantt-style timeline with phases
- [ ] **Task List Generation**: Downloadable checklist with dependencies
- [ ] Document buttons appear after cost estimates (like web app)
- [ ] Mobile-optimized download flow
- [ ] Email sharing option

**Document Templates:**

```typescript
interface QuoteDocument {
  projectDetails: ProjectDetails;
  costBreakdown: DetailedCostBreakdown;
  timeline: ProjectTimeline;
  materials: MaterialsList;
  labour: LabourBreakdown;
  contingency: ContingencyAllowance;
  terms: TermsAndConditions;
}

interface ProjectPlan {
  phases: ProjectPhase[];
  dependencies: TaskDependency[];
  timeline: GanttTimeline;
  milestones: Milestone[];
  resources: ResourceAllocation;
}

interface TaskList {
  categories: TaskCategory[];
  tasks: Task[];
  dependencies: TaskDependency[];
  estimatedDuration: Duration;
  skillsRequired: Skill[];
}
```

**Technical Implementation:**

- Use react-native-html-to-pdf or similar
- Template-based generation
- Professional AskToddy branding
- Mobile sharing via native sharing API

**Dependencies:** MOBILE-005 (pricing data)

---

## 🏗️ **EPIC 4: Media Processing**

### **[MOBILE-008] Add video recording and processing**

**Priority:** Medium | **Estimate:** 5 points | **Sprint:** 3

**Objective:** Support video input for construction site walkthroughs

**Acceptance Criteria:**

- [ ] Video recording with expo-camera
- [ ] Video file selection from gallery
- [ ] Video compression for upload
- [ ] Frame extraction for AI analysis
- [ ] Video preview in chat
- [ ] Progress indicators for processing

**Technical Requirements:**

- **Max Duration**: 60 seconds
- **Compression**: Reduce to <10MB for upload
- **Frame Extraction**: Every 5 seconds for AI analysis
- **Formats**: MP4, MOV support

**Implementation:**

```typescript
interface VideoProcessor {
  recordVideo(maxDuration: number): Promise<string>;
  compressVideo(uri: string): Promise<string>;
  extractFrames(uri: string, interval: number): Promise<string[]>;
  getVideoMetadata(uri: string): Promise<VideoMetadata>;
}
```

**Dependencies:** MOBILE-002
**Packages:** expo-av, expo-video-thumbnails

---

### **[MOBILE-009] Create PDF parsing service for floor plans**

**Priority:** Medium | **Estimate:** 6 points | **Sprint:** 3

**Objective:** Extract information from architectural drawings and floor plans

**Acceptance Criteria:**

- [ ] PDF to image conversion (like web app)
- [ ] OCR text extraction from PDFs
- [ ] Scale detection from architectural drawings
- [ ] Room dimension extraction
- [ ] Symbol recognition (doors, windows, fixtures)
- [ ] Floor plan analysis for space planning

**Technical Implementation:**

```typescript
interface PDFProcessor {
  convertToImages(pdfUri: string, maxPages: number): Promise<string[]>;
  extractText(pdfUri: string): Promise<string>;
  analyzeFloorPlan(pdfUri: string): Promise<FloorPlanAnalysis>;
  detectScale(imageUri: string): Promise<ScaleInfo>;
}

interface FloorPlanAnalysis {
  rooms: Room[];
  dimensions: Dimension[];
  features: ArchitecturalFeature[];
  estimatedArea: number;
  scale: string;
}
```

**Dependencies:** MOBILE-002
**Packages:** react-native-pdf, react-native-tesseract-ocr

---

## 🏗️ **EPIC 5: Supabase Middleware Migration**

### **[MOBILE-010] Migrate to Supabase Edge Functions API**

**Priority:** High | **Estimate:** 6 points | **Sprint:** 4

**Objective:** Move business logic from mobile to Supabase Edge Functions

**Acceptance Criteria:**

- [ ] Edge Function: `/analyze-construction`
- [ ] Edge Function: `/get-pricing-data`
- [ ] Edge Function: `/generate-document`
- [ ] User authentication integration
- [ ] Rate limiting (10 analyses/day free tier)
- [ ] Result caching in Supabase DB
- [ ] Usage tracking and analytics

**Architecture Migration:**

```typescript
// BEFORE: Direct mobile integration
const analysis = await geminiProvider.analyzeImage(imageUri);

// AFTER: API-first approach
const { data } = await supabase.functions.invoke('analyze-construction', {
  body: { imageUri, context },
});
```

**Edge Functions:**

1. **analyze-construction**: AI analysis with pricing integration
2. **get-pricing-data**: Current UK rates and market data
3. **generate-document**: PDF quote/plan/task list generation

**Dependencies:** All previous EPICs
**Database Schema:** analyses, user_usage, pricing_cache tables

---

## 🏗️ **EPIC 6: Authentication & User Flow**

### **[MOBILE-011] Enhance authentication system**

**Priority:** Medium | **Estimate:** 3 points | **Sprint:** 4

**Objective:** Professional authentication matching web app experience

**Acceptance Criteria:**

- [ ] Enhanced login/registration UI matching AskToddy brand
- [ ] User onboarding flow
- [ ] Guest mode with limited features
- [ ] Profile screen for user preferences
- [ ] Usage quota display
- [ ] Upgrade prompts for paid tier

**User Flow:**

```
Launch → Splash → Login/Register → Onboarding → Chat Interface
                      ↓
               Guest Mode (5 free analyses)
```

**Dependencies:** MOBILE-010 (for usage tracking)

---

## 🏗️ **EPIC 7: Quality & Testing**

### **[MOBILE-012] End-to-end testing and polish**

**Priority:** Medium | **Estimate:** 5 points | **Sprint:** 4

**Objective:** Production-ready MVP with comprehensive testing

**Acceptance Criteria:**

- [ ] **E2E Test Flow**: Register → Chat → Upload Image → Get Quote → Download PDF
- [ ] **Error Handling**: Network failures, API limits, invalid files
- [ ] **Performance**: Chat loads <2s, analysis completes <30s
- [ ] **Accessibility**: Screen reader support, contrast ratios
- [ ] **Offline Mode**: Basic functionality when offline
- [ ] **App Store Optimization**: Icons, screenshots, descriptions

**Test Scenarios:**

1. New user onboarding
2. Image upload and analysis
3. Video recording and processing
4. PDF floor plan upload
5. Document generation and download
6. Error recovery
7. Rate limiting behavior

**Dependencies:** All previous EPICs

---

## 📊 **Sprint Planning Summary**

### **Sprint 1: Core Chat Interface (2 weeks)**

- MOBILE-001: Chat UI
- MOBILE-002: Multi-modal input
- MOBILE-003: Context management

### **Sprint 2: AI & Pricing (2 weeks)**

- MOBILE-004: OpenAI provider
- MOBILE-005: UK pricing services
- MOBILE-007: Document generation

### **Sprint 3: Media Processing (2 weeks)**

- MOBILE-006: Knowledge base
- MOBILE-008: Video support
- MOBILE-009: PDF processing

### **Sprint 4: Production Ready (2 weeks)**

- MOBILE-010: Supabase migration
- MOBILE-011: Enhanced auth
- MOBILE-012: Testing & polish

**Total Estimate:** 62 points (8 weeks)
**Team Velocity:** 15-20 points/sprint (2 weeks)

---

## 🎯 **Definition of Done**

Each ticket must meet:

- [ ] **Functionality**: All acceptance criteria met
- [ ] **Design**: Matches AskToddy web app design system
- [ ] **Testing**: Unit tests + manual testing on iOS/Android
- [ ] **Performance**: Meets performance criteria
- [ ] **Code Quality**: TypeScript strict mode, linting passes
- [ ] **Documentation**: Updated README and code comments
- [ ] **Review**: Code review completed
- [ ] **Demo**: Working demo on physical device
