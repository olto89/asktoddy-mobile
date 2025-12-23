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

_Last Updated: December 22, 2025_
