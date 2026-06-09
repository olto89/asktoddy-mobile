# AskToddy Mobile - Architectural Decision Records

## Project Context

Revolutionary AI-powered construction quoting mobile app targeting January 15, 2025 investor meeting.

---

## Decision Record Format

- **Date**: Decision date
- **Status**: Accepted | Superseded | Deprecated
- **Context**: Why this decision was needed
- **Decision**: What was decided
- **Consequences**: Outcomes and trade-offs

---

## ADR-001: MVP Pivot to Guided Note-Taking

**Date**: December 2024  
**Status**: Accepted

**Context**: Original chat-based interface was too complex and didn't provide enough structure for accurate quotes. Needed clearer user flow for investor demo.

**Decision**: Pivot to guided note-taking workflow:

1. Structured site assessment screen
2. AI-powered task generation
3. Interactive quote editing
4. Professional sharing

**Consequences**:
✅ More accurate quote generation  
✅ Better user experience for tradespeople  
✅ Clearer value proposition for investors  
❌ Reduced conversational flexibility

---

## ADR-002: Single-Provider AI Architecture

**Date**: November 2024  
**Status**: Accepted

**Context**: Previous complex multi-provider system was over-engineered for MVP. Needed simplicity and reliability.

**Decision**: Simplified to Gemini 2.0 Flash with template fallback:

- Primary: Gemini API for AI analysis
- Fallback: High-quality UK pricing templates
- No complex provider switching logic

**Consequences**:
✅ Reduced complexity and maintenance burden  
✅ More predictable API costs  
✅ Faster development velocity  
❌ Single point of failure for AI features

---

## ADR-003: Expo Go Compatibility Priority

**Date**: December 22, 2025  
**Status**: Accepted

**Context**: "Runtime not ready" errors were blocking development. Rapid iteration was critical for MVP timeline.

**Decision**: Remove dependencies incompatible with Expo Go:

- Removed react-native-reanimated
- Removed react-native-gesture-handler
- Replaced drawer navigation with stack + modal

**Consequences**:
✅ Instant development feedback loop  
✅ No build time for testing  
✅ Team can test immediately on devices  
❌ Limited animation capabilities  
❌ Less native-feeling navigation

---

## ADR-004: Intelligent Retry Logic Implementation

**Date**: December 22, 2025  
**Status**: Accepted

**Context**: API quota exhaustion after just a few quotes due to aggressive retry logic (3 retries = 4x API usage per quote).

**Decision**: Implement error-type-based intelligent retry:

- Rate limits (429): NO RETRY (preserve quota)
- Auth errors (401/403): NO RETRY (won't help)
- Server errors (500-599): 1 RETRY (might recover)
- Network errors: 1 RETRY (transient)
- Bad requests (400): NO RETRY (client error)

**Consequences**:
✅ 4x improvement in API quota efficiency  
✅ Faster failures for permanent errors  
✅ Smart recovery for transient issues  
❌ Potentially less resilient to temporary rate limits

---

## ADR-005: Template-Based Fallback System

**Date**: December 2024  
**Status**: Accepted

**Context**: Need reliable quote generation even when AI APIs fail or quotas are exhausted.

**Decision**: Comprehensive UK construction templates by job type:

- Extension, bathroom, kitchen, roofing, renovation templates
- Realistic UK market pricing (materials + labor)
- Professional task breakdown structure
- Seamless fallback when AI unavailable

**Consequences**:
✅ 100% reliable quote generation  
✅ High-quality output even without AI  
✅ Consistent UK market pricing  
❌ Less personalized than AI analysis  
❌ Manual maintenance of pricing data

---

## ADR-006: Modal Menu Over Drawer Navigation

**Date**: December 22, 2025  
**Status**: Accepted

**Context**: Drawer navigation required react-native-gesture-handler which was incompatible with Expo Go and causing runtime errors.

**Decision**: Replace drawer with modal-based menu system:

- Hamburger icon in header launches modal
- Full-screen modal with user profile, saved quotes, settings
- Consistent with stack navigation architecture

**Consequences**:
✅ Expo Go compatibility maintained  
✅ Simpler navigation stack  
✅ Professional appearance  
❌ Less discoverable than side drawer  
❌ Requires extra tap to access menu

---

## ADR-007: AsyncStorage + Supabase Hybrid Storage

**Date**: November 2024  
**Status**: Accepted

**Context**: Need offline capability for site visits while maintaining cloud sync for quote management.

**Decision**: Hybrid storage architecture:

- AsyncStorage: Local quote drafts, session data, offline cache
- Supabase: User accounts, shared quotes, conversation history
- Sync mechanism: Upload local quotes when online

**Consequences**:
✅ Works offline at construction sites  
✅ Data persistence across app restarts  
✅ Cloud backup for important quotes  
❌ Increased complexity for data sync  
❌ Potential data conflicts to resolve

---

## ADR-008: UK-Focused Pricing and Standards

**Date**: November 2024  
**Status**: Accepted

**Context**: Need market-specific accuracy for investor credibility and user adoption.

**Decision**: Deep focus on UK construction market:

- UK material pricing (Jewson, Wickes, Travis Perkins)
- UK labor rates by region
- UK building regulations compliance
- UK measurement units (metric)
- UK trade terminology

**Consequences**:
✅ High accuracy for target market  
✅ Credible for UK investors  
✅ Relevant for UK tradespeople  
❌ Not applicable to other markets  
❌ Requires ongoing UK market research

---

## ADR-009: Professional Quote Sharing Format

**Date**: December 2024  
**Status**: Accepted

**Context**: Generated quotes needed to look professional enough for tradespeople to send to customers.

**Decision**: Professional quote format with:

- Company branding placeholders
- Itemized task breakdown with costs
- Material specifications
- Labor estimates
- Terms and conditions
- PDF export capability

**Consequences**:
✅ Professional output suitable for customers  
✅ Builds trust in the platform  
✅ Encourages user adoption  
❌ More complex formatting requirements  
❌ Need PDF generation capability

---

## ADR-010: Session-Based Conversation Context

**Date**: November 2024  
**Status**: Accepted

**Context**: Need conversation continuity for improved AI quote accuracy over multiple interactions.

**Decision**: Implement session-based context management:

- Persistent session IDs in AsyncStorage
- Conversation history stored in Supabase
- Context passed to AI for improved responses
- Session management across app restarts

**Consequences**:
✅ Improved AI accuracy with context  
✅ Conversation continuity  
✅ Better user experience  
❌ Increased storage requirements  
❌ More complex session management

---

## ADR-011: Middleware-First Architecture (CRITICAL)

**Date**: December 23, 2025  
**Status**: Accepted

**Context**: Discovered major architectural flaw where frontend was parsing AI responses instead of edge function returning structured data. This completely defeated the purpose of having middleware.

**Decision**: Enforce strict middleware-first architecture:

- **Edge Function**: Returns fully structured `ProjectAnalysis` objects
- **Frontend**: Only displays structured data (NO parsing/business logic)
- **Data Flow**: User Input → Frontend → Edge Function → AI → Structured Response → Frontend
- **Error Handling**: Edge function returns structured fallback data (not frontend templates)
- **Type Safety**: Shared TypeScript interfaces between frontend/backend

**Consequences**:
✅ True separation of concerns  
✅ Centralized business logic in edge function  
✅ Frontend becomes simple presentation layer  
✅ Easier testing and debugging  
✅ Consistent data structure regardless of AI provider  
❌ More complex edge function development  
❌ Requires careful type definition alignment

---

## Current Architecture Summary

### Core Technology Stack

- **Mobile Framework**: React Native with Expo
- **Navigation**: Stack Navigator with Modal Menu
- **State Management**: React Context + AsyncStorage
- **Authentication**: Supabase Auth
- **Backend**: Supabase (Database + Edge Functions)
- **AI Provider**: Gemini 2.0 Flash
- **Development**: Expo Go compatible

### Key Architectural Principles

1. **Simplicity Over Complexity**: Choose simple, reliable solutions
2. **Offline-First**: Core functionality works without internet
3. **Graceful Degradation**: Template fallbacks for all AI features
4. **UK Market Focus**: Specialized for UK construction industry
5. **Investor Demo Ready**: Professional, reliable, impressive

### Success Metrics

- **Development Velocity**: Rapid iteration with Expo Go
- **Reliability**: 100% uptime with template fallbacks
- **User Experience**: Professional, intuitive interface
- **API Efficiency**: 4x quota improvement
- **Market Fit**: UK construction standards compliance

---

---

## ADR-012: Own iOS Developer Account from Outset

**Date**: May 2026
**Status**: Accepted

**Context**: App was previously being developed under partner's App Store Connect account. Want full control from launch day — own DUNS, own developer account, own revenue.

**Decision**: Wait for DUNS number and set up own Apple Developer account before submitting to App Store. Reconfigure RevenueCat and all App Store Connect assets under own account.

**Consequences**:
✅ Full ownership and control from day one
✅ Clean revenue split (no partner dependency)
✅ Professional setup for future investors
❌ Delays launch until DUNS arrives
❌ RevenueCat needs reconfiguring (new bundle ID, new API keys)

---

## ADR-013: iOS-First Launch, Android June Follow-Up

**Date**: May 2026
**Status**: Accepted

**Context**: Limited time and capacity. Need to focus efforts for a quality launch rather than splitting across platforms.

**Decision**: Launch iOS only by end of May 2026. Android follows in June 2026.

**Consequences**:
✅ Focused QA and polish on one platform
✅ Faster time to market
✅ Learn from iOS launch before Android
❌ Miss Android users initially
❌ Two separate launch efforts

---

## ADR-014: Drop Investor Meeting, Focus on Product

**Date**: May 2026
**Status**: Accepted

**Context**: Investor meeting timelines kept slipping. Better to focus on shipping a quality product and let traction speak for itself.

**Decision**: Remove investor meeting from timeline. Focus purely on product launch and user acquisition.

**Consequences**:
✅ No artificial deadline pressure
✅ Focus on real users, not demos
✅ Can approach investors with real data later
❌ No external accountability deadline

---

## ADR-015: Proper Sign-Out After Account Deletion

**Date**: June 4, 2026
**Status**: Accepted

**Context**: `deleteAccount()` manually cleared state (`setUser`, `setSession`, `AsyncStorage`) after the edge function deleted the user server-side. This never called `supabase.auth.signOut()`, so the `SIGNED_OUT` auth event never fired and stale session tokens could linger. Apple requires account deletion to properly sign the user out.

**Decision**: After successful edge function call + RevenueCat cleanup + quote storage clear, call `authHelpers.signOut()` instead of duplicating cleanup code. The existing `SIGNED_OUT` auth listener already handles reverting to anonymous state.

**Consequences**:
✅ Proper session invalidation through Supabase auth system
✅ `SIGNED_OUT` event fires, triggering auth listener cleanup
✅ No stale session tokens
✅ Eliminates duplicated cleanup code
✅ App Store review compliance for account deletion
❌ None — strictly an improvement

---

## ADR-016: Park ONS Construction Price Index Integration

**Date**: June 9, 2026
**Status**: Accepted

**Context**: The edge function has a partially-built ONS (Office for National Statistics) construction price index integration (`_shared/ons-service.ts`, `update-ons-cache`, `ons_pricing_cache` table) intended to improve quote accuracy with real UK government price data. It is not wired into the live quote flow (`analyze-construction/index.ts`), and the cache cron currently feeds **mock data** (`update-ons-cache/index.ts` has an explicit `TODO: Replace with real ONS API calls`).

Investigation (June 9) of third-party pricing APIs/SDKs concluded **none are worth the integration risk**. For ONS specifically:

- The Construction Output Price Indices (OPI) data is free and public, **but only published as a quarterly XLSX spreadsheet** — there is no clean JSON/CSV API. The ONS beta API exposes construction _output volume_, not _price indices_.
- Parsing the XLSX is brittle (layout shifts between releases) and the data only updates 4×/year, making automation poor value.
- Even with real data, the gain is a ±2-5% trend nudge on top of Gemini's already-current pricing — a correctness signal, not a needle-mover.

**Decision**: Park the ONS integration. Do not wire it into the quote flow or build XLSX parsing. Leave the scaffolding in place (dormant) for a possible post-launch revisit. If pursued later, the sane path is **manual quarterly entry** of ~4-8 index numbers into `ons_pricing_cache`, not automated parsing.

**Consequences**:
✅ No effort spent on brittle, low-value parsing pre-launch
✅ Focus stays on launch-critical work
✅ Scaffolding remains if we want it later
❌ No real ONS-driven price adjustment (acceptable — Gemini prices at current market rates)

---

## ADR-017: Quoting Consistency & Quality Improvements

**Date**: June 9, 2026
**Status**: Accepted

**Context**: AI quoting is not the primary USP, but inconsistent or wildly-off quotes lose repeat users. Three concrete issues were found in `analyze-construction/index.ts`:

1. The Gemini call sent **no `generationConfig`** — default temperature (~1.0) meant identical site notes could produce materially different quotes each run, and JSON was prompt-coaxed + regex-extracted (flaky → silent template fallback).
2. The materials-vs-labour breakdown used a **hardcoded 60/40 split** on every quote regardless of trade.
3. Confidence was **whatever the AI invented** (`summary.confidence || 75`), ungrounded in actual input.

**Decision**:

1. Add `GEMINI_GENERATION_CONFIG` (`temperature: 0.2`, `seed: 42`, `responseMimeType: 'application/json'`) — near-deterministic pricing + native JSON output. Model is now a single `GEMINI_MODEL` constant (free-tier `gemini-2.5-flash` now; upgrade to `gemini-3.5-flash` on paid tier — current stable as of June 2026).
2. Replace the flat split with `materialFraction()` — uses an AI-provided per-task `material_pct` (clamped 15-85%), falling back to a project-type default. Totals unchanged; only the breakdown is now trade-realistic.
3. Replace invented confidence with `calculateGroundedConfidence()`, scored from real input richness (photos, dimensions, location, finish level, detail).

Covered by `analyze-construction/__tests__/quoteQuality.test.ts` (16 cases). Deferred (ticketed, not done): making Gemini output base prices and applying the size/location/spec multipliers **deterministically in code** rather than trusting the LLM's arithmetic.

**Consequences**:
✅ Consistent quotes for identical inputs (biggest lever)
✅ Fewer parse failures → fewer degraded template-fallback quotes
✅ Honest materials/labour breakdown and grounded confidence
✅ One-line model upgrade path for paid tier
❌ Multiplier arithmetic still trusted to the LLM (deferred to a follow-up)

---

_Last Updated: June 9, 2026_
