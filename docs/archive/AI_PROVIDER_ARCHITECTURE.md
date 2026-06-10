# AI Provider Architecture - AskToddy Mobile

## Overview

AskToddy uses a **simplified single-provider architecture** for AI-powered construction analysis. This approach ensures consistent responses, predictable costs, and easier debugging.

## Architecture Decision (2025-11-24)

### Previous Architecture ❌

- Complex multi-provider fallback chains
- "Smart" provider selection based on request type
- Provider switching mid-conversation
- Result: Inconsistent responses and unpredictable behavior

### Current Architecture ✅

- **Single provider per environment**
- **Consistent responses** throughout conversations
- **Focus on pricing/materials logic** instead of provider complexity
- **Clear cost control** with single API usage

## Provider Configuration

### Development/Testing

```typescript
// Gemini for development and testing
const config = {
  provider: 'gemini',
  timeoutMs: 20000,
  enablePricingEnhancement: true,
};
```

### Production

```typescript
// OpenAI for production (when ready)
const config = {
  provider: 'openai',
  timeoutMs: 20000,
  enablePricingEnhancement: true,
};
```

### Environment Variable Control

Set `AI_PROVIDER` environment variable in Supabase:

```bash
# For testing (default)
AI_PROVIDER=gemini

# For production
AI_PROVIDER=openai
```

## Implementation

### Edge Function Configuration

```typescript
// supabase/functions/analyze-construction/index.ts
const getMiddlewareConfig = (): SimplifiedMiddlewareConfig => {
  const env = getEnvironment();

  // Use environment variable or default to gemini for testing
  const provider = env.AI_PROVIDER === 'openai' ? 'openai' : 'gemini';

  return {
    provider,
    timeoutMs: 20000,
    enablePricingEnhancement: true, // Always enhance with pricing data
  };
};
```

### Simplified Middleware

```typescript
// No provider selection logic
// No fallback chains
// Just single provider execution
async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
  const result = await this.provider.analyzeImage(request);
  return result;
}
```

## Benefits

### 1. Consistency

- Same provider handles entire conversation
- No mid-conversation provider switches
- Predictable response format

### 2. Cost Control

- Single API to monitor and budget
- No redundant fallback API calls
- Clear usage metrics

### 3. Debugging

- Single point of failure to investigate
- Clear error messages
- No complex fallback logic to trace

### 4. Performance

- No provider selection overhead
- No retry delays
- Direct API calls

## Focus Areas

With provider complexity removed, development focuses on:

### 1. Pricing Engine

- Real-time material pricing from UK suppliers
- Labor cost calculations
- Tool hire integration
- Regional price variations

### 2. Material Intelligence

- Accurate quantity calculations
- Material specifications
- Supplier recommendations
- Alternative materials suggestions

### 3. Conversation Context

- Session persistence
- Context-aware responses
- Project profile building
- Intelligent question flow

## Migration Guide

### From Multi-Provider to Single Provider

1. **No frontend changes required** - Uses same edge function endpoint
2. **Backend only** - Update edge function configuration
3. **Environment variable** - Set `AI_PROVIDER` if changing from default

### Testing Different Providers

```bash
# Test with Gemini (default)
npx supabase functions deploy analyze-construction

# Test with OpenAI
npx supabase secrets set AI_PROVIDER=openai
npx supabase functions deploy analyze-construction
```

## Error Handling

### Single Provider Failure

When the provider fails:

1. Return clear error message
2. Log error details for debugging
3. No automatic fallback (intentional)
4. User can retry the same request

```typescript
catch (error) {
  console.error(`❌ Provider ${this.config.provider} failed:`, error);
  throw new Error(`AI analysis failed: ${error?.message || error}`);
}
```

## Future Considerations

### Provider Switching

If we need to switch providers:

1. Change environment variable
2. Redeploy edge function
3. No code changes required
4. No frontend rebuild required

### A/B Testing

If needed, implement at request level:

```typescript
// Could add user-level provider assignment
const provider = getUserAssignedProvider(userId) || 'gemini';
```

## Monitoring

Track single provider metrics:

- Response time
- Error rate
- Token usage
- Cost per request

No need to track:

- Provider selection patterns ❌
- Fallback success rates ❌
- Provider comparison metrics ❌

## Summary

**Single provider architecture** provides:

- ✅ Predictable behavior
- ✅ Consistent responses
- ✅ Clear cost control
- ✅ Easier debugging
- ✅ Focus on business logic

**Not provider complexity**:

- ❌ Smart selection algorithms
- ❌ Fallback chains
- ❌ Provider comparison
- ❌ Complex retry logic
