# AskToddy Mobile - Developer Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (Mac only) or **Android Emulator**
- **Visual Studio Code** (recommended) or your preferred IDE

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/olto89/asktoddy-mobile.git
cd asktoddy-mobile
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create your local environment file:

```bash
cp .env.example .env
```

Edit `.env` with the following values:

```bash
# Staging Environment (for development)
EXPO_PUBLIC_SUPABASE_URL=https://iezmuqawughmwsxlqrim.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllem11cWF3dWdobXdzeGxxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODM5MzAsImV4cCI6MjA3NjU1OTkzMH0.SU0JdMUE-7aWAQJ1oq19dKZifw-qdUiLX9_JmOSOGO0

# App Configuration
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_API_URL=https://iezmuqawughmwsxlqrim.supabase.co/functions/v1
EXPO_PUBLIC_ENABLE_MOCK_DATA=false
EXPO_PUBLIC_ENABLE_DEBUG_LOGS=true

# Note: API keys for Gemini/OpenAI are NOT needed for local development
# They are securely stored in Supabase Edge Functions
```

### 4. iOS Setup (Mac Only)

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Run on iOS Simulator
npm run ios
# or
expo start --ios
```

### 5. Android Setup

```bash
# Start Android Emulator first, then:
npm run android
# or
expo start --android
```

## Running the App

### Development Server

```bash
# Start Expo development server
npm start
# or
expo start

# Then press:
# 'i' for iOS simulator
# 'a' for Android emulator
# Scan QR code with Expo Go app for physical device
```

### Using Expo Go App (Recommended for Quick Testing)

1. Install **Expo Go** from App Store or Google Play
2. Run `npm start`
3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## Project Structure

```
asktoddy-mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── services/        # API and service layers
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── navigation/      # Navigation configuration
│   └── utils/           # Helper utilities
├── assets/              # Images, fonts, icons
├── supabase/
│   ├── functions/       # Edge functions (deployed)
│   └── migrations/      # Database migrations
├── app.config.js        # Expo configuration
├── eas.json            # EAS Build configuration
└── package.json        # Dependencies
```

## Important Notes

### Security Architecture

This app uses a **secure architecture** where:

- **API keys are NEVER in the client code**
- All AI processing happens in **Supabase Edge Functions**
- The mobile app only has **public anon keys** (safe to expose)

### Environment Separation

- **Staging**: `iezmuqawughmwsxlqrim.supabase.co` (for development)
- **Production**: `tggvoqhewfmczyjoxrqu.supabase.co` (restricted access)

New developers should **only use staging** environment.

## Common Commands

```bash
# Development
npm start                # Start Expo dev server
npm run ios             # iOS simulator
npm run android         # Android emulator
npm run web             # Web browser

# Testing & Validation
npm test                # Run tests
npm run lint            # Lint code
npm run type-check      # TypeScript validation

# Building (requires permissions)
eas build --profile staging    # Staging build
eas build --profile production # Production build (restricted)

# Context Management
npm run context:save    # Save development context
npm run context:sync    # Sync with Linear tickets
```

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues

```bash
# Clear cache
npx expo start -c
# or
npm start -- --clear
```

#### 2. iOS Build Errors

```bash
cd ios && pod install && cd ..
# or clean build
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

#### 3. Android Build Errors

```bash
cd android && ./gradlew clean && cd ..
```

#### 4. Dependency Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## Getting Help

- **Project Documentation**: See `/docs` folder
- **Architecture**: Read `ARCHITECTURE.md`
- **API Documentation**: Check `/supabase/functions/README.md`
- **Team Lead**: Contact repository owner for access issues

## Access Requirements

### For Basic Development

- GitHub repository access (read)
- Staging Supabase credentials (provided above)

### For Builds & Deployment

- Expo account access
- Apple Developer team membership
- EAS CLI authentication

### For Production (Restricted)

- Production Supabase access
- App Store Connect access
- Environment secrets access

## Next Steps

1. Complete the setup above
2. Run the app locally
3. Explore the codebase
4. Check Linear/GitHub issues for tasks
5. Create a feature branch for your work
6. Submit pull requests for review

---

**Note**: Never commit `.env` files or API keys to the repository. All sensitive credentials are managed through secure channels.
