# Environment Configuration Guide

## CRITICAL: Environment Variable Precedence

**DANGER:** `.env.local` OVERRIDES ALL OTHER CONFIGURATIONS including EAS build profiles!

## Environment Files Precedence (Highest to Lowest)

1. `.env.local` (NEVER commit this - development only)
2. `.env.development`
3. `.env.staging`
4. `.env.production`
5. `.env`
6. EAS build profile env vars

## Current Configuration

### Local Development (.env.local)

- **Purpose:** Local development only
- **Supabase:** `http://localhost:54321`
- **Status:** Should NEVER be included in builds

### Staging (.env + EAS staging profile)

- **Purpose:** TestFlight testing
- **Supabase:** `https://iezmuqawughmwsxlqrim.supabase.co`
- **Build Profile:** EAS staging profile overrides

### Production (EAS production profile)

- **Purpose:** App Store releases
- **Supabase:** `https://tggvoqhewfmczyjoxrqu.supabase.co`
- **Build Profile:** EAS production profile

## CRITICAL FIX NEEDED

**Problem:** `.env.local` is pointing staging builds to localhost!

**Solution:**

1. Move `.env.local` to `.env.local.example`
2. Add `.env.local` to `.gitignore`
3. Create environment-specific files
4. Update build process to ignore `.env.local`

## Build Checklist

Before ANY build:

- [ ] Verify no `.env.local` file exists
- [ ] Confirm EAS profile points to correct Supabase instance
- [ ] Test edge function connectivity
- [ ] Verify environment variables in EAS dashboard

## Emergency Fix Commands

```bash
# Remove problematic .env.local
rm .env.local

# Verify EAS profile
cat eas.json | grep -A 10 "staging"

# Test staging connectivity
curl -X POST "https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/analyze-construction"
```

## Environment URLs Reference

- **Local:** http://localhost:54321
- **Staging:** https://iezmuqawughmwsxlqrim.supabase.co
- **Production:** https://tggvoqhewfmczyjoxrqu.supabase.co
