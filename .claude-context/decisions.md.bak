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

**Decision:** Use EXPO*PUBLIC* prefix for client-side env vars
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

## Code Quality & Development Standards

### ESLint Configuration

**Decision:** Comprehensive linting with TypeScript, React Native, and React Hooks rules
**Implementation:**

- Maximum file size: 300 lines
- Maximum function length: 50 lines
- Complexity limit: 10 (cyclomatic complexity)
- Import organization with alphabetical sorting
- Security rules (no-eval, no-implied-eval)

**Rationale:**

- Enforces consistent code style across team
- Prevents common React and TypeScript errors
- Reduces cognitive load with automatic formatting
- Catches security vulnerabilities early

### Prettier Integration

**Decision:** Auto-formatting with opinionated config
**Configuration:**

- 100-character line width (readable on laptops)
- Single quotes for consistency
- Trailing commas for cleaner diffs
- Semicolons for clarity

**Rationale:**

- Eliminates style debates and manual formatting
- Consistent code appearance across all files
- Reduces PR review time by focusing on logic
- Industry standard for TypeScript projects

### Pre-commit Hooks (Husky)

**Decision:** Enforce quality gates before commits
**Implementation:**

- lint-staged: Formats and fixes staged files
- TypeScript type checking
- Context saving for session recovery

**Rationale:**

- Prevents broken code from entering repository
- Maintains consistent quality without manual checks
- Saves CI/CD time by catching errors early
- Enforces development standards automatically

### VS Code Integration

**Decision:** Standardized editor configuration for team
**Features:**

- Auto-format on save
- ESLint auto-fix on save
- Import organization on save
- Recommended extensions list

**Rationale:**

- Consistent development experience across team
- Reduces onboarding time for new developers
- Automatic compliance with project standards
- Better developer productivity

### Architecture Documentation

**Decision:** Comprehensive ARCHITECTURE.md with development guide
**Rationale:**

- Faster onboarding for new team members
- Documents design decisions and patterns
- Provides clear coding standards
- Reduces technical debt through standardization
