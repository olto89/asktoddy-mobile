# AskToddy Mobile: Freemium Implementation Plan

## Overview

Transform AskToddy from a simple authenticated app to a freemium model that maximizes user acquisition and conversion.

## Work Estimate: 3-4 Days (Jan 6-9)

### Day 1: Core Infrastructure (8 hours)

**Anonymous User Support & Auth Refactor**

- [ ] Update AuthContext to support anonymous users
- [ ] Add user tier tracking (anonymous/free/premium)
- [ ] Modify SiteNotesScreen to work without authentication
- [ ] Create user state persistence for anonymous sessions
- [ ] Add graceful login/logout flows

**Files to modify:**

- `src/contexts/AuthContext.tsx`
- `src/screens/SiteNotesScreen.tsx`
- `supabase/auth` configuration

### Day 2: Paywall & Modals (8 hours)

**Login/Signup & Premium Gates**

- [ ] Create beautiful login/signup modal component
- [ ] Design upgrade prompt modal
- [ ] Implement quote generation paywall
- [ ] Add premium feature gates for export/sharing
- [ ] Create pricing comparison screen

**New components to create:**

- `src/components/modals/LoginSignupModal.tsx`
- `src/components/modals/UpgradePromptModal.tsx`
- `src/screens/PricingScreen.tsx`
- `src/components/ui/FeatureGate.tsx`

### Day 3: Payment & Premium Features (8 hours)

**Monetization & Advanced Features**

- [ ] Integrate Stripe for payments
- [ ] Implement usage limits tracking
- [ ] Add Voice-to-Text for premium users
- [ ] Create Email/WhatsApp sharing for premium
- [ ] Add PDF export with premium branding

**New services:**

- `src/services/StripeService.ts`
- `src/services/PremiumFeatures.ts`
- `src/services/VoiceToTextService.ts`
- `src/services/ShareService.ts`

### Day 4: Polish & Testing (6-8 hours)

**UX Polish & Demo Prep**

- [ ] Add demo mode for investors
- [ ] Polish all user flows and transitions
- [ ] Test freemium conversion funnel
- [ ] Create TestFlight build
- [ ] Prepare investor demo script

## Technical Architecture

### User Tiers

```typescript
interface User {
  id: string;
  email?: string;
  tier: 'anonymous' | 'free' | 'premium';
  quotesUsed: number;
  quotesLimit: number;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  subscriptionId?: string;
}
```

### Feature Matrix

| Feature                | Anonymous           | Free         | Premium        |
| ---------------------- | ------------------- | ------------ | -------------- |
| Site Assessment Form   | ✅                  | ✅           | ✅             |
| AI Quote Generation    | ❌ (Login Required) | ✅ (5/month) | ✅ (Unlimited) |
| Save Drafts            | ❌                  | ✅           | ✅             |
| Voice-to-Text          | ❌                  | ❌           | ✅             |
| PDF Export             | ❌                  | ❌           | ✅             |
| WhatsApp/Email Share   | ❌                  | ❌           | ✅             |
| Priority AI Processing | ❌                  | ❌           | ✅             |
| Quote History          | ❌                  | 30 days      | Unlimited      |

## Key Implementation Details

### 1. Anonymous User Flow

- Allow complete form filling without authentication
- Store data in AsyncStorage with session ID
- Prompt login when attempting to generate quote
- Gracefully migrate anonymous data on signup

### 2. Paywall Strategy

- **Hook**: Let users fill form completely (investment in time)
- **Value Prop**: "Sign up free to generate your AI quote"
- **Social Proof**: Show example quotes, testimonials
- **Urgency**: "Join 10,000+ contractors saving time"

### 3. Premium Conversion

- **Free Limit**: 5 quotes/month (enough to try, not enough for business)
- **Upgrade Triggers**: When hitting limit, trying to export, using voice features
- **Value Focus**: "Save 2+ hours per quote, worth £50+ in time"

### 4. Pricing Strategy (Recommended)

- **Free**: 5 quotes/month, basic features
- **Pro**: £9.99/month - Unlimited quotes, voice-to-text, exports
- **Business**: £19.99/month - Everything + priority support, white-label options

## Success Metrics

- **Activation**: % users who complete first assessment
- **Conversion**: Anonymous → Free signup rate
- **Premium**: Free → Premium conversion rate
- **Retention**: Monthly active users, quote generation frequency

## Risk Mitigation

- **Backup Plan**: If payments fail, manual upgrade process
- **Fallback**: Ensure all core features work without premium
- **Testing**: Comprehensive flow testing before investor demo

## Investor Demo Preparation

- **Demo Account**: Pre-loaded with example data
- **Story Arc**: Anonymous → Signup → Premium upgrade
- **ROI Calculator**: Show contractor time/money savings
- **Market Size**: UK construction industry statistics

## Timeline to MVP Release (Jan 12th)

- **Jan 6-7**: Core infrastructure + paywall
- **Jan 8**: Premium features + payments
- **Jan 9**: Polish + TestFlight build
- **Jan 10-11**: Final testing + demo prep
- **Jan 12**: MVP release ready for investor meeting

This implementation transforms AskToddy into a proper SaaS business model while maintaining the excellent UX we've built.
