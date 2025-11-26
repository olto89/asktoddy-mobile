# API Security Guidelines - AskToddy Mobile

## Overview

This document establishes security patterns for API key management in the AskToddy mobile application to prevent accidental exposure and maintain proper separation of concerns.

## ✅ Correct Architecture Pattern

### Server-Side Only (Supabase Edge Functions)

```bash
# Set secrets in Supabase (server-side only)
npx supabase secrets set GEMINI_API_KEY=<api_key>
npx supabase secrets set OPENAI_API_KEY=<api_key>
```

### Frontend API Calls

```typescript
// Correct: Call edge functions without exposing API keys
const { data, error } = await supabase.functions.invoke('analyze-construction', {
  body: {
    message: userMessage,
    sessionId: sessionId,
    userId: userId,
  },
});
```

## ❌ Patterns to Avoid

### Never Use Client-Side API Keys

```typescript
// WRONG: Never expose API keys in frontend code
const GEMINI_API_KEY = 'AIzaSy...'; // ❌ Security risk

// WRONG: Never use EXPO_PUBLIC_ for API keys
EXPO_PUBLIC_GEMINI_API_KEY=<key> // ❌ Exposed in builds
```

### Never Use Direct API Calls from Frontend

```typescript
// WRONG: Direct API calls expose keys
fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
    API_KEY
);
```

## 🔒 Security Checklist

### Before Deploying

- [ ] No API keys in `eas.json` environment variables
- [ ] No API keys in `.env` files committed to git
- [ ] All API keys stored as Supabase secrets
- [ ] Frontend only calls edge functions
- [ ] Edge functions validate requests and rate limit

### During Development

- [ ] Use `.env.local` for development keys (gitignored)
- [ ] Test edge functions with curl before frontend integration
- [ ] Verify secrets deployed: `npx supabase secrets list`
- [ ] Monitor API usage and costs regularly

## 🚨 Incident Response

### If API Key Exposed

1. **Immediately revoke** the exposed key
2. **Generate new key** from provider console
3. **Update Supabase secret**: `npx supabase secrets set API_KEY=<new_key>`
4. **Redeploy edge functions**: `npx supabase functions deploy`
5. **Audit usage** for potential abuse
6. **Review code** for other exposures

### Recovery Time

- ✅ **Backend only**: Immediate (no rebuild required)
- ❌ **Frontend exposed**: Requires new build + TestFlight review

## 📝 Historical Context

### 2025-11-24 Incident

- **Issue**: Gemini API not working
- **Root Cause**: Expired API key in Supabase secrets (backend)
- **Resolution**: Updated secret, no rebuild required
- **Lesson**: Proper architecture already in place, just maintenance needed

This incident confirmed our architecture is correct - the app was already using edge functions properly.

## 🔄 Maintenance

### Regular Tasks

- [ ] **Monthly**: Review API usage and costs
- [ ] **Quarterly**: Rotate API keys as security best practice
- [ ] **Before major releases**: Audit all secrets and environment variables
- [ ] **After incidents**: Update this document with lessons learned

## References

- [Supabase Edge Functions Security](https://supabase.com/docs/guides/functions/secrets)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Google AI API Security](https://ai.google.dev/tutorials/security)
