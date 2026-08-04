# CLAUDE.md — AskToddy Mobile

Guidance for Claude Code in the **AskToddy Mobile** repo. Oakhouse app #1.
AI-powered construction quoting (React Native/Expo · Supabase · Google Gemini).

## Start of session (current status lives in context, not here)

Volatile status/plan/blockers change often — read these first, don't trust this file for "what's live":

1. `cat .claude-context/current-session.json` — sprint plan, scope, blockers
2. `cat .claude-context/work-log.md` — recent history
3. `cat .claude-context/decisions.md` — ADRs
4. `cat .claude-context/linear-tickets.json` — tickets (ASK-###)

Save context during/after work: `npm run context:save` (or `context:sync` to also sync Linear).

## Essential commands

```bash
npm start                # Expo dev server
npm run ios | android    # Simulators
npm run test             # Jest
npm run deploy:staging   # Deploy edge fns + build to TestFlight (staging)
npm run deploy:production # Prod deploy (see PRODUCTION_CUTOVER.md — manual, no auto-propagation)
npm run functions:deploy # Deploy Supabase Edge Functions
```

EAS builds must use `--non-interactive` (credentials cached on EAS). **Always bump `buildNumber`
in `app.json` before building** — TestFlight rejects reused numbers. **No OTA** — JS-only changes
still need a full rebuild to reach a TestFlight build.

## Architecture

- **Client** (`/src/`): RN/Expo, thin presentation layer.
- **AI**: Supabase Edge Function `analyze-construction` calls Gemini server-side (provider middleware +
  template fallback). Zero client-side provider keys.
- **Auth/usage**: edge fn requires a verified JWT (userId from token, never the body); free tier
  5 quotes/month enforced server-side (`quote_usage` + `increment_quote_usage` RPC).
- **Payments**: RevenueCat (`premium` entitlement); server-side Pro exemption via `user_subscriptions`
  - `revenuecat-webhook` edge fn.
- **Two backends**: staging + production are SEPARATE Supabase projects; one repo (`staging`/`main`
  branches), differences injected via `eas.json`. Parity is MANUAL — nothing auto-propagates staging→prod.

## Core principles (Oakhouse house style)

- **All business logic in the Supabase backend** (Edge Functions, RLS, triggers). Client only does
  local storage, navigation, and device UX.
- **Write tests for all new code** — colocated in `__tests__/`, using `jest/test-utils.tsx` and
  `jest/setup.ts` mocks. Deno edge code can't import under Jest — mirror the pure logic in the test.
- `tsc --noEmit` has many pre-existing errors (Deno edge files under app tsconfig) — don't treat a
  failing type-check as your regression without confirming it's pre-existing.

## Key docs

- `PRODUCTION_CUTOVER.md` — prod deploy/cutover checklist (prod is a rebuilt, separate project)
- `DEPLOYMENT.md` — mobile deploy procedures
- `marketing/` — landing site + `APP_STORE_METADATA.md` (App Store listing copy)
- `README.md` — full project documentation
