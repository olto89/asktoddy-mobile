# AskToddy Mobile

> **Last Updated:** 2025-10-22T10:00:00.000Z  
> **Branch:** main | **Status:** 🎉 Ready for TestFlight

## 🚀 **Current Status**

### **Project Progress**

- **Architecture:** API-First with Supabase Edge Functions
- **Infrastructure:** Staging/Production Environment Separation
- **UI Approach:** Chat-First (ChatGPT-style) with camera integration
- **Current Phase:** TestFlight Deployment Ready

### **Technical Stack**

- **Platform:** React Native + Expo 54.0.15
- **AI Integration:** Google Gemini + OpenAI (switchable providers)
- **Backend:** Supabase Edge Functions (Staging + Production)
- **Design System:** AskToddy brand colors (Orange #FF6B35, Navy #2C3E50)
- **Deployment:** EAS Build + TestFlight Automation

## 📊 **Project Statistics**

| Metric               | Value    |
| -------------------- | -------- |
| **TypeScript Files** | 33       |
| **Lines of Code**    | 7,050    |
| **Dependencies**     | 19       |
| **Dev Dependencies** | 2        |
| **Git Changes**      | 71 files |

## 🎯 **Recent Achievements**

- ✅ **Status:** ✅ Configured, waiting for EAS recovery
- ✅ ✅ Installed EAS CLI globally
- ✅ ✅ Created two bundle IDs in Apple Developer account:
- ✅ ✅ Updated `app.json` with staging bundle ID
- ✅ ✅ Updated `eas.json` with Apple IDs and App Store Connect IDs

## 🚧 **Currently Working On**

- 📋 Ready for next sprint

## 📋 **Linear Tickets Summary**

**Total Mobile Tickets:** 32

### **By Status:**

- **Backlog:** 21 ticket(s)
- **Done:** 3 ticket(s)
- **Todo:** 8 ticket(s)

### **🚨 Urgent Priorities:**

- [ASK-35] [API-002] Migrate AIMiddleware to analyze-construction Edge Function
- [ASK-12] 🔌 Set up Supabase Edge Functions API ✅ COMPLETED
- [ASK-6] 📦 Create monorepo structure for shared code ✅ COMPLETED

### **⚡ High Priority:**

- [ASK-42] [MOBILE-103] Integrate multi-modal input system
- [ASK-41] [MOBILE-102] Extract camera logic to reusable hooks
- [ASK-40] [MOBILE-101] Create thin client ChatScreen

## 🏗️ **Architecture Decisions**

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator

### **Setup**

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### **Context Management**

```bash
# Save current session
npm run context:save

# Sync Linear tickets
npm run context:linear

# Full context sync
npm run context:sync

# Quick status check
npm run claude:resume
```

## 🏗️ **Environment Architecture**

### **Supabase Projects**

| Environment | Project Name | Project ID | URL |
|-------------|--------------|------------|-----|
| **Staging** | `asktoddy-staging` | `iezmuqawughmwsxlqrim` | `https://iezmuqawughmwsxlqrim.supabase.co` |
| **Production** | `asktoddy-production` | `tggvoqhewfmczyjoxrqu` | `https://tggvoqhewfmczyjoxrqu.supabase.co` |

### **App Bundle IDs**

| Environment | Bundle ID | App Store Connect ID | TestFlight |
|-------------|-----------|---------------------|-------------|
| **Staging** | `com.asktoddy.staging` | `6754278065` | ✅ Enabled |
| **Production** | `com.asktoddy.prod` | `6754278089` | ✅ Enabled |

### **Deployment Commands**

```bash
# Staging Environment
eas build --platform ios --profile staging
eas submit --platform ios --profile staging

# Production Environment  
eas build --platform ios --profile production
eas submit --platform ios --profile production

# Manual deployment script
npm run deploy:testflight  # Smart script (detects branch)
```

### **Environment Benefits**

- 🔒 **Data Isolation**: Staging tests don't affect production data
- 🚀 **Deployment Confidence**: Test thoroughly before production release
- 🔄 **Parallel Development**: Multiple features can be tested simultaneously
- 📱 **TestFlight Separation**: Clear staging vs production app distribution

## 📁 **Project Structure**

```
asktoddy-mobile/
├── src/
│   ├── components/ui/          # Reusable UI components
│   ├── screens/               # App screens
│   ├── services/              # Business logic services
│   │   ├── ai/               # AI middleware & providers
│   │   └── pricing/          # UK construction pricing
│   ├── contexts/             # React contexts
│   ├── navigation/           # Navigation setup
│   └── styles/               # Design system
├── .claude-context/          # Session persistence
│   ├── current-session.json  # Latest session state
│   ├── work-log.md           # Development history
│   ├── linear-tickets.json   # Synced tickets
│   └── recovery-checklist.md # Recovery procedures
└── scripts/                  # Automation scripts
    ├── sync-linear-api.js    # Linear integration
    ├── save-context.js       # Context management
    └── update-documentation.js # This script
```

## 🔧 **Available Scripts**

### **Development**
| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `npm start`              | Start Expo development server |
| `npm run ios`            | Run on iOS simulator          |
| `npm run android`        | Run on Android emulator       |

### **Deployment & TestFlight**
| Command                     | Description                        |
| --------------------------- | ---------------------------------- |
| `npm run deploy:testflight` | Smart deployment (detects branch) |
| `npm run deploy:staging`    | Deploy to staging TestFlight      |
| `npm run deploy:production` | Deploy to production TestFlight   |

### **Context Management**
| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `npm run context:save`   | Save current session state    |
| `npm run context:linear` | Sync Linear tickets           |
| `npm run context:sync`   | Save context + sync tickets   |
| `npm run claude:resume`  | Quick context check           |

### **Utilities**
| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `npm run docs:update`    | Update this README            |
| `npm run git:checkpoint` | Create checkpoint commit      |
| `npm run lint`           | Run ESLint                    |
| `npm run format`         | Format code with Prettier     |

## 🔄 **Context Recovery**

If starting a new Claude session:

1. **Quick Recovery:**

   ```bash
   npm run claude:resume
   ```

2. **Full Context:**

   ```bash
   cat .claude-context/work-log.md
   cat .claude-context/linear-tickets.json
   ```

3. **Next Steps:**
   Check `.claude-context/api-first-roadmap.md` for detailed implementation plan.

## 📞 **Key Information**

- **Linear API:** Configured with `your_linear_api_key_here`
- **Supabase:** Ready for Edge Functions deployment
- **AI Providers:** Gemini (primary) + OpenAI (secondary) + Mock (fallback)
- **Git Branch:** main
- **Last Commit:** f0c3443 checkpoint: development progress - 2025-10-15 10:34

## 🎯 **Next Session Priorities**

1. Create detailed Linear tickets from `.claude-context/linear-tickets-api-first.md`
2. Start Week 1: Supabase Edge Functions setup
3. Migrate AIMiddleware (455 lines) to Edge Function
4. Build UK pricing services integration
5. Implement OpenAI provider for LLM switching

---

**🤖 Auto-generated by `npm run docs:update` on 2025-10-21T11:39:12.111Z**

_For detailed technical documentation, see `.claude-context/` directory._
