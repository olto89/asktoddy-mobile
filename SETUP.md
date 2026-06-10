# AskToddy Mobile — Developer Setup

_Last updated: 2026-06-09_

## Prerequisites

- **Node.js** 18+ (repo currently developed on v24)
- **npm**
- **Git**
- **Expo** (run via `npx expo` — no global install needed)
- **iOS Simulator** (macOS) and/or **Android Emulator**
- **Xcode** (macOS, for iOS) / **Android Studio** (for Android)

## Quick start

```bash
git clone https://github.com/olto89/asktoddy-mobile.git
cd asktoddy-mobile
npm install
npm start            # Expo dev server — press 'i' (iOS) or 'a' (Android)
```

## Environment configuration

The app only ever holds **public** config (`EXPO_PUBLIC_*`). All secrets
(Gemini key etc.) live server-side in Supabase Edge Function secrets — you do
**not** need any AI API keys for local development.

1. Get the staging `.env` values from the team (do not hardcode keys in docs).
   The required public vars are:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://<staging-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
   EXPO_PUBLIC_APP_ENV=staging
   ```

2. New developers should use **staging only**.

See [`ENVIRONMENT_CONFIG.md`](ENVIRONMENT_CONFIG.md) for the full list and how
environments are switched.

> The anon key is public by design (protected by RLS), but keys still don't
> belong in committed docs — pull them from the team's secret store.

## Running

```bash
npm start            # dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # web
```

Physical device: install **Expo Go**, run `npm start`, scan the QR code.

## Project structure

```
asktoddy-mobile/
├── src/
│   ├── components/   # Reusable UI (incl. ui/ primitives)
│   ├── screens/      # Screen-level components
│   ├── navigation/   # Navigation config
│   ├── services/     # Supabase + edge-function clients
│   ├── hooks/        # Reusable logic
│   ├── contexts/     # Global state (AuthContext, ...)
│   ├── constants/    # Shared constants (quote defaults, ...)
│   ├── utils/        # Helpers (vat, imageStorage, ...)
│   └── styles/       # Design tokens
├── supabase/
│   ├── functions/    # Edge functions (analyze-construction, ...)
│   └── migrations/   # Database migrations
├── jest/             # Test utils + global mocks
├── app.json          # Expo config (version, ios.buildNumber)
├── eas.json          # EAS Build profiles
└── package.json
```

## Quality & tests

```bash
npm run test         # Jest (single: npm run test -- path/to.test.tsx)
npm run type-check   # tsc --noEmit
npm run lint         # eslint --fix
npm run quality      # type-check + lint:check + format:check
```

Tests are colocated in `__tests__/`. Global mocks (AsyncStorage, Supabase,
RevenueCat, Expo modules) and `renderWithProviders` live in `/jest`. **Write a
test for every new feature, fix, or refactor.**

## Troubleshooting

```bash
npx expo start -c                       # clear Metro cache
rm -rf node_modules && npm install      # dependency reset
npx expo prebuild --clean               # regenerate native projects
```

## Next steps

1. Get staging env values and run the app locally.
2. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`PROJECT_STATUS.md`](PROJECT_STATUS.md).
3. Pick up a ticket (`.claude-context/linear-tickets.json`), branch, and PR.

> Never commit `.env` files or secrets. See `SECURITY_BEST_PRACTICES.md`.
