# TestFlight Setup with Friend's Apple Account

## 🍎 **Required Information from Your Friend**

### **1. Apple Developer Account Details**

- [ ] **Apple ID email**: `friend@example.com`
- [ ] **Team ID**: Found in Apple Developer Portal > Membership
- [ ] **Preferred bundle ID pattern**: `com.friendsname.asktoddy` or `com.friendsapps.asktoddy`

### **2. App Store Connect Setup**

Your friend needs to:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app with these details:
   - **Name**: AskToddy
   - **Primary Language**: English (UK)
   - **Bundle ID**: (matches what we set below)
   - **SKU**: asktoddy-mobile-001

### **3. Get App Store Connect App ID**

After creating the app, your friend should:

- Go to App Information
- Copy the **Apple ID** number (10-digit number)
- Send this to you

## 🔧 **Files We Need to Update**

### **app.json** - Bundle Identifier

```json
{
  "ios": {
    "bundleIdentifier": "com.FRIENDSNAME.asktoddy"
  },
  "android": {
    "package": "com.FRIENDSNAME.asktoddy"
  }
}
```

### **eas.json** - Apple ID and App Store ID

```json
{
  "submit": {
    "staging": {
      "ios": {
        "appleId": "friend@example.com",
        "ascAppId": "1234567890"
      }
    },
    "production": {
      "ios": {
        "appleId": "friend@example.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

## 🚀 **Quick Setup Commands**

### **Once You Have the Details:**

```bash
# 1. Update bundle ID and Apple ID
# (We'll do this manually in the files)

# 2. Install EAS CLI
npm install -g eas-cli

# 3. Login with friend's Apple ID
eas login
# Enter friend's Apple ID credentials

# 4. Configure build credentials
eas build:configure

# 5. Build for TestFlight staging
eas build --platform ios --profile staging

# 6. Submit to TestFlight
eas submit --platform ios --profile staging
```

## 📋 **TestFlight Build Workflow**

### **Staging Builds** (Internal Testing)

```bash
# Switch to staging environment
npm run env:use staging

# Build staging version
eas build --platform ios --profile staging

# Submit to TestFlight
eas submit --platform ios --profile staging
```

### **Production Builds** (App Store)

```bash
# Switch to production environment
npm run env:use production

# Build production version
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

## ⚡ **Ready to Go Commands**

Once your friend provides the details, we can:

1. **Update configs** (5 minutes)
2. **Build staging** (15-30 minutes)
3. **Submit to TestFlight** (5 minutes)
4. **Available for testing** (15-30 minutes processing)

**Total time**: Can have TestFlight build ready within 1 hour!

## 🎯 **What Your Friend Needs to Do**

1. **Invite you as a user** on their Apple Developer account (optional, makes it easier)
2. **Create the app** in App Store Connect
3. **Send you**: Bundle ID preference + App Store Connect App ID
4. **Add internal testers** in TestFlight after first build

Everything else is automated through our scripts!
