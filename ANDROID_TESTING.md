# Android Testing Guide for AskToddy Mobile

## 🤖 Android Testing Options (Best to Worst)

### 1. **Google Play Internal Testing** (Recommended)

**Cost**: FREE  
**Setup Time**: 15 minutes  
**Testers**: Up to 100 people

```bash
# Build for Android
eas build --platform android --profile staging

# Submit to Google Play Console
eas submit --platform android --profile staging
```

**Advantages:**

- ✅ Completely free (no Google Play Developer fee needed for internal testing)
- ✅ Real device testing on any Android phone
- ✅ Automatic updates
- ✅ Easy sharing via link
- ✅ Works exactly like production app

**Setup Process:**

1. Create Google Play Developer account ($25 one-time fee)
2. Create app in Google Play Console
3. Upload APK to Internal Testing track
4. Share testing link with users

---

### 2. **Direct APK Distribution**

**Cost**: FREE  
**Setup Time**: 5 minutes  
**Testers**: Unlimited

```bash
# Build APK file
eas build --platform android --profile staging

# Download APK and share directly
```

**Advantages:**

- ✅ No Google account needed
- ✅ Instant distribution
- ✅ Works on any Android device

**Disadvantages:**

- ❌ Users must enable "Install Unknown Apps"
- ❌ No automatic updates
- ❌ Security warnings during install
- ❌ Manual APK sharing required

---

### 3. **Expo Development Build**

**Cost**: FREE  
**Setup Time**: 10 minutes  
**Testers**: Developers only

```bash
# Build development client
eas build --profile development --platform android

# Start dev server
npm start --dev-client
```

**Best For**: Internal team testing only

---

## 🎯 Recommended Android Strategy

### **Phase 1: Internal Testing (Free)**

```bash
# 1. Build Android APK
eas build --platform android --profile staging

# 2. Test locally first
# Download APK and install on your Android device

# 3. Share APK with close friends/family
# Send APK file directly via email/messaging
```

### **Phase 2: Google Play Internal Testing ($25)**

When ready for wider testing:

1. **Create Google Play Developer Account**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 one-time registration fee
   - Much cheaper than Apple's $99/year

2. **Set up Internal Testing**

   ```bash
   # Build for Google Play
   eas build --platform android --profile staging

   # Submit to Google Play Console
   eas submit --platform android --profile staging
   ```

3. **Share Testing Link**
   - Get shareable link from Google Play Console
   - Send to testers (up to 100 people)
   - They install via Google Play Store

---

## 📱 EAS Configuration for Android

Your `eas.json` is already configured for Android:

```json
{
  "build": {
    "staging": {
      "android": {
        "buildType": "apk" // For testing
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle", // For Play Store
        "autoIncrement": true
      }
    }
  }
}
```

## 🔧 Android Build Commands

```bash
# Development build (for team testing)
eas build --platform android --profile development

# Staging APK (for external testing)
eas build --platform android --profile staging

# Production AAB (for Play Store)
eas build --platform android --profile production

# Build both iOS and Android
eas build --platform all --profile staging
```

## 📊 Testing Comparison

| Method                   | Cost | Setup Time | Ease of Use | Tester Limit |
| ------------------------ | ---- | ---------- | ----------- | ------------ |
| **APK Direct**           | FREE | 5 min      | Medium      | Unlimited    |
| **Google Play Internal** | $25  | 15 min     | Easy        | 100          |
| **Google Play Beta**     | $25  | 30 min     | Easy        | Unlimited    |
| **Development Build**    | FREE | 10 min     | Hard        | Team only    |

## 🚀 Quick Start (When Ready)

**For immediate testing:**

```bash
# 1. Build APK
eas build --platform android --profile staging

# 2. Download from Expo dashboard
# 3. Install on Android device
# 4. Share APK file with testers
```

**For professional testing:**

```bash
# 1. Set up Google Play Developer account ($25)
# 2. Create app in Google Play Console
# 3. Build and submit
eas build --platform android --profile staging
eas submit --platform android --profile staging

# 4. Share internal testing link
```

## 💡 Pro Tips

### **For Friends & Family Testing**

- Use direct APK distribution (free)
- Create simple install instructions
- Use staging environment

### **For Beta Testing**

- Use Google Play Internal Testing
- Much easier user experience
- Automatic updates

### **Cost Optimization**

- Start with free APK distribution
- Upgrade to Google Play when scaling
- Google Play much cheaper than Apple ($25 vs $99/year)

## 🔐 Android Permissions

Your app.json already includes required Android permissions:

```json
{
  "android": {
    "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
  }
}
```

## 📞 Next Steps

1. **Focus on iOS TestFlight first** (you're set up for this)
2. **When ready for Android testing**:
   - Run `eas build --platform android --profile staging`
   - Test APK on your own Android device
   - Share with close contacts
   - Consider Google Play Developer account for wider testing

**Estimated Timeline**: iOS TestFlight this week, Android testing next week
