# Production Cutover Plan

_Last updated: 2026-06-10_

How to promote work from **staging** to **production**. We build and verify
everything on staging, then promote via the explicit checklist below. Frontend
parity is automatic on a branch merge; **backend parity is manual** and is where
all the real risk lives.

## Environment topology

| Layer                      | Staging                  | Production                                         |
| -------------------------- | ------------------------ | -------------------------------------------------- |
| Git branch                 | `staging` (active)       | `main`                                             |
| Supabase project ref       | `iezmuqawughmwsxlqrim`   | `tggvoqhewfmczyjoxrqu`                             |
| Bundle ID                  | `com.asktoddy.staging`   | `com.asktoddy.prod` (via `APP_VARIANT=production`) |
| Build profile (`eas.json`) | `staging`                | `production`                                       |
| Edge fn deploy             | `npm run deploy:staging` | `npm run deploy:production`                        |
| Secrets file               | `.env.staging`           | `.env.production`                                  |

The **app code is shared** — the same source builds both apps; only build-time
env in `eas.json` differs. The **backends are two separate Supabase projects** —
edge functions, migrations, secrets, and storage buckets must be applied to each
independently.

## ⚠️ Drift snapshot (2026-06-10)

Production is **far** behind and appears to be a near-fresh backend:

- **Prod Supabase project appears PAUSED / dormant.** Its REST + storage hosts do
  not resolve (DNS fails) while the management API still works — the classic
  signature of a paused free-tier project (last activity 2025-10-23). **Must be
  un-paused from the Supabase dashboard before anything can deploy.** _(User
  action — verify in dashboard.)_
- **Edge functions:** prod has only 3 (`analyze-construction`, `generate-document`,
  `get-pricing`) at **version 7, 2025-10-23**. Staging is at version ~107.
  Five functions are **missing from prod entirely**: `delete-account`,
  `get-session-quote`, `scheduled-tasks`, `sync-quotes`, `update-ons-cache`.
- **Database schema:** unverified (project unreachable), but almost certainly
  missing everything from late 2025 onward — including the `quotes` table
  (2026-03-16) and `company-logos` storage bucket. Treat prod DB as empty.
- **No real users in prod** → we can rebuild it cleanly. Cutover is "deploy
  everything," not "carefully migrate deltas."

## Cutover checklist (run in order, before App Store submission)

> Prereq: own Apple Developer account + App Store Connect app exist (blocked on
> DUNS — tracked separately). The backend steps below are **not** blocked and can
> be done now once the prod project is un-paused.

1. **Un-pause the prod Supabase project** (`tggvoqhewfmczyjoxrqu`) in the
   dashboard. Confirm REST host resolves: `curl -I https://tggvoqhewfmczyjoxrqu.supabase.co/rest/v1/`.
2. **Apply all migrations to prod.** Link to prod and push:
   `supabase link --project-ref tggvoqhewfmczyjoxrqu && supabase db push`.
   Then re-link to staging (`supabase link --project-ref iezmuqawughmwsxlqrim`).
   Verify the `quotes`, `conversation_sessions`, and pricing-cache tables exist.
3. **Create storage buckets** in prod (`company-logos`) with matching RLS — the
   `20260320_company_logos_bucket.sql` / `20260326_fix_company_logos_rls.sql`
   migrations should handle this; verify in the dashboard.
4. **Populate `.env.production` secrets** — Gemini API key (rotated, see security
   hardening), prod Supabase service-role key, RevenueCat prod key (after own
   account), any others. Mirror `.env.staging` keys.
5. **Deploy edge functions to prod:** `npm run deploy:production`. Confirm all 8
   functions deploy and the version jumps from 7 to current.
6. **Set edge function secrets in prod** (Supabase dashboard or
   `supabase secrets set --project-ref tggvoqhewfmczyjoxrqu`) — Gemini key etc.
   These do NOT come from `.env.production` automatically.
7. **Merge code:** `git checkout main && git merge staging && git push origin main`.
8. **Build + submit prod app:** bump `ios.buildNumber`, then
   `eas build --profile production --platform ios --auto-submit --non-interactive`.
   (Prod ASC App ID: `6754278089`.)
9. **Smoke-test prod end to end:** sign up, generate a quote (real AI), save,
   share PDF, delete account, restore purchases.

## Parity rule going forward

Every backend change merged to `main` must be accompanied by steps 2/5/6 against
the prod project. Migrations and edge-function deploys do **not** propagate
automatically. Keep a one-line note in the work log whenever prod is brought
level so drift never silently reopens.
