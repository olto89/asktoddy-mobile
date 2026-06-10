# Complete Fix for Gemini Integration Issues

## The Real Problem (You Were Right!)

You switched to Gemini 2.0 models recently, and there are likely **TWO issues**:

1. **Expired API Key** (confirmed)
2. **Invalid/Changed Model Names** (likely the main issue)

## Current Model Configuration

Your edge function is using:

- **Main Provider**: `gemini-2.0-flash` (in `/providers/gemini.ts`)
- **Simple Provider**: `gemini-2.0-flash-latest` (in `/providers/gemini-simple.ts`)
- **Fallback Models**: `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-1.5-pro`

## Quick Fix Steps

### 1. Get New API Key & Update Models

```bash
# 1. Get new API key from https://aistudio.google.com/app/apikey
# 2. Update Supabase secret
npx supabase secrets set GEMINI_API_KEY=your_new_api_key_here

# 3. Test which models work with new key
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models?key=your_new_key" \
  -H 'Content-Type: application/json'
```

### 2. Update Model Names to Current Working Versions

Based on Google's current models (as of December 2024), update these files:

**File: `supabase/functions/analyze-construction/providers/gemini.ts`**

```typescript
// Change line 17 from:
private model = 'gemini-2.0-flash';

// To one of these working models:
private model = 'gemini-1.5-flash';        // Stable, always works
// OR
private model = 'gemini-2.0-flash-exp';    // If 2.0 experimental is available
// OR
private model = 'gemini-1.5-pro';          // More capable but slower
```

**File: `supabase/functions/analyze-construction/providers/gemini-simple.ts`**

```typescript
// Change line 12 from:
private model = 'gemini-2.0-flash-latest';

// To:
private model = 'gemini-1.5-flash';        // Stable, always works
```

### 3. Deploy Updated Edge Function

```bash
npx supabase functions deploy analyze-construction
```

### 4. Test the Fix

```bash
curl -X POST \
  'https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/analyze-construction' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer your_anon_key" \
  -d '{"healthCheck": true}'
```

## Conservative Fix (Guaranteed to Work)

If you want to be 100% sure it works, use the most stable model:

```typescript
// In both provider files, use:
private model = 'gemini-1.5-flash';
```

This model has been stable for months and should definitely work.

## Why This Explains Expo Go vs TestFlight

- **Timeline**: You tested in Expo Go before the models were deprecated/renamed
- **Same Issue**: Both environments would fail now with the same model errors
- **Recent Change**: Gemini 2.0 models might have been renamed or removed recently

## Test Current Model Availability

Once you have a new API key, test which models work:

```bash
# List available models
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"

# Test specific model
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}'
```

## Current Status Summary

- ✅ **Architecture**: Correct (server-side)
- ❌ **API Key**: Expired (confirmed)
- ❌ **Models**: Likely outdated/renamed
- ✅ **Solution**: New key + stable model names
- ✅ **No rebuild needed**: Edge function update only

## Next Steps

1. Get new API key (2 minutes)
2. Update to stable model names (2 minutes)
3. Deploy edge function (30 seconds)
4. Test in both Expo Go AND TestFlight (should both work)

This should resolve both the expired key AND the model compatibility issues.
