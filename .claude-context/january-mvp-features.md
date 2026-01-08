# AskToddy Mobile - January MVP Feature Prioritization

## Current Status (60% Complete)

### ✅ Already Implemented

1. **Core App Flow**
   - Site assessment form
   - AI task generation
   - Quote editing
   - Quote sharing

2. **Freemium Infrastructure**
   - AuthContext with tier management
   - Anonymous user support
   - Login/Signup modals
   - Upgrade prompt modals
   - Pricing screen

3. **Data Persistence**
   - AsyncStorage for local data
   - Supabase for cloud sync
   - Session management
   - Auto-save functionality

4. **AI Integration**
   - Gemini 2.0 Flash integration
   - Template fallback system
   - UK pricing engine
   - Intelligent retry logic

## 🚀 MUST HAVE for January Launch (Week 1-2)

### 1. Payment Integration (CRITICAL)

**Priority: P0 - Blocking revenue**

- [ ] RevenueCat integration (simpler than Stripe for mobile)
- [ ] Subscription management
- [ ] Receipt validation
- [ ] Restore purchases flow
- [ ] Payment error handling

### 2. Usage Enforcement (CRITICAL)

**Priority: P0 - Core freemium model**

- [ ] Track quote generation count
- [ ] Enforce 5 quote/month limit for free tier
- [ ] Reset counters monthly
- [ ] Show usage in UI (3/5 quotes used)
- [ ] Graceful limit reached experience

### 3. Premium Features (HIGH)

**Priority: P1 - Key differentiators**

#### Voice-to-Text

- [ ] React Native Voice integration
- [ ] Real-time transcription
- [ ] Add to site notes capture
- [ ] Premium-only gate

#### PDF Export

- [ ] React Native PDF generation
- [ ] Professional quote template
- [ ] Company branding placeholder
- [ ] Email/share PDF
- [ ] Premium-only gate

### 4. Analytics (HIGH)

**Priority: P1 - Need data from day 1**

- [ ] Mixpanel or Amplitude setup
- [ ] Track key events:
  - App opens
  - Sign ups
  - Quote generations
  - Upgrades
  - Feature usage
- [ ] Funnel tracking
- [ ] User properties

### 5. Polish & Stability (HIGH)

**Priority: P1 - App Store ready**

- [ ] Fix all known bugs
- [ ] Error boundaries
- [ ] Offline handling improvements
- [ ] Loading states
- [ ] Empty states

## 📋 NICE TO HAVE for January (Week 3)

### 6. Onboarding Flow

**Priority: P2 - Improves conversion**

- [ ] 3-screen tutorial
- [ ] Value proposition clear
- [ ] Sample quote preview
- [ ] Smooth transition to app

### 7. Quote Templates

**Priority: P2 - Power user feature**

- [ ] Save quote as template
- [ ] Reuse common items
- [ ] Quick quotes for repeat jobs
- [ ] Premium feature

### 8. Email Notifications

**Priority: P2 - Engagement**

- [ ] Welcome email
- [ ] Quote shared confirmation
- [ ] Monthly usage reminder
- [ ] Upgrade prompts

## 🔮 DEFER to February+

### Android Version

- Full React Native Android build
- Google Play Store submission
- Android-specific testing

### Advanced AI Features

- Multi-image analysis
- Historical quote comparisons
- Smart pricing suggestions
- Material recommendations

### Team Features

- Multi-user accounts
- Quote collaboration
- Approval workflows
- Team analytics

### Integrations

- Accounting software (Xero, QuickBooks)
- Supplier catalogs
- Calendar integration
- CRM connections

## Implementation Order (Next 3 Weeks)

### Week 1 (Jan 6-12): Revenue Foundation

1. **Monday-Tuesday**: RevenueCat setup
2. **Wednesday-Thursday**: Usage tracking & limits
3. **Friday**: Payment flow testing

### Week 2 (Jan 13-19): Premium Features

1. **Monday-Tuesday**: Voice-to-text
2. **Wednesday-Thursday**: PDF export
3. **Friday**: Analytics integration

### Week 3 (Jan 20-26): Polish

1. **Monday-Tuesday**: Bug fixes
2. **Wednesday**: Onboarding (if time)
3. **Thursday**: Final testing
4. **Friday**: App Store submission prep

### Week 4 (Jan 27-31): Launch

1. **Monday**: App Store submission
2. **Tuesday-Wednesday**: Marketing site
3. **Thursday-Friday**: Launch & monitor

## Success Criteria for Launch

### Minimum Viable Product

- [ ] Users can pay for premium
- [ ] Free tier limits enforced
- [ ] At least 1 premium feature working
- [ ] Basic analytics tracking
- [ ] No critical bugs

### Target Product

- [ ] Smooth payment flow
- [ ] Voice-to-text working well
- [ ] PDF export professional
- [ ] Comprehensive analytics
- [ ] Polished UX

## Technical Debt to Address

1. **High Priority**
   - Remove unused components
   - Clean up navigation code
   - Standardize error handling
   - Improve TypeScript types

2. **Medium Priority**
   - Optimize bundle size
   - Improve image handling
   - Cache management
   - API response caching

3. **Low Priority**
   - Code documentation
   - Unit test coverage
   - Component library
   - Storybook setup

## Risk Assessment

### High Risk Items

- **Payment integration complexity** → Use RevenueCat for simplicity
- **Voice-to-text reliability** → Have manual fallback
- **App Store rejection** → Start review prep early

### Medium Risk Items

- **Performance issues** → Profile and optimize early
- **User confusion** → Add onboarding if time
- **Server costs** → Monitor API usage closely

### Low Risk Items

- **Analytics setup** → Use proven solutions
- **PDF generation** → Well-documented libraries
- **Bug fixes** → Allocate buffer time

---

_Updated: January 6, 2026_
_Launch Target: End of January 2026_
_Focus: Revenue-generating MVP with core premium features_
