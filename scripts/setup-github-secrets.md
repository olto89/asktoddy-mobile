# GitHub Secrets Setup for TestFlight Automation

## Required Secrets

Add these secrets to your GitHub repository settings:

### 1. EXPO_TOKEN
```bash
# Get your Expo access token
eas whoami
eas login
# Go to https://expo.dev/accounts/[username]/settings/access-tokens
# Create a new token with "Full access" 
# Add it as EXPO_TOKEN secret in GitHub
```

### 2. APPLE_CREDENTIALS (Optional - for advanced setup)
```bash
# If you want to store Apple credentials as secrets
APPLE_ID=oliver@hotsoup.io
APPLE_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=3RDA64CSSW
```

## Setup Steps

### 1. In GitHub Repository
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `EXPO_TOKEN` | Your Expo access token | Allows GitHub to authenticate with EAS |
| `APPLE_ID` | oliver@hotsoup.io | Apple Developer account |
| `APPLE_PASSWORD` | App-specific password | Generate from Apple ID settings |

### 2. Get Expo Token
```bash
# Run this to get your token
eas login
eas whoami
```

Then visit: https://expo.dev/accounts/olto89/settings/access-tokens

### 3. Apple App-Specific Password
1. Go to https://appleid.apple.com
2. Sign in with oliver@hotsoup.io
3. **App-Specific Passwords** → **Generate**
4. Use this password as `APPLE_PASSWORD` secret

## Automated Workflow

### Triggers
- **Push to `main`** → Build & deploy to TestFlight (production)
- **Push to `staging`** → Build & deploy to TestFlight (staging)
- **Merged PR to `main`** → Build & deploy to TestFlight (production)

### Build Process
1. **Quality checks** → ESLint, TypeScript, tests
2. **Build** → EAS build for iOS
3. **Submit** → Automatic TestFlight submission
4. **Notify** → Success/failure notifications

### Manual Triggers
You can also trigger builds manually:
```bash
# Trigger from CLI
gh workflow run "TestFlight Deployment" --ref main

# Or from GitHub UI
# Go to Actions → TestFlight Deployment → Run workflow
```

## Testing the Setup

### 1. Test with Small Change
```bash
git checkout -b test-automation
echo "// Test automation" >> README.md
git add README.md
git commit -m "test: automated TestFlight deployment"
git push origin test-automation
```

### 2. Create PR and Merge
This will trigger the TestFlight deployment workflow.

### 3. Monitor Progress
- Check **Actions** tab in GitHub
- Monitor build progress
- Verify TestFlight submission

## Alternative: Manual Trigger Script

Create a local script for manual deployments:

```bash
#!/bin/bash
# scripts/deploy-testflight.sh

BRANCH=$(git branch --show-current)

if [[ "$BRANCH" == "main" ]]; then
  echo "🚀 Deploying production to TestFlight..."
  eas build --platform ios --profile production --non-interactive
  eas submit --platform ios --profile production --non-interactive
elif [[ "$BRANCH" == "staging" ]]; then
  echo "🚀 Deploying staging to TestFlight..."
  eas build --platform ios --profile staging --non-interactive
  eas submit --platform ios --profile staging --non-interactive
else
  echo "❌ Deploy only from main or staging branches"
  exit 1
fi
```

Make executable: `chmod +x scripts/deploy-testflight.sh`

Usage: `./scripts/deploy-testflight.sh`