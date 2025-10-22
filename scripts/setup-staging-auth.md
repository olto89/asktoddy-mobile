# Configure Staging Supabase Authentication

## Required Steps

### 1. Go to Staging Project Dashboard
Visit: https://supabase.com/dashboard/project/iezmuqawughmwsxlqrim

### 2. Configure Authentication Settings

**Navigation:** Authentication → Settings

#### Site URL Configuration
- **Site URL**: `asktoddy://auth/callback`
- **Additional redirect URLs**:
  - `asktoddy://auth/callback`
  - `exp://localhost:8081` (for development)

#### Email Settings
- **Enable email confirmation**: Toggle based on your preference
- **For testing**: Disable email confirmation to speed up testing
- **For production**: Enable email confirmation

### 3. Copy Users from Production (Optional)

If you want to test with existing users:

#### Option A: Manual Test Users
Create test users directly in staging:
1. Go to **Authentication → Users**
2. **Add user** → Create test accounts
3. Use emails like `test@asktoddy.com`

#### Option B: Copy from Production (Advanced)
Export users from production and import to staging (requires database access)

### 4. Test Authentication

Once configured, test the authentication flow:

```bash
# Build staging app
eas build --platform ios --profile staging

# Test authentication in the app:
# 1. Sign up with new email
# 2. Sign in with existing email
# 3. Password reset flow
```

### 5. Verify Edge Functions Work

Test the staging Edge Functions:

```bash
# Test analyze-construction
curl -X POST https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/analyze-construction \
  -H "Authorization: Bearer YOUR_STAGING_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test get-pricing  
curl -X POST https://iezmuqawughmwsxlqrim.supabase.co/functions/v1/get-pricing \
  -H "Authorization: Bearer YOUR_STAGING_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"location": "London", "projectType": "bathroom"}'
```

## Quick Setup Checklist

- [ ] Set Site URL to `asktoddy://auth/callback`
- [ ] Add additional redirect URLs
- [ ] Configure email confirmation settings
- [ ] Create test users (optional)
- [ ] Test Edge Functions
- [ ] Build and test staging app

## Next Steps

After authentication is configured:
1. Build staging app with new config
2. Test authentication flow
3. Deploy production app when ready