# Linear MVP Tickets - AskToddy Construction AI

## Epic: ASK-100 - MVP Launch - Construction Quote Specialist

**Goal**: Launch AskToddy as the UK's premier AI construction quoting platform
**Timeline**: 6 weeks
**Success Criteria**: 200 paid subscribers in 3 months

---

## Phase 1: Core Chat Infrastructure (Week 1-2)

### ASK-101: Gemini AI Integration for Construction

**Priority**: P0 - Critical
**Points**: 8
**Description**: Integrate Gemini 2.0 Flash as primary AI provider with construction-specific prompts
**Acceptance Criteria**:

- [ ] Gemini API integrated with proper error handling
- [ ] Construction-specific system prompts
- [ ] Image/PDF analysis capability
- [ ] Rate limiting and quota management
- [ ] Fallback error messages

### ASK-102: Chat Interface with Context Memory

**Priority**: P0 - Critical  
**Points**: 5
**Description**: Build ChatGPT-style interface with conversation context
**Acceptance Criteria**:

- [ ] Message input with file upload
- [ ] Streaming responses
- [ ] Conversation context maintained
- [ ] Loading states and error handling
- [ ] Mobile responsive design

### ASK-103: Anonymous Chat Support

**Priority**: P1 - High
**Points**: 3
**Description**: Allow users to chat without signing up
**Acceptance Criteria**:

- [ ] Anonymous sessions created
- [ ] Chat works without auth
- [ ] "Sign up to save" prompts
- [ ] Session cleanup after 24h

---

## Phase 2: Authentication & User Management (Week 2-3)

### ASK-104: User Authentication System

**Priority**: P0 - Critical
**Points**: 5
**Description**: Implement signup/login with Supabase Auth
**Acceptance Criteria**:

- [ ] Email/password signup
- [ ] Email verification
- [ ] Password reset flow
- [ ] Session management
- [ ] Protected routes

### ASK-105: Conversation History Sidebar

**Priority**: P1 - High
**Points**: 5
**Description**: Build persistent chat history for logged-in users
**Acceptance Criteria**:

- [ ] Sidebar with conversation list
- [ ] Search conversations
- [ ] Delete conversations
- [ ] Auto-save every message
- [ ] Load previous conversations

### ASK-106: PDF Quota Management

**Priority**: P0 - Critical
**Points**: 3
**Description**: Track and enforce 5 free PDFs per month
**Acceptance Criteria**:

- [ ] Track PDF generations per user
- [ ] Display remaining quota
- [ ] Block generation at limit
- [ ] Reset monthly
- [ ] Upgrade prompts

---

## Phase 3: PDF Generation System (Week 3-4)

### ASK-107: Quote PDF Template

**Priority**: P0 - Critical
**Points**: 8
**Description**: Create professional quote PDF template
**Acceptance Criteria**:

- [ ] Professional layout design
- [ ] Itemized pricing sections
- [ ] Subtotals and VAT
- [ ] Terms & conditions
- [ ] Contact information

### ASK-108: Project Plan PDF Template

**Priority**: P1 - High
**Points**: 5
**Description**: Create project planning PDF template
**Acceptance Criteria**:

- [ ] Timeline/Gantt chart
- [ ] Phase breakdown
- [ ] Resource allocation
- [ ] Milestone markers
- [ ] Dependencies

### ASK-109: Logo Upload & Branding

**Priority**: P1 - High
**Points**: 5
**Description**: Allow users to add logos and customize branding
**Acceptance Criteria**:

- [ ] Logo upload (PNG/JPG)
- [ ] Logo placement options
- [ ] Brand color selection
- [ ] Save brand preferences
- [ ] Multiple logos support (Pro)

### ASK-110: PDF Customization Flow

**Priority**: P1 - High
**Points**: 5
**Description**: Enable quote adjustments before final PDF
**Acceptance Criteria**:

- [ ] Edit rates inline
- [ ] Add custom line items
- [ ] Adjust quantities
- [ ] Add payment terms
- [ ] Preview before export

---

## Phase 4: Comprehensive Pricing Engine (Week 4-5)

**Note**: Detailed data collection tickets are in `LINEAR_DATA_COLLECTION_TICKETS.md` (ASK-200 to ASK-229)

### ASK-111: Plant & Equipment Pricing Database

**Priority**: P0 - Critical
**Points**: 8
**Description**: Build comprehensive equipment hire pricing (extends existing plant hire data)
**Dependencies**: ASK-201 (Database Schema), ASK-202 (Processing Pipeline)
**Acceptance Criteria**:

- [ ] 500+ equipment items (build on existing plant hire PDFs)
- [ ] Daily/weekly/monthly rates with smart averaging
- [ ] Regional variations and delivery charges
- [ ] Package deals logic
- [ ] Anonymous supplier pricing

### ASK-112: Building Materials Pricing Database

**Priority**: P0 - Critical
**Points**: 8
**Description**: Complete materials pricing database
**Dependencies**: ASK-204 to ASK-207 (Materials Collection & Processing)
**Related**: ASK-206 (Materials Processing), ASK-207 (Specialist Materials)
**Acceptance Criteria**:

- [ ] 1,000+ material items from national/regional suppliers
- [ ] Trade pricing with bulk discount tiers
- [ ] Stock status and lead times
- [ ] Anonymous market-based pricing
- [ ] Cross-supplier validation

### ASK-113: Aggregates & Waste Pricing Database

**Priority**: P1 - High
**Points**: 5
**Description**: Bulk materials and waste management pricing
**Dependencies**: ASK-208 to ASK-211 (Aggregates & Waste Collection)
**Related**: ASK-209 (Aggregates Processing), ASK-211 (Waste Processing)
**Acceptance Criteria**:

- [ ] 200+ aggregate items with coverage calculations
- [ ] 50+ waste services (all skip sizes)
- [ ] Delivery matrices by distance/quantity
- [ ] Landfill tax and environmental charges
- [ ] Regional waste operator coverage

### ASK-114: Labour Rate Cards Database

**Priority**: P1 - High
**Points**: 5
**Description**: Trade day rates by region and skill level
**Dependencies**: ASK-212 to ASK-214 (Labour Data Collection & Processing)
**Related**: ASK-214 (Labour Rates Processing)
**Acceptance Criteria**:

- [ ] 15 trades × 5 skill levels × 10 regions (750 rates)
- [ ] Day rates, overtime, gang rates
- [ ] CIS registration and qualification tracking
- [ ] Industry body validation
- [ ] Regional adjustment factors

### ASK-115: Tools & Specialist Services Database

**Priority**: P2 - Medium
**Points**: 3
**Description**: Small tools and specialist construction services
**Dependencies**: ASK-215 to ASK-218 (Tools & Services Collection)
**Related**: ASK-216 (Tools Processing), ASK-218 (Specialist Processing)
**Acceptance Criteria**:

- [ ] 300+ tool items with hire rates
- [ ] 100+ specialist services (scaffolding, crane, etc.)
- [ ] Damage waiver and insurance costs
- [ ] Professional qualifications and service areas
- [ ] Emergency and out-of-hours rates

### ASK-116: Pricing Integration & Validation

**Priority**: P0 - Critical  
**Points**: 5
**Description**: Integrate all pricing data with AI system
**Dependencies**: ASK-219 to ASK-221 (Validation & Integration)
**Related**: ASK-221 (API Integration), ASK-223 (Real-World Testing)
**Acceptance Criteria**:

- [ ] Unified pricing API across all categories
- [ ] Smart price lookup with confidence scoring
- [ ] Package deal recommendations
- [ ] Real-world quote validation (<10% variance)
- [ ] Performance optimization (<100ms responses)

---

## Phase 5: Payment & Subscription (Week 5)

### ASK-116: Stripe Payment Integration

**Priority**: P0 - Critical
**Points**: 5
**Description**: Implement subscription payments
**Acceptance Criteria**:

- [ ] Stripe checkout flow
- [ ] £29/month subscription
- [ ] Payment method management
- [ ] Billing history
- [ ] Cancel/resume subscription

### ASK-117: Subscription Management UI

**Priority**: P1 - High
**Points**: 3
**Description**: User dashboard for subscription
**Acceptance Criteria**:

- [ ] Current plan display
- [ ] Usage statistics
- [ ] Upgrade/downgrade flow
- [ ] Invoice downloads
- [ ] Payment method update

---

## Phase 6: Polish & Launch (Week 5-6)

### ASK-118: Landing Page

**Priority**: P0 - Critical
**Points**: 5
**Description**: Marketing landing page
**Acceptance Criteria**:

- [ ] Hero with value prop
- [ ] Feature highlights
- [ ] Pricing table
- [ ] Demo video/GIF
- [ ] Sign up CTA

### ASK-119: Email Notifications

**Priority**: P1 - High
**Points**: 3
**Description**: Transactional emails
**Acceptance Criteria**:

- [ ] Welcome email
- [ ] PDF export email
- [ ] Quota warnings
- [ ] Payment receipts
- [ ] Monthly usage summary

### ASK-120: Analytics & Monitoring

**Priority**: P1 - High
**Points**: 3
**Description**: Track usage and performance
**Acceptance Criteria**:

- [ ] Mixpanel/Amplitude setup
- [ ] Key metrics dashboard
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User feedback widget

### ASK-121: SEO & Performance

**Priority**: P2 - Medium
**Points**: 3
**Description**: Optimize for search and speed
**Acceptance Criteria**:

- [ ] Meta tags optimization
- [ ] Sitemap generation
- [ ] Page speed >90
- [ ] Core Web Vitals pass
- [ ] Schema markup

---

## Backlog (Post-MVP)

### ASK-122: API Access

**Points**: 8
**Description**: REST API for Pro users

### ASK-123: White Label Options

**Points**: 13
**Description**: Custom domains and branding

### ASK-124: Supplier Integrations

**Points**: 8
**Description**: Direct supplier pricing feeds

### ASK-125: Mobile Apps

**Points**: 21
**Description**: iOS and Android native apps

### ASK-126: Multi-language Support

**Points**: 13
**Description**: Support for other markets

---

## Sprint Plan

### Sprint 1 (Week 1-2)

- ASK-101: Gemini Integration
- ASK-102: Chat Interface
- ASK-103: Anonymous Chat
- ASK-104: Authentication

### Sprint 2 (Week 3-4)

- ASK-105: Chat History
- ASK-106: PDF Quotas
- ASK-107: Quote PDF
- ASK-109: Logo Upload

### Sprint 3 (Week 5-6)

- ASK-111: Equipment Pricing
- ASK-112: Materials Pricing
- ASK-116: Stripe Integration
- ASK-118: Landing Page

---

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests written (>80% coverage)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approval

## Team Allocation

- **Backend**: Pricing engine, AI integration, PDF generation
- **Frontend**: Chat UI, dashboard, landing page
- **DevOps**: Deployment, monitoring, scaling
- **Product**: User testing, feedback, priorities
