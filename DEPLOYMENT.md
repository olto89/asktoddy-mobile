# AskToddy Mobile Deployment Guide

## 🎯 Environment Strategy

We use three environments with Supabase's free tier (2 projects):

| Environment    | Purpose     | Supabase Project       | Build Profile |
| -------------- | ----------- | ---------------------- | ------------- |
| **Local**      | Development | Local Docker           | `development` |
| **Staging**    | TestFlight  | `tggvoqhewfmczyjoxrqu` | `staging`     |
| **Production** | App Store   | _To be created_        | `production`  |

## 🚀 Quick Deploy to TestFlight

```bash
# 1. Switch to staging environment
npm run env:use staging

# 2. Deploy Edge Functions to staging
npm run deploy:staging

# 3. Build for iOS TestFlight
npm run build:staging

# 4. Submit to TestFlight
npm run submit:testflight
```

## 📋 Pre-Deployment Checklist

### Before First TestFlight Build

- [ ] **Apple Developer Account**
  - [ ] Active Apple Developer membership ($99/year)
  - [ ] App ID created in Apple Developer Portal
  - [ ] TestFlight configured in App Store Connect

- [ ] **Supabase Staging**
  - [ ] Edge Functions deployed: `npm run deploy:staging`
  - [ ] Test functions working: `npm run supabase:test`
  - [ ] Environment variables set in Supabase dashboard

- [ ] **Expo/EAS Setup**
  - [ ] EAS CLI installed: `npm install -g eas-cli`
  - [ ] Logged in: `eas login`
  - [ ] Project configured: `eas build:configure`

- [ ] **Code Ready**
  - [ ] Remove all `console.log` statements for production
  - [ ] Mock data disabled in staging/production
  - [ ] Error tracking configured (Sentry)

## 🔄 Deployment Workflow

### 1. Local Development

```bash
# Use local environment
npm run env:use local

# Start local Supabase (requires Docker)
supabase start

# Run app
npm start
```

### 2. Staging (TestFlight)

```bash
# Switch to staging
npm run env:use staging

# Deploy Edge Functions
npm run deploy:staging

# Build iOS app
npm run build:staging

# Submit to TestFlight
npm run submit:testflight
```

### 3. Production (App Store)

```bash
# Create production Supabase project first!
# Then update .env.production

# Switch to production
npm run env:use production

# Deploy Edge Functions
npm run deploy:production

# Build iOS app
npm run build:production

# Submit to App Store
npm run submit:appstore
```

## 🔐 Environment Variables

### Required in Supabase Dashboard

Navigate to Project Settings > Edge Functions > Secrets:

```env
GEMINI_API_KEY=AIzaSyDhlHuMErJM99aTenGQGE5JzfSV9vG9GT4
OPENAI_API_KEY=sk-... (if using OpenAI)
```

### App Environment Files

- `.env.local` - Local development with mock data
- `.env.staging` - TestFlight builds (current Supabase project)
- `.env.production` - App Store builds (needs new project)

## 📱 TestFlight Setup

### First Time Setup

1. **Create App in App Store Connect**
   - Sign in to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "+" to add new app
   - Bundle ID: `com.asktoddy.mobile`
   - SKU: `asktoddy-mobile-001`

2. **Configure EAS**

   ```bash
   eas build:configure
   # Select iOS
   # Choose "yes" to automatically create credentials
   ```

3. **Build & Submit**
   ```bash
   npm run build:staging
   npm run submit:testflight
   ```

### Adding TestFlight Testers

1. Go to App Store Connect > TestFlight
2. Add internal testers (up to 100)
3. Add external testers (up to 10,000)
4. Send invites with build number

## 🏗️ Creating Production Environment

When ready for App Store release:

1. **Create New Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create new project (uses 2nd free slot)
   - Name: `asktoddy-production`

2. **Update Configuration**
   - Copy project URL and anon key
   - Update `.env.production`
   - Update `scripts/deploy-edge-functions.js`

3. **Deploy to Production**
   ```bash
   npm run env:use production
   npm run deploy:production
   npm run build:production
   npm run submit:appstore
   ```

## ⚠️ Important Notes

- **Free Tier Limits**: 2 Supabase projects total
- **Edge Functions**: 500K invocations/month free
- **Storage**: 1GB free per project
- **TestFlight**: Builds expire after 90 days
- **App Review**: Allow 1-2 weeks for App Store review

## 🐛 Troubleshooting

### Edge Functions Not Working

```bash
# Check deployment status
supabase functions list --project-ref tggvoqhewfmczyjoxrqu

# View logs
supabase functions logs analyze-construction --project-ref tggvoqhewfmczyjoxrqu
```

### Build Failing

```bash
# Clear cache
expo prebuild --clear
rm -rf node_modules
npm install

# Retry build
npm run build:staging
```

### TestFlight Issues

- Ensure Apple Developer account is active
- Check provisioning profiles in Apple Developer Portal
- Verify bundle identifier matches App Store Connect

## 📞 Support

- **Supabase**: [Discord](https://discord.supabase.com)
- **Expo/EAS**: [Forums](https://forums.expo.dev)
- **Linear**: Update tickets with deployment status
