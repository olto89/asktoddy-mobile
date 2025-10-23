# Supabase Email Template Setup Guide

## 📧 Branded Email Templates Implementation

This guide explains how to implement the custom AskToddy branded email templates in your Supabase project.

## 🎯 Templates Created

1. **confirm-signup.html** - Email verification for new accounts
2. **reset-password.html** - Password reset emails  
3. **magic-link.html** - Magic link sign-in emails

## 🚀 Implementation Steps

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **staging project**: `asktoddy-staging`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Confirm Signup Template

1. Click on **Confirm signup** template
2. **Subject**: `Verify your AskToddy account - Get started with instant construction quotes`
3. **Body (HTML)**: Copy the entire content from `confirm-signup.html`
4. Click **Save**

### Step 3: Configure Reset Password Template

1. Click on **Reset password** template  
2. **Subject**: `Reset your AskToddy password - Secure account access`
3. **Body (HTML)**: Copy the entire content from `reset-password.html`
4. Click **Save**

### Step 4: Configure Magic Link Template

1. Click on **Magic link** template
2. **Subject**: `Your secure AskToddy sign-in link - No password required`
3. **Body (HTML)**: Copy the entire content from `magic-link.html`
4. Click **Save**

### Step 5: Configure Email Settings

In **Authentication** → **Settings**:

1. **Site URL**: `asktoddy://auth/callback`
2. **Additional redirect URLs**: 
   - `asktoddy://auth/callback`
   - `exp://localhost:8081` (for development)

### Step 6: Test Email Templates

1. Create a test user account in staging app
2. Check email inbox for branded verification email
3. Verify the styling and links work correctly
4. Test password reset flow
5. Test magic link if implemented

## 🎨 Template Features

### Design Elements
- **AskToddy branding** with logo and brand colors
- **Responsive design** that works on mobile and desktop
- **Professional styling** with consistent typography
- **Clear call-to-action buttons** with proper hover states
- **Security notices** for password resets
- **Feature highlights** for signup confirmations

### Brand Colors Used
- **Primary Orange**: #ff6b35 (AskToddy brand color)
- **Navy Background**: #1e293b
- **Text Colors**: Professional grays and blues
- **Success Green**: For positive messaging
- **Warning Yellow**: For security notices

### Email Structure
1. **Header**: Logo and brand name
2. **Content**: Main message with CTA button
3. **Additional Info**: Features, security notices, or quick access info
4. **Footer**: Support contact and legal information

## 🔄 Apply to Production

Once staging templates are tested and working:

1. Go to **production project**: `tggvoqhewfmczyjoxrqu`
2. Repeat Steps 2-4 with the same template content
3. Test with production app builds

## 📱 Mobile App Integration

The templates include:
- **Deep link handling** for mobile app redirects
- **Responsive design** for various email clients
- **Support contact** information
- **Clear instructions** for users

## ✅ Testing Checklist

- [ ] Signup email arrives with AskToddy branding
- [ ] Verification link opens app successfully  
- [ ] Password reset email has security styling
- [ ] Magic link email (if used) works correctly
- [ ] All emails display properly on mobile devices
- [ ] Footer links and contact info are correct
- [ ] Deep links redirect to app properly

## 🎯 Success Metrics

After implementation, monitor:
- Email delivery rates
- Click-through rates on verification links
- User signup completion rates
- Support tickets related to email issues

## 🛠 Troubleshooting

### Common Issues:
1. **Templates not applying**: Clear browser cache and refresh Supabase dashboard
2. **Styling broken**: Check HTML syntax in templates
3. **Links not working**: Verify redirect URLs in Authentication settings
4. **Images not loading**: All styling is inline CSS, no external images used

### Support:
If you encounter issues:
1. Check Supabase dashboard for error messages
2. Test with a fresh email account
3. Verify mobile app deep link configuration
4. Contact support@asktoddy.com for assistance

---

**Note**: These templates are optimized for both staging and production environments. The deep link handling will automatically work with the respective app configurations.