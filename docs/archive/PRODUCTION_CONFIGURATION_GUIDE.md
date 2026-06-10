# Production Configuration Guide for AskToddy Mobile

## Architecture Overview

AskToddy Mobile uses a **secure server-side architecture** for AI integration:

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────┐
│   Mobile App    │──────▶│ Supabase Edge    │──────▶│  Gemini AI  │
│  (No API Keys)  │       │    Functions     │       │     API     │
└─────────────────┘       └──────────────────┘       └─────────────┘
                               ▲
                               │
                          Server-side
                            Secrets
```

## ✅ Correct Configuration

### 1. Server-Side Secrets (Supabase)

```bash
# Set API keys as Supabase secrets (server-side only)
npx supabase secrets set GEMINI_API_KEY=your_gemini_key
npx supabase secrets set OPENAI_API_KEY=your_openai_key  # Optional

# Verify secrets are set
npx supabase secrets list
```

### 2. EAS Build Configuration (eas.json)

```json
{
  "build": {
    "staging": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging",
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "EXPO_PUBLIC_API_URL": "https://your-project.supabase.co/functions/v1"
        // NO API KEYS HERE!
      }
    }
  }
}
```

### 3. Mobile App Configuration

The mobile app should ONLY have:

- Supabase URL (public)
- Supabase Anon Key (public, with RLS)
- NO AI provider API keys

## ❌ What NOT to Do

### Never Include in Client Builds:

- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY`
- Any third-party API keys
- Service role keys

### Security Risks of Client-Side Keys:

1. **Exposed in App Bundle**: Anyone can extract keys from the APK/IPA
2. **No Rate Limiting**: Can't control usage per user
3. **No Key Rotation**: Must rebuild app to update keys
4. **Cost Overruns**: No way to prevent abuse
5. **Compliance Issues**: Violates security best practices

## Production Deployment Checklist

### 1. Environment Variables

- [ ] Supabase secrets configured via CLI
- [ ] No API keys in eas.json
- [ ] No API keys in .env files committed to git
- [ ] Service role key only in Supabase secrets

### 2. Build Configuration

- [ ] Separate staging/production Supabase projects
- [ ] Environment-specific Supabase URLs
- [ ] Proper bundle identifiers for each environment

### 3. Edge Functions

- [ ] Deployed to Supabase
- [ ] Using server-side secrets
- [ ] Proper error handling
- [ ] Rate limiting implemented

### 4. Mobile App

- [ ] Calls edge functions via supabase.functions.invoke()
- [ ] No direct AI provider integration
- [ ] Proper error handling for network failures

## Testing in Different Environments

### Local Development (Expo Go)

```bash
# .env.local (NOT committed)
EXPO_PUBLIC_SUPABASE_URL=https://staging.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key

# Edge functions use staging Supabase secrets
```

### Staging (TestFlight)

- Uses staging Supabase project
- Edge functions access staging secrets
- No API keys in build

### Production (App Store)

- Uses production Supabase project
- Edge functions access production secrets
- No API keys in build

## Monitoring & Security

### 1. API Key Security

- Rotate keys regularly via Supabase CLI
- Monitor usage in provider dashboards
- Set up billing alerts

### 2. Edge Function Monitoring

```sql
-- Query Supabase logs for edge function usage
SELECT
  created_at,
  metadata->>'function_name' as function,
  metadata->>'execution_time_ms' as duration,
  metadata->>'status_code' as status
FROM edge_logs
WHERE metadata->>'function_name' = 'analyze-construction'
ORDER BY created_at DESC
LIMIT 100;
```

### 3. Cost Control

- Implement user-based rate limiting
- Cache responses where appropriate
- Monitor token usage

## Emergency Procedures

### If API Key is Exposed:

1. Immediately revoke the exposed key in provider dashboard
2. Generate new key
3. Update Supabase secret: `npx supabase secrets set GEMINI_API_KEY=new_key`
4. Deploy edge functions: `npx supabase functions deploy`
5. No app rebuild required!

### If Edge Function Fails:

1. Check Supabase dashboard for errors
2. Verify secrets are set correctly
3. Check provider API status
4. Implement fallback to cached/mock data if needed

## Best Practices

1. **Never trust the client**: All AI logic server-side
2. **Use RLS**: Supabase Row Level Security for data access
3. **Rate limit by user**: Track usage in database
4. **Cache responses**: Reduce API calls for common queries
5. **Monitor costs**: Set up alerts for unusual usage
6. **Document everything**: Keep this guide updated

## Contact

For production issues:

- Supabase Dashboard: Monitor edge function logs
- Provider Dashboards: Check API usage and limits
- Team Slack: #asktoddy-production channel
