# Architecture & Implementation Decisions

## AI Service Architecture

### Provider Pattern
**Decision:** Multi-provider system with automatic fallback
**Rationale:** 
- Ensures reliability even if primary provider fails
- Allows easy addition of new AI providers (OpenAI, Anthropic, etc.)
- Mock provider enables offline development and testing

### Middleware Layer
**Decision:** AIMiddleware as orchestration layer
**Implementation:**
- Manages provider registration and health checks
- Handles timeout and retry logic
- Integrates with pricing service for real-time cost data
- Provides consistent response format

## Image Processing

### Analysis Trigger
**Decision:** Analyze immediately after capture
**Rationale:**
- Better UX - user sees progress immediately
- Can show results even if analysis fails
- Reduces cognitive load (one action, not two)

### Image Quality
**Decision:** 0.8 quality, 4:3 aspect ratio
**Rationale:**
- Balances file size with analysis quality
- Standard aspect ratio for construction photos
- Reduces upload time and API costs

## Error Handling

### Graceful Degradation
**Decision:** Always navigate to results, even on failure
**Implementation:**
- Show image even if analysis fails
- Provide user-friendly error messages
- Log detailed errors for debugging
- Fallback to mock provider if available

## Configuration Management

### Environment Variables
**Decision:** Use EXPO_PUBLIC_ prefix for client-side env vars
**Rationale:**
- Expo's recommended approach
- Clear distinction between server and client configs
- Type-safe access through config module

### Centralized Config
**Decision:** Single source of truth in `/src/config/index.ts`
**Rationale:**
- Type-safe configuration
- Easy to modify for different environments
- Single import for all config needs

## State Management

### Context for Auth
**Decision:** React Context for authentication
**Rationale:**
- Simple for auth state that rarely changes
- No need for heavy state management library yet
- Easy to integrate with navigation

### Local State for UI
**Decision:** Component-level state for UI interactions
**Rationale:**
- Keeps components self-contained
- Reduces complexity
- Easier to test

## Pricing Integration

### Real-time Updates
**Decision:** Integrate pricing service with AI analysis
**Rationale:**
- Provides accurate, current market prices
- Enhances AI estimates with real data
- Better value for users

### Caching Strategy
**Decision:** 1-hour cache for pricing data
**Rationale:**
- Reduces API calls
- Prices don't change minute-to-minute
- Configurable per deployment

## Testing Strategy

### Mock Provider First
**Decision:** Develop with mock provider, test with real
**Rationale:**
- Faster development cycles
- No API costs during development
- Predictable responses for testing

## Security Considerations

### API Key Management
**Decision:** Environment variables, never committed
**Rationale:**
- Standard security practice
- Easy to rotate keys
- Different keys per environment

### Supabase RLS
**Decision:** Rely on Supabase Row Level Security
**Rationale:**
- Database-level security
- Consistent with web app
- Reduces attack surface