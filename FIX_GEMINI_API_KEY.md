# URGENT: Fix Expired Gemini API Key

## Problem Identified

The Gemini API key has **EXPIRED** and needs to be renewed immediately.

**Error Message:**

```
"API key expired. Please renew the API key."
```

## Quick Fix Steps

### 1. Get a New Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Create a new API key or renew the existing one
3. Copy the new key

### 2. Update Supabase Secret (Production Fix)

```bash
# Update the secret in Supabase (this fixes it for all users immediately)
npx supabase secrets set GEMINI_API_KEY=your_new_api_key_here

# Deploy the edge function to apply the change
npx supabase functions deploy analyze-construction
```

### 3. Update Local Environment Files (For Testing)

```bash
# Update .env.staging
EXPO_PUBLIC_GEMINI_API_KEY=your_new_api_key_here  # NOT NEEDED - Remove this line

# Update .env.production
EXPO_PUBLIC_GEMINI_API_KEY=your_new_api_key_here  # NOT NEEDED - Remove this line
```

**IMPORTANT**: The API key should ONLY be in Supabase secrets, not in the mobile app!

### 4. Verify It's Working

```bash
# Test the edge function
curl -X POST \
  'https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/analyze-construction' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"healthCheck": true}'
```

Expected response:

```json
{
  "success": true,
  "health": {
    "provider": "gemini",
    "status": "healthy"
  }
}
```

## No App Rebuild Required!

Since the architecture correctly uses server-side secrets:

- ✅ Fix is instant for all users
- ✅ No TestFlight update needed
- ✅ No App Store submission required
- ✅ Just update the Supabase secret

## Preventing This in Future

1. **Set up monitoring**: Check API key validity weekly
2. **Calendar reminder**: Renew keys before expiry
3. **Multiple keys**: Rotate between keys to avoid hitting limits
4. **Alerts**: Set up alerts for API failures

## Current Status

- ❌ Current key: `AIzaSyCzzjHyKVEw2lANqgr_VsOMZJ2BKCCrjmo` (EXPIRED)
- 🔄 Action needed: Get new key from Google AI Studio
- ✅ Architecture: Correct (server-side only)
- ✅ No app rebuild needed
