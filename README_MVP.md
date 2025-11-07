# AskToddy - The Construction Industry's AI Specialist

> **Last Updated:** 2025-10-31  
> **Status:** 🏗️ MVP Development - Construction Quote & Project Planning Platform
> **Target Launch:** 6 weeks | **Goal:** UK's Premier AI Construction Tool

## 🎯 **Vision**

**AskToddy** is positioning itself as the construction industry's specialist AI platform, surpassing generic tools like ChatGPT with:

- 📊 **Real Market Pricing**: 10,000+ verified prices for equipment, materials, aggregates & waste
- 📄 **Professional PDFs**: Branded quotes and project plans with logo customization
- 🧠 **Industry Expertise**: Deep construction knowledge with UK market focus
- 💬 **Intelligent Chat**: ChatGPT-style interface with persistent conversation history
- 🎨 **Full Customization**: Add logos, adjust rates, personalize every quote

## 🚀 **MVP Features**

### **1. AI-Powered Chat**

- Single AI provider (Gemini 2.0 Flash) optimized for construction
- Image/PDF upload and analysis
- Contextual memory within conversations
- Real-time pricing lookups
- Anonymous users can chat before signing up

### **2. Professional PDF Generation**

- **Quote PDFs**: Itemized pricing, VAT, payment terms
- **Project Plans**: Timelines, phases, resource allocation
- **Customization**: Logo upload, brand colors, rate adjustments
- **Iterative Refinement**: Adjust and regenerate based on feedback

### **3. Comprehensive Pricing Engine**

| Category                  | Items     | Coverage                                  |
| ------------------------- | --------- | ----------------------------------------- |
| 🚜 **Plant & Equipment**  | 500+      | Excavators, dumpers, scaffolding, tools   |
| 🧱 **Building Materials** | 1,000+    | Timber, insulation, plasterboard, roofing |
| 🏗️ **Aggregates & Bulk**  | 200+      | Sand, gravel, topsoil, concrete mixes     |
| 🗑️ **Waste Management**   | 50+       | Skip hire, grab lorries, muck away        |
| 👷 **Labour Rates**       | 15 trades | Regional rates for all major trades       |

### **4. User Tiers**

| Feature            | Anonymous | Free (Signed Up) | Pro (£29/month) |
| ------------------ | --------- | ---------------- | --------------- |
| AI Chat            | ✅        | ✅               | ✅              |
| Save Conversations | ❌        | ✅               | ✅              |
| PDF Exports/Month  | 0         | 5                | Unlimited       |
| Logo Upload        | ❌        | ✅               | ✅              |
| Custom Branding    | ❌        | Basic            | Advanced        |
| Priority Support   | ❌        | Email            | Priority        |

## 💡 **Key Differentiators**

### **vs ChatGPT**

- ✅ Real construction pricing (not guesses)
- ✅ Professional PDF output
- ✅ Industry-specific knowledge
- ✅ Logo and branding options
- ✅ Regional UK pricing

### **vs Traditional Quoting**

- ✅ 10x faster quote generation
- ✅ Always up-to-date pricing
- ✅ No manual calculations
- ✅ Professional presentation
- ✅ Instant adjustments

## 🏗️ **Technical Architecture**

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React Native/Next.js)    │
├─────────────────────────────────────────────────────┤
│                   Supabase Edge Functions            │
│  • Chat API  • PDF Generation  • Pricing Engine     │
├─────────────────────────────────────────────────────┤
│                   Supabase Database                  │
│  • Conversations  • Pricing Data  • User Profiles   │
├─────────────────────────────────────────────────────┤
│                   External Services                  │
│  • Gemini AI  • Stripe Payments  • Email (Resend)  │
└─────────────────────────────────────────────────────┘
```

## 📊 **Pricing Strategy**

### **Data Protection**

- Supplier names never exposed in quotes
- Market-based averaging across multiple sources
- Weighted calculations favoring stable national rates
- Regional adjustments without revealing sources

### **Smart Recommendations**

- Bulk discount opportunities
- Weekly/monthly vs daily rates
- Package deal suggestions
- Seasonal pricing adjustments

## 🗓️ **Development Timeline**

### **Week 1-2: Core Chat**

- [x] Gemini integration
- [ ] Chat interface
- [ ] Anonymous support
- [ ] Basic pricing queries

### **Week 2-3: Authentication**

- [ ] User signup/login
- [ ] Conversation history
- [ ] PDF quota tracking
- [ ] User dashboard

### **Week 3-4: PDF Generation**

- [ ] Quote template
- [ ] Project plan template
- [ ] Logo upload
- [ ] Customization flow

### **Week 4-5: Pricing Engine**

- [x] Database schema
- [x] Anonymization strategy
- [ ] PDF processing pipeline
- [ ] All categories populated

### **Week 5-6: Launch**

- [ ] Stripe integration
- [ ] Landing page
- [ ] Email flows
- [ ] Beta testing

## 🎯 **Success Metrics**

### **Launch (Month 1)**

- 500 signups
- 50 paid subscribers
- 2,000 PDFs generated
- <2% pricing complaint rate

### **Growth (Month 3)**

- 2,000 signups
- 200 paid subscribers (£5,800 MRR)
- 10,000 PDFs generated
- 4.5+ star rating

## 🛠️ **Current Development Status**

### **Completed** ✅

- MVP requirements documentation
- Linear ticket breakdown (21 tickets)
- Pricing engine architecture
- Database schema with anonymization
- Smart averaging algorithms
- Regional pricing logic

### **In Progress** 🚧

- PDF template designs
- Gemini prompt engineering
- Chat interface development
- Authentication flows

### **Next Steps** 📋

1. Complete PDF templates
2. Populate pricing database
3. Build chat UI with sidebar
4. Implement quota system
5. Set up Stripe subscriptions
6. Create landing page
7. Beta test with contractors

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run migrations
npm run pricing:migrate

# Process price lists
npm run pricing:setup

# Start development
npm run dev
```

## 📝 **Documentation**

- [MVP Requirements](./docs/MVP_REQUIREMENTS.md)
- [Linear Tickets](./docs/LINEAR_MVP_TICKETS.md)
- [Pricing Strategy](./supabase/functions/analyze-construction/pricing/PricingStrategy.ts)
- [API Documentation](./docs/API.md)

## 🤝 **Contact**

**Ready to revolutionize construction quoting?**

- Website: asktoddy.ai
- Email: hello@asktoddy.ai
- Target Market: UK construction contractors
- Launch: Q1 2025

---

_AskToddy - Where Construction Meets AI Intelligence_
