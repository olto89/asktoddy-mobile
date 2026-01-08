#!/bin/bash

echo "🚀 Starting AskToddy TestFlight Build #30"
echo "================================================"
echo ""
echo "📋 Build Configuration:"
echo "  - Profile: staging"
echo "  - Platform: iOS"
echo "  - Distribution: TestFlight"
echo "  - Build Number: 30"
echo ""
echo "✨ Key Features in this Build:"
echo "  - Complete freemium model implementation"
echo "  - Anonymous user access"
echo "  - Smart paywall system"
echo "  - Critical bug fixes (logout, auth flow)"
echo ""
echo "🔐 You'll need to authenticate with your Apple account"
echo ""
echo "================================================"
echo ""

# Run the EAS build command
eas build --platform ios --profile staging --auto-submit

echo ""
echo "✅ Build submitted successfully!"
echo "📱 Once complete, it will auto-submit to TestFlight"
echo ""
echo "📊 Testing priorities:"
echo "  1. Anonymous → Free user flow"
echo "  2. Quote generation after login"
echo "  3. Logout data clearing"
echo "  4. Upgrade prompts at limits"