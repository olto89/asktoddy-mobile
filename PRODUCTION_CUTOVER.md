# Production Cutover Plan

_Last updated: 2026-07-07_

How to promote work from **staging** to **production**, and the remaining steps to
ship v1 to the App Store. We build and verify everything on staging, then promote
via the explicit checklist below. Frontend parity is automatic on a branch merge;
**backend parity is manual** and is where all the real risk lives.

## Environment topology

| Layer                      | Staging                  | Production                                             |
| -------------------------- | ------------------------ | ------------------------------------------------------ |
| Git branch                 | `staging` (active)       | `main`                                                 |
| Supabase project ref       | `iezmuqawughmwsxlqrim`   | `rdlnlvtfwzntxiyugcuk` (rebuilt 2026-07-02)            |
| Bundle ID                  | `com.asktoddy.staging`   | `com.oakhouse.asktoddy` (via `APP_VARIANT=production`) |
| Build profile (`eas.json`) | `staging`                | `production`                                           |
| Edge fn deploy             | `npm run deploy:staging` | `npm run deploy:production`                            |
| Secrets file               | `.env.staging`           | `.env.production`                                      |
| ASC App ID                 | `6785867307`             | `6785868118`                                           |

The **app code is shared** — the same source builds both apps; only build-time
env in `eas.json` differs. The **backends are two separate Supabase projects** —
edge functions, migrations, secrets, and storage buckets must be applied to each
independently.

Apple: own Company/Org account, Team ID `48HRFFDTVQ`. ASC API key `Q7DT7VPXB6`
(issuer `2a31713b-c178-40b1-a0e7-d7eb753c7c0f`) wired into both eas.json submit
profiles.

## Status snapshot (2026-07-07)

The old prod project (`tggvoqhewfmczyjoxrqu`) was paused >90 days, became
permanently unrecoverable, and was deleted. It had no real users. A **fresh prod
project (`rdlnlvtfwzntxiyugcuk`) was stood up and baselined on 2026-07-02** via
the Supabase Management API. Backend is largely cutover already:

- **✅ Schema applied** — `conversation_sessions`, `quotes`, `quote_usage`,
  `user_subscriptions`, and the public `company-logos` bucket.
  - **Skipped (intentionally):** `20241203_setup_cron_jobs` (staging-hardcoded
    pg_cron, errors on a fresh DB), `20251105_add_concrete_category`,
    `20251113_scraped_materials` (labour_rates drift — a `task_description` column
    was added out-of-band on staging and never captured in a migration file).
    None of these are read by any edge function at runtime (`get-pricing` uses
    in-code constants in `data/uk-pricing-data.ts`), so skipping is safe for core
    quoting + payments. Revisit if pricing/cron tables are ever queried at runtime.
- **✅ All 10 edge functions deployed** to prod (analyze-construction,
  delete-account, generate-document, get-pricing, get-session-quote,
  revenuecat-webhook, scheduled-tasks, sync-quotes, toddy-advice,
  update-ons-cache).
- **✅ App config repointed** — `eas.json` production env + `.env.production` use
  the new prod URL + anon/service-role keys (commit `661ef69`).
- **✅ Prod secrets set** — `GEMINI_API_KEY` (created under personal Gmail, project
  `asktoddy mobile prod`; verified against gemini-2.5-flash) and
  `REVENUECAT_WEBHOOK_AUTH` (`f0d0378801bf190cf286cec780ae53dd500eba7193c0225833ade1cbbfbcd968`).
  `SUPABASE_SERVICE_ROLE_KEY` is auto-injected — do not set manually.

## Remaining to ship v1 (run in order)

Backend is baselined; what's left is prod payments, cost controls, store prep, and
the build. Ownership marked **[me]** (in-repo) vs **[you]** (dashboard/account).

1. **[me] Push staging** — done 2026-07-07 (`origin/staging` @ `2a08045`).

2. **[you] Prod RevenueCat + ASC subscription**
   - Create a **prod RC app** on bundle `com.oakhouse.asktoddy`; generate its own
     prod iOS SDK key.
   - Create the ASC subscription product `asktoddy_pro_monthly` (£9.99/month) and
     submit for approval. Configure the `premium` entitlement (must match
     `RevenueCatService.ts` `ENTITLEMENT_ID='premium'`). Set the `default` offering
     Current with the monthly package.
   - Add the **prod RC webhook** → URL
     `https://rdlnlvtfwzntxiyugcuk.supabase.co/functions/v1/revenuecat-webhook`,
     Authorization header = the prod `REVENUECAT_WEBHOOK_AUTH` value above.

3. **[me] Swap the prod RevenueCat key in `eas.json`** — the production profile
   still carries the **partner's** key `appl_fzMpeIdnKZEhSbuJxHucxfSlVwx`
   (line ~45). Replace with your new prod iOS SDK key from step 2.

4. **[you] ⚠️ Prod cost controls — CRITICAL pre-launch blocker.** On the
   `asktoddy mobile prod` Google Cloud project (no billing card yet):
   - Add a billing card.
   - Set a monthly budget + alerts at 50/75/90% (Cloud Console → Billing →
     Budgets & Alerts).
   - Set a daily request quota on the Gemini API (APIs & Services → Quotas).
   - The app has a template fallback, so throttling degrades gracefully to
     non-AI quotes rather than failing.

5. **[you] Sign in with Apple** — enable the capability on the App ID, create a
   Services ID + .p8 key, and configure the Supabase Apple provider with
   `com.oakhouse.asktoddy` in the authorized Client IDs (audience mismatch is the
   usual failure). Or **hide the Apple button for v1** — email-only is compliant
   since there are no other third-party logins. A visible-but-broken button is a
   rejection risk.

6. **[you] App Store metadata** — screenshots (6.7" + 5.5"), description, keywords,
   category, app icon, privacy policy URL, support URL. Currently not started.

7. **[you] Landing page** — asktoddy.com (company: Oakhouse) single-pager with
   app description, privacy policy, and support contact. Must be live before
   review submission (Apple requires reachable privacy/support URLs).

8. **[me] Merge code:**
   `git checkout main && git merge staging && git push origin main`.

9. **[me] Build + submit prod app:** bump `ios.buildNumber` in `app.json`, then
   `eas build --profile production --platform ios --auto-submit --non-interactive`.
   Prod ASC App ID: `6785868118`.

10. **[you/me] Smoke-test prod end to end:** sign up → generate a real-AI quote →
    save → share PDF → sandbox purchase → generate 6+ quotes with no 429 (Pro
    exemption) → delete account → **Sign in with Apple**.

## Migration + secret parity rule going forward

Every backend change merged to `main` must be accompanied by, against the prod
project (`rdlnlvtfwzntxiyugcuk`):

- the migration (applied via the Supabase Management API — see below), and
- the edge-function deploy (`npm run deploy:production`), and
- any new edge-function secret.

Migrations and edge-function deploys do **not** propagate automatically. Keep a
one-line note in the work log whenever prod is brought level so drift never
silently reopens.

**Running migrations without the CLI:** the Supabase CLI keeps its token in the
macOS keychain (unreadable from automation) and `db push` needs the DB password
interactively. Use the **Management API** with a user-supplied PAT (`sbp_…` from
dashboard → account → tokens):
`POST https://api.supabase.com/v1/projects/<ref>/database/query` with
`{"query": <sql>}`, `Authorization: Bearer <PAT>`. Pass SQL via an env var to
avoid shell-quoting issues. This bypasses migration-history drift entirely (same
effect as the dashboard SQL editor). Revoke the PAT afterwards.

## Notes / caveats

- **Free-tier auto-pause:** a free Supabase project re-pauses after ~7 days idle.
  A launched app with traffic won't be idle, but a lull (or the pre-launch gap)
  can pause prod and take the backend down. Keep it warm or move to Pro before
  real traffic. A fresh <90-day pause IS restorable (unlike the old one).
- Prod DB password: `54cef34330550cf567aec556e16f59991a18f9b8a7625cb1`.
- **No OTA:** there is no `expo-updates`; JS-only changes do not reach a build
  without a full rebuild. Never claim "no build needed" for JS changes.
