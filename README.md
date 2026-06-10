# AskToddy Mobile

AI-powered construction quoting for UK tradespeople. Capture a site
assessment, get an AI-generated, priced quote in seconds, edit it, and share a
professional PDF — built with React Native / Expo, Supabase, and Google Gemini.

> **Status:** v1.2.4 (build 49) · branch `staging` · pre-launch
> **Target:** iOS launch end of May/June 2026 · Android to follow
> **Last updated:** 2026-06-09

---

## What it does

The core flow is a guided, mobile-first quoting workflow:

```
Login / Signup → Site Notes → AI Task List → Edit Quote → Share (text / PDF)
```

1. **Site Notes** — guided capture: job type, dimensions, location, finish
   level, free-text notes, photos, and voice notes.
2. **AI task list** — the brief is sent to the `analyze-construction` edge
   function, which calls Gemini and returns a fully structured, priced quote
   (5-8 tasks with combined materials + labour costs).
3. **Edit Quote** — adjust line items and your price; totals recalculate live.
4. **Share** — professional quote as shareable text or PDF, with company
   branding, business contact details, VAT breakdown, and a legal notice.

All prices are stored **ex-VAT**; 20% VAT is calculated at display time.

## Business model (freemium)

- **Free** — limited quotes per month
- **Pro (£9.99/mo)** — unlimited quotes + premium features
- **Business (£19.99/mo)** — team/advanced features

Payments via **RevenueCat** (`react-native-purchases`). See
`.claude-context/` for the current launch/payment-setup status.

## Architecture (high level)

**Thin client, backend-owned logic.** All business logic lives in Supabase
(edge functions, RLS, triggers). The React Native app is a presentation layer;
the only client-side logic is what must be local (AsyncStorage, navigation,
network-status detection).

- **Mobile app** (`/src`) — screens, components, hooks, contexts, design tokens.
- **AI quoting** (`/supabase/functions/analyze-construction`) — single-provider
  **Gemini 2.5 Flash** with a deterministic generation config (low temperature
  - seed + native JSON) and a **template fallback** when AI is unavailable.
- **Other edge functions** — `delete-account`, `generate-document`,
  `get-pricing`, `get-session-quote`, `sync-quotes`, `scheduled-tasks`,
  `update-ons-cache`.

> **Single provider, by design.** Older docs describe a multi-provider
> (Gemini + OpenAI) system and a static pricing engine / scraping pipeline —
> those are **not** in the live quote flow. See `docs/archive/` and
> `.claude-context/decisions.md` (ADR-002, ADR-016, ADR-017).

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for detail.

## Tech stack

| Area            | Choice                                                              |
| --------------- | ------------------------------------------------------------------- |
| App             | React Native + Expo `~54.0.30`, React Native `0.81.5`               |
| AI              | Google Gemini 2.5 Flash (`@google/generative-ai`) via edge function |
| Backend         | Supabase (Edge Functions, Auth, Postgres + RLS)                     |
| Payments        | RevenueCat (`react-native-purchases`)                               |
| Storage         | AsyncStorage (local) + Supabase (cloud)                             |
| Build / release | EAS Build → TestFlight (staging auto-submit)                        |
| Tests           | Jest + React Native Testing Library (310 tests)                     |

## Getting started

```bash
npm install
npm start            # Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
```

Environment setup: see [`SETUP.md`](SETUP.md) and
[`ENVIRONMENT_CONFIG.md`](ENVIRONMENT_CONFIG.md).

## Common commands

```bash
# Quality
npm run test                 # Jest (single: npm run test -- path/to.test.tsx)
npm run type-check           # tsc --noEmit
npm run lint                 # eslint --fix
npm run quality              # type-check + lint:check + format:check

# Backend / deploy
npm run deploy:staging       # Deploy edge functions to staging
npm run deploy:production    # Deploy edge functions to production
npm run build:staging        # EAS iOS build (staging)  — see DEPLOYMENT.md
npm run build:production     # EAS iOS build (production)

# Session context (see CLAUDE.md)
npm run context:save         # Save .claude-context/current-session.json
npm run context:sync         # Save context + sync Linear tickets
```

> EAS builds from automation must use `--non-interactive` and a bumped
> `ios.buildNumber`. See [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Testing

Colocated tests in `__tests__/` directories. Test infra in `/jest`
(`renderWithProviders`, pre-mocked AsyncStorage / Supabase / RevenueCat / Expo
modules). **Every new feature, fix, or refactor ships with a test.**

```bash
npm run test
npm run test -- src/screens/__tests__/ShareQuoteScreen.test.tsx
```

## Key docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — architecture & code standards
- [`SETUP.md`](SETUP.md) — local setup
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — EAS build & TestFlight
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — current status & launch plan
- [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) — pre-launch checklist
- [`APPLE_DEVELOPER_SETUP.md`](APPLE_DEVELOPER_SETUP.md) · [`ANDROID_TESTING.md`](ANDROID_TESTING.md)
- `.claude-context/` — live session recovery, work log, and decision records
- `docs/archive/` — historical docs (kept for reference; likely inaccurate)
