# 🔧 Supabase Authentication Setup - Quick Fix Guide

## 🎯 Issues to Fix:

1. **Blank email templates** → Configure custom AskToddy branded templates
2. **Blank confirmation page** → Configure proper redirect URLs and deep linking

## 📧 Step 1: Configure Email Templates

### For Staging Environment:

1. Go to: https://supabase.com/dashboard/project/iezmuqawughmwsxlqrim
2. Navigate to **Authentication** → **Email Templates**

### For Production Environment:

1. Go to: https://supabase.com/dashboard/project/tggvoqhewfmczyjoxrqu
2. Navigate to **Authentication** → **Email Templates**

### Configure Confirm Signup Template:

1. Click **Confirm signup**
2. **Subject**: `Verify your AskToddy account - Get started with instant construction quotes`
3. **Body (HTML)**: Copy content from `email-templates/confirm-signup.html`
4. Click **Save**

### Configure Reset Password Template:

1. Click **Reset password**
2. **Subject**: `Reset your AskToddy password - Secure account access`
3. **Body (HTML)**: Copy content from `email-templates/reset-password.html`
4. Click **Save**

## 🔗 Step 2: Configure Redirect URLs

### In Both Staging and Production:

1. Go to **Authentication** → **Settings**
2. **Site URL**: `asktoddy://auth/callback`
3. **Additional redirect URLs** (add these):
   ```
   asktoddy://auth/callback
   exp://localhost:8081
   exp://192.168.1.100:8081
   ```

## 📱 Step 3: Test the Flow

### Test Email Verification:

1. Create a new account in your app
2. Check email for AskToddy branded template
3. Click verification link
4. Should open app and show VerificationSuccess screen

### Expected Behavior:

- ✅ Email has AskToddy branding and orange theme
- ✅ Clicking verification link opens the app
- ✅ Shows "Email Verified Successfully" screen
- ✅ Can then login normally

## 🚨 Common Issues:

### Issue: "Email template is blank"

**Fix**: You need to manually copy the HTML content from `email-templates/confirm-signup.html` into the Supabase dashboard

### Issue: "Confirmation link shows blank page"

**Fix**:

1. Check Site URL is set to `asktoddy://auth/callback`
2. Ensure your app is installed on the device
3. Try opening the app first, then clicking the email link

### Issue: "Link doesn't open app"

**Fix**:

1. Make sure app is installed from TestFlight
2. Check the scheme `asktoddy://` is configured in app.json
3. Test with `exp://` URL for development

## 📋 Quick Checklist:

**Staging Environment** (iezmuqawughmwsxlqrim):

- [ ] Email template has AskToddy HTML content
- [ ] Site URL: `asktoddy://auth/callback`
- [ ] Additional redirect URLs configured
- [ ] Test signup → email → verification

**Production Environment** (tggvoqhewfmczyjoxrqu):

- [ ] Email template has AskToddy HTML content
- [ ] Site URL: `asktoddy://auth/callback`
- [ ] Additional redirect URLs configured
- [ ] Test signup → email → verification

## 🎨 Email Template Preview:

The email should have:

- **AskToddy logo** and orange branding
- **Professional layout** with clear CTA button
- **Mobile-responsive** design
- **"Verify Email" button** that opens the app

## 🔍 Testing Commands:

Test deep link handling:

```bash
# iOS Simulator
npx uri-scheme open asktoddy://auth/callback --ios

# Android
adb shell am start -W -a android.intent.action.VIEW -d "asktoddy://auth/callback"
```

## 💡 Pro Tips:

1. **Always test in both staging and production**
2. **Use real email addresses for testing**
3. **Check spam folder if emails don't arrive**
4. **Clear app data between tests for clean state**
5. **Test on both iOS and Android if possible**

---

**Need Help?** The deep linking code is already implemented in `AuthContext.tsx` - the issue is just the Supabase console configuration!
