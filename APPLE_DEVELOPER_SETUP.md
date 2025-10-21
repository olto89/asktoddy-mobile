# Apple Developer & TestFlight Setup Guide

## 📱 Complete Setup Process for AskToddy Mobile

### Step 1: Apple Developer Account ($99/year)

1. **Sign Up for Apple Developer Program**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Click "Enroll" in the top menu
   - Sign in with your Apple ID (mrolivertodd@gmail.com)
   - Choose "Individual" enrollment type
   - Pay $99 annual fee
   - **Processing Time**: Instant for individuals (up to 48 hours for companies)

2. **What You Get**
   - TestFlight access (beta testing)
   - App Store distribution
   - 100 internal testers (TestFlight)
   - 10,000 external testers (TestFlight)

### Step 2: Create App ID (Apple Developer Portal)

Once enrolled:

1. **Go to Apple Developer Portal**
   - Visit [developer.apple.com/account](https://developer.apple.com/account)
   - Sign in with your Apple ID

2. **Create App Identifier**
   - Navigate to "Certificates, Identifiers & Profiles"
   - Click "Identifiers" → "+"
   - Select "App IDs" → Continue
   - Select "App" → Continue
   - Fill in:
     - **Description**: AskToddy Mobile
     - **Bundle ID**: `com.asktoddy.mobile` (Explicit)
     - **Capabilities**: Leave default for now
   - Register

### Step 3: Create App in App Store Connect

1. **Access App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Create New App**
   - Click "My Apps" → "+"
   - Select "New App"
   - Fill in:
     - **Platforms**: iOS
     - **Name**: AskToddy
     - **Primary Language**: English (UK)
     - **Bundle ID**: Select `com.asktoddy.mobile`
     - **SKU**: asktoddy-mobile-001
     - **User Access**: Full Access

3. **Configure App Information**
   - **Category**: Business or Productivity
   - **Content Rights**: Yes (you own everything)
   - **Age Rating**: 4+ (no objectionable content)

### Step 4: Install Development Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account (create free account if needed)
eas login

# Verify installation
eas --version
```

### Step 5: Configure Project for EAS Build

```bash
# Initialize EAS in your project
cd /Users/olivertodd/Desktop/asktoddy-mobile
eas build:configure

# When prompted:
# - Platform: iOS
# - Auto-create credentials: Yes
```

### Step 6: Update app.json for iOS

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.asktoddy.mobile",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "AskToddy needs camera access to photograph construction projects for instant quotes.",
        "NSPhotoLibraryUsageDescription": "AskToddy needs photo library access to select construction project images.",
        "NSLocationWhenInUseUsageDescription": "AskToddy uses your location to find local suppliers and provide accurate regional pricing."
      }
    }
  }
}
```

### Step 7: First TestFlight Build

```bash
# 1. Switch to staging environment
npm run env:use staging

# 2. Deploy Edge Functions (one-time setup)
npm run deploy:staging

# 3. Create your first iOS build
eas build --platform ios --profile staging

# This will:
# - Create provisioning profile
# - Create distribution certificate
# - Build the app in Expo's cloud
# - Takes about 15-30 minutes
```

### Step 8: Submit to TestFlight

```bash
# After build completes
eas submit --platform ios --profile staging

# When prompted:
# - Apple ID: mrolivertodd@gmail.com
# - App-specific password: (create at appleid.apple.com)
```

### Step 9: Configure TestFlight

1. **In App Store Connect**
   - Go to "My Apps" → "AskToddy"
   - Click "TestFlight" tab
   - Build will appear after processing (15-30 min)

2. **Add Test Information**
   - Click on the build
   - Add "Test Details":
     - **What to Test**: Construction quote generation, photo analysis, chat interface
     - **App Description**: AI-powered construction cost estimator
   
3. **Add Testers**
   - **Internal Testing** (immediate):
     - Add up to 100 Apple IDs
     - No review required
   - **External Testing** (requires review):
     - Create testing group
     - Add up to 10,000 emails
     - Requires Beta App Review (24-48 hours)

## 💰 Cost Breakdown

| Service | Cost | What You Get |
|---------|------|--------------|
| Apple Developer | $99/year | TestFlight + App Store |
| Expo EAS | Free tier | 30 builds/month |
| Supabase | Free tier | 2 projects |
| Total | $99/year | Full deployment pipeline |

## 🚀 Quick Deploy Commands (After Setup)

```bash
# Complete deployment flow
npm run env:use staging        # Switch to staging
npm run deploy:staging          # Deploy Edge Functions
eas build --platform ios        # Build iOS app
eas submit --platform ios       # Submit to TestFlight
```

## ⏱️ Timeline

1. **Apple Developer Enrollment**: 0-48 hours
2. **First Build Setup**: 30 minutes
3. **Build Time**: 15-30 minutes
4. **TestFlight Processing**: 15-30 minutes
5. **External Beta Review**: 24-48 hours (if needed)

**Total**: Can have internal TestFlight within 2 hours of enrollment approval

## 🔑 App-Specific Password

For EAS Submit, you need an app-specific password:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Security → App-Specific Passwords → Generate
4. Name it "EAS Submit"
5. Save the password securely

## 📝 Pre-Flight Checklist

Before first build:
- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] Bundle ID matches app.json
- [ ] EAS CLI installed and logged in
- [ ] Edge Functions deployed to staging
- [ ] Environment set to staging
- [ ] App icons added (1024x1024)

## 🆘 Common Issues

### "Bundle ID already exists"
- Use a unique identifier like `com.olivertodd.asktoddy`

### "No suitable signing identity"
- Run `eas credentials` to manage certificates

### "Build failing"
- Check `eas build --platform ios --clear-cache`

### "Submit failing"  
- Create app-specific password at appleid.apple.com

## 📞 Support Links

- [Apple Developer Support](https://developer.apple.com/contact)
- [EAS Build Docs](https://docs.expo.dev/build/introduction)
- [TestFlight Docs](https://developer.apple.com/testflight)