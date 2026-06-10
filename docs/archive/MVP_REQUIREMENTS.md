# AskToddy MVP Requirements Specification

## 🎯 Vision

**AskToddy: The Construction Industry's AI Specialist**
A professional AI-powered platform that generates comprehensive, accurate construction quotes and project plans, positioning itself as the go-to specialist tool that surpasses generic AI assistants like ChatGPT.

## 🏗️ Core Value Proposition

- **Specialist Knowledge**: Deep construction expertise with comprehensive pricing data
- **Professional Output**: Branded PDF quotes and project plans
- **Accurate Pricing**: Real market rates for hire, materials, aggregates, and waste
- **Customization**: Add logos, adjust rates, personalize quotes
- **Conversation Memory**: Persistent chat history and project continuity

## 📋 MVP Feature Set

### 1. AI Chat Interface

**Technology Stack**

- Single AI Provider: Gemini 2.0 Flash (chosen for vision capabilities and cost)
- Alternative: OpenAI GPT-4 Vision (if Gemini unavailable)
- No provider switching in MVP - pick one and optimize for it

**Chat Features**

- ChatGPT-style interface with sidebar for conversation history
- Contextual memory within conversations
- Image/PDF upload for analysis
- Real-time pricing lookups
- Project understanding and refinement

### 2. PDF Generation System

**Core Capabilities**

- Professional quote PDFs with itemized pricing
- Project plan PDFs with timelines and phases
- Logo upload and placement
- Custom branding colors
- Editable sections for rates/terms

**Customization Flow**

```
Initial Quote → User Reviews → "Add my logo" → "Adjust day rates" → "Add payment terms" → Final PDF
```

### 3. Comprehensive Pricing Engine

#### Categories to Cover

**Plant & Equipment Hire**

- Excavators (0.8T to 20T)
- Dumpers (1T to 9T)
- Telehandlers & Forklifts
- Compaction Equipment
- Concrete Equipment
- Power Generation
- Access Equipment (Scaffolding, Platforms)
- Small Tools & Equipment

**Building Materials**

- Timber & Sheet Materials
- Insulation & Membranes
- Plasterboard & Plastering
- Roofing Materials
- Bricks, Blocks & Lintels
- Cement & Aggregates
- Drainage & Underground

**Aggregates & Bulk**

- Sand (Building, Sharp, Kiln Dried)
- Gravel & Shingle
- Hardcore & Type 1
- Topsoil & Compost
- Decorative Aggregates
- Concrete Mixes

**Waste Management**

- Skip Hire (2yd to 40yd)
- Grab Hire
- Wait & Load Services
- Muck Away
- Hazardous Waste Disposal
- Recycling Services

**Trade Services** (Rate Cards)

- Groundworks
- Bricklaying
- Carpentry
- Electrical
- Plumbing
- Plastering
- Painting & Decorating
- Roofing

### 4. User Authentication & Limits

#### Anonymous Users

- ✅ Can chat with AI
- ✅ Get pricing estimates
- ✅ View quote previews
- ❌ Cannot save conversations
- ❌ Cannot generate PDFs
- ❌ No conversation history
- Shows "Sign up to save & export" prompts

#### Free Tier (Signed Up)

- ✅ 5 PDF exports per month
- ✅ Save conversations
- ✅ Conversation history sidebar
- ✅ Basic logo upload
- ✅ Email support
- Shows "4 PDFs remaining this month"

#### Pro Tier (£29/month)

- ✅ Unlimited PDF exports
- ✅ Priority AI responses
- ✅ Advanced customization
- ✅ Multiple logos/brands
- ✅ API access (future)
- ✅ Priority support

### 5. User Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  AskToddy  [New Chat] [Pricing] [Sign In]               │
├────────────┬────────────────────────────────────────────┤
│            │  💬 Current Conversation                    │
│  Chat      │                                             │
│  History   │  User: Quote for kitchen extension          │
│            │  AI: I'll help you create a detailed quote  │
│  ────────  │      for your kitchen extension...          │
│            │                                             │
│  Yesterday │  [📎 Upload]  [💾 Save]  [📄 Export PDF]   │
│  • Kitchen │                                             │
│  • Bathroom│  ┌─────────────────────────────────────┐   │
│            │  │ Type your message here...          │   │
│  Last Week │  └─────────────────────────────────────┘   │
│  • Loft    │                                             │
│  • Garden  │  [Send]                                    │
│            │                                             │
└────────────┴────────────────────────────────────────────┘
```

## 🔄 User Journeys

### Journey 1: Anonymous to Paid

1. User searches "AI construction quote"
2. Lands on AskToddy, sees professional interface
3. Starts chatting about project
4. AI provides detailed, accurate pricing
5. User impressed, wants to save quote
6. Prompted to sign up (email/password)
7. Gets 5 free PDFs
8. After using free PDFs, upgrades to Pro

### Journey 2: Professional Contractor

1. Signs up immediately knowing the value
2. Uploads project plans/photos
3. AI analyzes and creates comprehensive quote
4. Adds company logo and adjusts rates
5. Exports professional PDF
6. Sends to client same day
7. Upgrades to Pro for unlimited use

## 📊 Technical Implementation

### Database Schema Extensions

```sql
-- User quotas and subscriptions
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY,
  free_pdfs_remaining INTEGER DEFAULT 5,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires TIMESTAMPTZ,
  logos JSONB DEFAULT '[]',
  custom_rates JSONB DEFAULT '{}'
);

-- PDF generation history
CREATE TABLE pdf_generations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  conversation_id UUID,
  pdf_type TEXT, -- 'quote' or 'project_plan'
  customizations JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive pricing tables
CREATE TABLE pricing_materials (
  -- Similar to pricing_data but for materials
);

CREATE TABLE pricing_aggregates (
  -- Bulk materials pricing
);

CREATE TABLE pricing_waste (
  -- Skip hire and waste pricing
);

CREATE TABLE pricing_labour (
  -- Trade day rates by region
);
```

### API Endpoints

```typescript
// Core endpoints
POST / api / chat; // AI conversation
POST / api / analyze; // Image/PDF analysis
GET / api / pricing; // Fetch pricing data
POST / api / pdf / generate; // Generate PDF
POST / api / pdf / customize; // Add logo/adjustments
GET / api / conversations; // User's chat history
POST / api / auth / signup; // User registration
GET / api / user / quota; // Check PDF allowance
```

## 🚀 MVP Development Phases

### Phase 1: Core Chat (Week 1-2)

- [ ] Gemini integration with construction prompts
- [ ] Basic chat interface
- [ ] Pricing database queries
- [ ] Anonymous chat support

### Phase 2: Authentication (Week 2-3)

- [ ] User signup/login
- [ ] Conversation persistence
- [ ] Chat history sidebar
- [ ] PDF quota tracking

### Phase 3: PDF Generation (Week 3-4)

- [ ] Quote PDF template
- [ ] Project plan template
- [ ] Logo upload & placement
- [ ] Rate customization

### Phase 4: Pricing Engine (Week 4-5)

- [ ] Complete pricing database
- [ ] Regional adjustments
- [ ] Smart recommendations
- [ ] Bulk/package calculations

### Phase 5: Polish & Launch (Week 5-6)

- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Landing page
- [ ] Analytics setup

## 🎯 Success Metrics

### Launch Goals (Month 1)

- 500 signups
- 50 paid subscribers
- 2,000 PDFs generated
- <2% pricing complaint rate

### Growth Goals (Month 3)

- 2,000 signups
- 200 paid subscribers
- £5,800 MRR
- 4.5+ star rating

## 🔐 Competitive Advantages

1. **Specialist Focus**: Not a generic AI - built for construction
2. **Real Pricing Data**: Actual market rates, not estimates
3. **Professional Output**: Client-ready PDFs with branding
4. **Comprehensive Coverage**: Hire, materials, waste, labour - everything
5. **UK Market Leader**: Focused on UK construction initially

## 💡 Key Differentiators from ChatGPT

| Feature              | ChatGPT           | AskToddy             |
| -------------------- | ----------------- | -------------------- |
| Construction Pricing | Generic estimates | Real market data     |
| PDF Generation       | Basic/none        | Professional branded |
| Price Database       | None              | 10,000+ items        |
| Regional Pricing     | No                | Yes, by postcode     |
| Trade Rates          | Guesses           | Verified rates       |
| Waste Calculations   | Manual            | Automated            |
| Project Timelines    | Basic             | Detailed with phases |
| Logo/Branding        | No                | Yes                  |
| Quote Adjustments    | Start over        | Edit in conversation |

## 🚦 Go/No-Go Criteria

**Must Have for Launch**

- ✅ Accurate pricing for 80% of common items
- ✅ PDF generation with logo
- ✅ 5 free PDFs + payment gateway
- ✅ Conversation memory
- ✅ Mobile responsive

**Nice to Have**

- Multiple AI providers
- API access
- White-label options
- Supplier integration
- CRM connectivity

## 📝 Next Steps

1. Create Linear tickets for each component
2. Set up Stripe integration
3. Build PDF templates
4. Expand pricing database
5. Create landing page
6. Beta test with contractors

---

**Target Launch**: 6 weeks from today
**Target Market**: UK construction contractors and builders
**Pricing**: £29/month Pro after 5 free PDFs
**Success Metric**: 200 paid users in 3 months
