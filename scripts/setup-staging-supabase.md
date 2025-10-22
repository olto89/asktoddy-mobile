# Staging Supabase Setup Guide

## 1. Create Staging Project

1. Go to https://supabase.com/dashboard/new
2. Create project: `asktoddy-staging`
3. Use same password as production
4. Same region as production

## 2. Get Project Details

Once created, go to Project Settings → API:

```
Project URL: https://[staging-project-id].supabase.co
Anon Key: eyJ... (public key for mobile app)
Service Role Key: eyJ... (secret key for Edge Functions)
```

## 3. Copy Database Schema

We need to replicate the production database structure:

### Option A: Using Supabase CLI (Recommended)
```bash
# Export from production
supabase db dump --db-url "postgresql://postgres:[password]@db.[production-id].supabase.co:5432/postgres" > staging-schema.sql

# Import to staging
supabase db reset --db-url "postgresql://postgres:[password]@db.[staging-id].supabase.co:5432/postgres" --from-file staging-schema.sql
```

### Option B: Manual Setup
Copy these tables from production:
- `auth.users` (Supabase managed)
- `analysis_requests`
- `user_profiles` (if exists)
- Any custom tables

## 4. Set Authentication Settings

In staging project dashboard:
1. **Authentication** → **Settings**
2. **Site URL**: `asktoddy://auth/callback`
3. **Additional URLs**: Add your app scheme
4. **Email templates**: Copy from production

## 5. Update Environment Variables

Update `.env.staging` with new staging URLs:
```env
EXPO_PUBLIC_SUPABASE_URL=https://[staging-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ[staging-anon-key]
EXPO_PUBLIC_API_URL=https://[staging-id].supabase.co/functions/v1
```

## 6. Deploy Edge Functions to Staging

```bash
# Deploy to staging project
supabase functions deploy --project-ref [staging-id]

# Set secrets in staging
supabase secrets set GEMINI_API_KEY=... --project-ref [staging-id]
```

## 7. Test Staging Environment

```bash
# Test edge functions
curl https://[staging-id].supabase.co/functions/v1/analyze-construction

# Build with staging config
eas build --platform ios --profile staging
```