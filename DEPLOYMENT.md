# AskToddy Mobile — Deployment Guide

_Last updated: 2026-06-09_

## Environments

| Environment | Purpose               | Bundle ID              | Build profile | ASC App ID   |
| ----------- | --------------------- | ---------------------- | ------------- | ------------ |
| Staging     | TestFlight (internal) | `com.asktoddy.staging` | `staging`     | `6754278065` |
| Production  | App Store             | `com.asktoddy.prod`    | `production`  | `6754278089` |

- **EAS account:** `olto89`
- Credentials are cached on EAS servers — no Apple login prompt is needed when
  building with `--non-interactive`.

## Build & submit to TestFlight (staging)

> **Two rules every time:**
>
> 1. **Bump `ios.buildNumber` in `app.json`** before building — TestFlight
>    rejects reused build numbers. Increment from the current value.
> 2. Use **`--non-interactive`** when triggering from CI/automation — stdin
>    isn't readable, so an interactive build will hang/fail.

```bash
cd /Users/olivertodd/Desktop/asktoddy-mobile

# 1. Deploy edge functions to staging (if backend changed)
npm run deploy:staging

# 2. Bump ios.buildNumber in app.json (current: 49 → 50, ...)

# 3. Build + auto-submit to TestFlight
eas build --profile staging --platform ios --auto-submit --non-interactive
```

`--auto-submit` uploads to TestFlight automatically once the build completes.

## Production (App Store)

```bash
# Backend
npm run deploy:production

# Bump ios.buildNumber, then:
eas build --profile production --platform ios --auto-submit --non-interactive
```

Production submits to ASC App ID `6754278089`.

## Edge functions

Edge functions are deployed independently of the app binary:

```bash
npm run deploy:staging        # node scripts/deploy-edge-functions.js staging
npm run deploy:production
npm run supabase:validate     # validate before deploy
```

The primary function is `analyze-construction` (Gemini quoting). Others:
`delete-account`, `generate-document`, `get-pricing`, `get-session-quote`,
`sync-quotes`, `scheduled-tasks`, `update-ons-cache`.

## Secrets

Edge-function secrets live in the **Supabase dashboard**
(Project Settings → Edge Functions → Secrets), never in the repo:

```env
GEMINI_API_KEY=<set in Supabase dashboard>
```

> ⚠️ **Rotate the Gemini API key before launch.** An old key was previously
> committed in this file and is in git history. Only `GEMINI_API_KEY` is needed
> — the app is single-provider (no OpenAI). See `PRODUCTION_CHECKLIST.md`.

App-side env files (`.env.staging`, `.env.production`) hold only public config
(`EXPO_PUBLIC_*`). See `ENVIRONMENT_CONFIG.md`.

## Pre-launch checklist

Before the first real App Store submission, work through
[`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) — Gemini cost controls,
per-user rate limiting, secret rotation, landing page + privacy policy, and
removal of any remaining "coming soon" placeholders.

## Troubleshooting

```bash
# Edge function logs
supabase functions logs analyze-construction

# Clean rebuild
rm -rf node_modules && npm install
npx expo prebuild --clean
```

- TestFlight build rejected → check `ios.buildNumber` was bumped.
- Build hangs from automation → missing `--non-interactive`.
- TestFlight builds expire after 90 days; App Store review ~1-2 weeks.
