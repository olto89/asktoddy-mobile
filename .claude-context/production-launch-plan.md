# AskToddy Mobile: Production Launch Plan (iOS Soft Launch)

## Context

AskToddy Mobile is ~70% complete on staging. The app needs to move from a partner's Apple account to Oliver's own Apple Developer account, wire up RevenueCat for real subscriptions, and launch on the iOS App Store as a soft launch with subscriptions enabled from day one. Production Supabase (tggvoqhewfmczyjoxrqu) is suspended and needs reactivation.

---

## Phase 1: Apple Developer Account Setup (Manual - Oliver)

These steps must be done by Oliver in a browser — Claude can't do them.

### 1.1 Enroll in Apple Developer Program

- [ ] Go to https://developer.apple.com/programs/enroll/
- [ ] Sign in with your Apple ID (or create one dedicated to AskToddy)
- [ ] Select **Individual** enrollment ($99/year)
- [ ] Complete identity verification (may require government ID)
- [ ] Pay the $99 fee
- [ ] **Wait for approval** (usually 24-48 hours)

### 1.2 Create the App in App Store Connect

- [ ] Go to https://appstoreconnect.apple.com → My Apps → "+"
- [ ] **Bundle ID**: `com.asktoddy.app` (register this first in Certificates, Identifiers & Profiles)
- [ ] **App Name**: AskToddy
- [ ] **Primary Language**: English (UK)
- [ ] **Category**: Business or Utilities
- [ ] **SKU**: `asktoddy-ios`
- [ ] Note down the **ASC App ID** (numeric) — needed for eas.json

### 1.3 Accept Paid Applications Agreement

- [ ] App Store Connect → Agreements, Tax, and Banking
- [ ] Accept the **Paid Applications** agreement
- [ ] Enter bank account details for receiving payments
- [ ] Enter tax information
- [ ] **This must be completed before subscriptions can be created**

### 1.4 Create Subscription Products in App Store Connect

- [ ] App Store Connect → Your App → Subscriptions
- [ ] Create Subscription Group: **"AskToddy Premium"**
- [ ] Add subscription: **asktoddy_pro_monthly**
  - Price: £9.99/month
  - Display name: "AskToddy Pro Monthly"
  - Description: "Unlimited AI quotes, voice-to-text, priority support"
- [ ] Add subscription: **asktoddy_pro_annual**
  - Price: £79.99/year (saves ~33%)
  - Display name: "AskToddy Pro Annual"
  - Description: "Unlimited AI quotes, voice-to-text, priority support"
- [ ] Submit both for review (can be reviewed alongside the app)

### 1.5 Enable In-App Purchase Capability

- [ ] Certificates, Identifiers & Profiles → Identifiers → `com.asktoddy.app`
- [ ] Enable **In-App Purchase** capability
- [ ] Regenerate provisioning profiles if needed

### 1.6 Create Sandbox Tester

- [ ] App Store Connect → Users and Access → Sandbox → Testers
- [ ] Create a sandbox test account (use a non-real email)
- [ ] Note credentials — needed for testing purchases on device

---

## Phase 2: RevenueCat Setup (Manual - Oliver, then Claude for code)

### 2.1 RevenueCat Dashboard Setup (Manual)

- [ ] Log into https://app.revenuecat.com (account already exists)
- [ ] Create a **new iOS app** under the AskToddy project for production
  - Bundle ID: `com.asktoddy.app`
  - Connect to your **new** App Store Connect account (using App Store Connect API key)
- [ ] Get the **production iOS API key** (will be different from staging `appl_fzMpeIdnKZEhSbuJxHucxfSlVwx`)
- [ ] Create entitlement: **premium**
- [ ] Create offering: **default**
  - Add monthly package → link to `asktoddy_pro_monthly`
  - Add annual package → link to `asktoddy_pro_annual`

### 2.2 Code Changes (Claude)

**Files to modify:**

#### `.env.production` — Update RevenueCat key

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<new_production_key>
```

#### `app.json` — Update bundle ID and metadata

- Change `ios.bundleIdentifier` from `com.asktoddy.staging` to `com.asktoddy.app`
- Keep Android as-is (iOS-only launch)

#### `eas.json` — Update production submit config

- Update `production.submit.ios.ascAppId` with new ASC App ID
- Update `production.submit.ios.appleId` if using a different Apple ID
- Add Apple Team ID from new developer account

#### Wire payment UI to RevenueCat:

- **`src/screens/PricingScreen.tsx`** — Replace "Coming Soon" with real RevenueCat purchase flow using `useSubscription` hook
- **`src/components/modals/UpgradePromptModal.tsx`** — Verify wired to RevenueCat (already partially done)
- **`src/services/SubscriptionService.ts`** — Either gut this and delegate to RevenueCat, or remove it entirely since RevenueCatService handles everything

---

## Phase 3: Production Supabase (Manual + Claude)

### 3.1 Reactivate Supabase (Manual)

- [ ] Go to https://supabase.com/dashboard
- [ ] Find project `tggvoqhewfmczyjoxrqu`
- [ ] Reactivate (may require upgrading plan or contacting support)
- [ ] Confirm URL: `https://tggvoqhewfmczyjoxrqu.supabase.co`

### 3.2 Deploy to Production Supabase (Claude)

- [ ] Apply database migrations:
  - `20260316_quotes_table.sql`
  - `20260326_fix_company_logos_rls.sql`
  - Any other pending migrations
- [ ] Deploy edge functions:
  - `analyze-construction`
  - `delete-account`
  - `sync-quotes`
- [ ] Set edge function secrets (Gemini API key, etc.)
- [ ] Verify `.env.production` has correct Supabase URL and anon key

---

## Phase 4: Production Build Configuration (Claude)

### 4.1 Update app.json for production

- `ios.bundleIdentifier`: `com.asktoddy.app`
- Verify `icon`, `splash`, app name are production-ready
- Ensure `version` is appropriate for initial App Store release (consider `1.0.0` for fresh store listing)

### 4.2 Update eas.json

- Production submit profile with new ASC App ID and Apple Team ID
- Verify production build uses `.env.production`

### 4.3 App Store Listing Preparation

- [ ] Screenshots (Oliver to provide or generate from simulator)
- [ ] App description, keywords, support URL
- [ ] Privacy policy URL (PrivacyPolicyScreen exists — need a hosted URL too)
- [ ] App icon (1024x1024 for App Store)

---

## Phase 5: Build, Test & Submit (Claude + Oliver)

### 5.1 Development Client Build (for sandbox testing)

```bash
eas build --profile development --platform ios --non-interactive
```

- Install on physical device
- Test sandbox purchases with sandbox tester account
- Verify subscription status flows through to AuthContext

### 5.2 Production Build & Submit

```bash
# Bump version to 1.0.0 for fresh App Store listing
# Build and auto-submit to App Store Connect
eas build --profile production --platform ios --auto-submit --non-interactive
```

### 5.3 App Store Review

- [ ] Fill out App Store Connect listing (screenshots, description, etc.)
- [ ] Submit for App Review
- [ ] Respond to any review feedback
- [ ] **Expected review time**: 1-3 days

---

## Order of Operations

1. **Oliver does Phase 1** (Apple Developer enrollment) — 1-2 days for approval
2. **Oliver does Phase 2.1** (RevenueCat dashboard) — 30 mins once Apple account active
3. **Claude does Phases 2.2 + 3.2 + 4** (code changes) — can start as soon as Oliver provides:
   - New Apple Team ID
   - New ASC App ID
   - New RevenueCat production API key
   - Production Supabase reactivated + anon key confirmed
4. **Phase 5** (build, test, submit) — 1 day
5. **App Review** — 1-3 days

**Estimated total: 5-7 days to App Store**

---

## Verification

- [ ] Sandbox purchase completes successfully
- [ ] Premium status reflects in app after purchase
- [ ] Quote limits removed for premium users
- [ ] Restore purchases works
- [ ] Free tier enforces 5 quotes/month limit
- [ ] App runs against production Supabase without errors
- [ ] AI quote generation works on production edge function
- [ ] All tests pass: `npm test`
- [ ] Production build installs and runs correctly
