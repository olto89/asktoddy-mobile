# Pre-Release Security Checklist

> **REMINDER:** Do NOT ship a production release until every P0 item below is resolved.
> When starting a release session, read this file first and work through unresolved items.

Last updated: 2026-03-26

---

## P0 — Must fix before production release

- [ ] **Server-side quote limit enforcement**
  - `canGenerateQuote` / `incrementQuoteUsage` live entirely in client AsyncStorage — trivially bypassable.
  - Fix: `analyze-construction` edge function must check the user's quota in the database before processing. Return 402/429 if exceeded. The client check can remain as UX, but the server is the authority.
  - Files: `supabase/functions/analyze-construction/index.ts`, `src/contexts/AuthContext.tsx`

- [ ] **Add auth to `analyze-construction` edge function**
  - Currently processes requests without verifying the Authorization header. Any unauthenticated caller can trigger expensive Gemini API calls.
  - Fix: Require a valid JWT, extract `user_id`, reject unauthenticated requests with 401.
  - File: `supabase/functions/analyze-construction/index.ts` (~line 992)

- [ ] **Validate session ownership in `get-session-quote`**
  - Accepts `sessionId` from the request without checking the authenticated user owns it. User A can fetch User B's quotes.
  - Fix: Add `WHERE user_id = auth.uid()` or join against `conversation_sessions.user_id`.
  - File: `supabase/functions/get-session-quote/index.ts` (~line 109)

- [ ] **Add auth to `generate-document` edge function**
  - No authentication check on POST endpoint. Anyone can generate PDFs.
  - File: `supabase/functions/generate-document/index.ts` (~line 13)

- [ ] **Rotate exposed service role keys**
  - `.env.production` and `.env.staging` contain `SUPABASE_SERVICE_ROLE_KEY` (full admin access).
  - Check git history: `git log -S "eyJhbGci" --all`
  - Fix: Rotate both keys in Supabase dashboard immediately. Move to CI/CD secrets (EAS Secrets). Remove from committed files. Add `.env.production` / `.env.staging` to `.gitignore` if not already.
  - Files: `.env.production`, `.env.staging`

---

## P1 — High priority, fix before or alongside release

- [ ] **Complete account deletion (GDPR)**
  - Delete-account flow misses local data: `site_notes`, `current_site_notes`, `conversation_session_id`, chat history (`@asktoddy_chat_messages_*`).
  - Fix: Call `chatHistoryService.clearAll()` and remove remaining AsyncStorage keys during deletion in `AuthContext.tsx`.
  - File: `src/contexts/AuthContext.tsx` (~line 608-641)

- [ ] **Strip sensitive console.log in production**
  - `ChatScreen.tsx` logs full analysis responses, session IDs, request bodies.
  - `InteractiveQuoteTable.tsx` logs entire cost breakdowns.
  - `AuthContext.tsx` logs emails and auth state.
  - Fix: Guard all sensitive logs with `if (__DEV__)` or remove entirely.
  - Files: `src/screens/ChatScreen.tsx`, `src/components/InteractiveQuoteTable.tsx`, `src/contexts/AuthContext.tsx`

- [ ] **Sanitise deep link logging**
  - `AuthContext.tsx:277` logs `Deep link received: {url}` which contains `access_token` and `refresh_token` in the URL fragment.
  - Fix: Log `'Deep link received - processing auth callback'` instead of the full URL.
  - File: `src/contexts/AuthContext.tsx` (~line 277)

- [ ] **Fix `SECURITY DEFINER` function missing caller check**
  - `upsert_conversation_session` runs with owner privileges but doesn't verify `p_user_id = auth.uid()`. Allows horizontal privilege escalation.
  - Fix: Add `IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;` at the top of the function body.
  - File: `supabase/migrations/20251024_conversation_context.sql` (~line 162) — create new migration to alter.

---

## P2 — Should fix, lower urgency

- [ ] **Implement per-user rate limiting on edge functions**
  - The in-memory `usage-tracker.ts` resets on every deploy and isn't per-user.
  - Fix: Track usage per user in a database table or use Supabase's built-in rate limiting.
  - File: `supabase/functions/analyze-construction/usage-tracker.ts`

- [ ] **Restrict CORS origins**
  - Currently `Access-Control-Allow-Origin: *` on all edge functions.
  - Fix: Remove the header entirely (mobile apps don't need CORS) or restrict to your domain.
  - File: `supabase/functions/_shared/env.ts` (~line 61)

- [ ] **Sanitise error responses**
  - `generate-document` and `get-pricing` return raw error messages and stack traces to the client.
  - Fix: Return generic error messages; log details server-side only.
  - Files: `supabase/functions/generate-document/index.ts`, `supabase/functions/get-pricing/index.ts`

- [ ] **Move secrets out of `eas.json`**
  - Anon keys and RevenueCat keys are hardcoded in the build config.
  - Fix: Migrate to EAS Secrets (`eas secret:create`) and reference via `%EAS_SECRET_NAME%`.
  - File: `eas.json`

- [ ] **Add certificate pinning**
  - Standard OS cert validation only. Consider `react-native-ssl-pinning` for Supabase endpoints.

- [ ] **Create missing `conversation_messages` table**
  - `get-session-quote` references `conversation_messages` table that doesn't exist in any migration.
  - Fix: Create migration or update the query to use the correct table.
  - File: `supabase/functions/get-session-quote/index.ts` (~line 141)

---

## Already secure (verified 2026-03-26)

- RLS on `quotes` table scoped to `auth.uid()`
- Company-logos storage scoped per user folder (fixed 2026-03-26)
- Gemini API key server-side only, not in `EXPO_PUBLIC_*`
- Auth tokens sent via Bearer header, not query params
- All URLs use HTTPS
- `delete-account` edge function validates JWT
- `sync-quotes` edge function validates JWT
- Supabase session management with auto-refresh configured correctly
- Password reset delegated to Supabase's secure flow
