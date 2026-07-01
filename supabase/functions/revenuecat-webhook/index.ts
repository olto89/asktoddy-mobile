/**
 * RevenueCat webhook — mirrors subscription entitlements into
 * public.user_subscriptions so the backend (analyze-construction getUserTier)
 * can grant Pro users unlimited quotes.
 *
 * RevenueCat is the source of truth; this keeps a low-latency server copy so the
 * quote hot path never calls out to RevenueCat. Deployed with verify_jwt = false
 * (config.toml) because RevenueCat can't send a Supabase JWT — instead it sends
 * the Authorization header value configured in the RC dashboard, which we match
 * against REVENUECAT_WEBHOOK_AUTH.
 *
 * Identity: event.app_user_id IS the Supabase user id (app calls
 * Purchases.logIn(user.id)). Anonymous/unmapped RC ids are ignored.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENTITLEMENT = 'premium';

// Event types that revoke access outright. Everything else carrying a future
// expiry (or no expiry) grants — including CANCELLATION, where the user keeps
// access until the paid period ends (RevenueCat sends EXPIRATION when it lapses).
const REVOKING_TYPES = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

export function isActiveFromEvent(
  type: string,
  expirationAtMs: number | null,
  now: number
): boolean {
  if (REVOKING_TYPES.has(type)) return false;
  if (expirationAtMs != null) return expirationAtMs > now;
  return true; // non-revoking event with no expiry (lifetime / non-renewing)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidAppUserId(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

export interface SubscriptionState {
  userId: string;
  entitlement: string;
  isActive: boolean;
  productId: string | null;
  store: string | null;
  environment: string | null;
  expiresAt: string | null; // ISO
  eventType: string;
  eventId: string | null;
  eventTs: string; // ISO
}

/**
 * Map a RevenueCat webhook event to a subscription row, or null if it can't be
 * applied (no mappable Supabase user id, or an event scoped to a different
 * entitlement).
 */
// deno-lint-ignore no-explicit-any
export function eventToState(event: any, now: number = Date.now()): SubscriptionState | null {
  if (!event || typeof event !== 'object') return null;

  const userId = event.app_user_id;
  if (!isValidAppUserId(userId)) return null; // anonymous / unmapped RC id

  // If the event names entitlements and ours isn't among them, ignore it.
  const ents: string[] | undefined =
    event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : undefined);
  if (ents && !ents.includes(ENTITLEMENT)) return null;

  const type = String(event.type ?? '');
  const expirationAtMs = typeof event.expiration_at_ms === 'number' ? event.expiration_at_ms : null;
  const eventTsMs = typeof event.event_timestamp_ms === 'number' ? event.event_timestamp_ms : now;

  return {
    userId,
    entitlement: ENTITLEMENT,
    isActive: isActiveFromEvent(type, expirationAtMs, now),
    productId: event.product_id ?? null,
    store: event.store ?? null,
    environment: event.environment ?? null,
    expiresAt: expirationAtMs != null ? new Date(expirationAtMs).toISOString() : null,
    eventType: type,
    eventId: event.id ?? null,
    eventTs: new Date(eventTsMs).toISOString(),
  };
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

Deno.serve(async req => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  // Shared-secret auth configured in the RevenueCat dashboard Authorization header.
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') || '';
  const provided = req.headers.get('Authorization') || '';
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const state = eventToState(body?.event);
  if (!state) {
    // Not applicable (anonymous id, unrelated entitlement, or a test ping). Return
    // 200 so RevenueCat doesn't retry a permanently-unmappable event forever.
    return new Response(JSON.stringify({ ok: true, applied: false }), { status: 200, headers });
  }

  try {
    const { error } = await adminClient().rpc('apply_revenuecat_event', {
      p_user_id: state.userId,
      p_entitlement: state.entitlement,
      p_is_active: state.isActive,
      p_product_id: state.productId,
      p_store: state.store,
      p_environment: state.environment,
      p_expires_at: state.expiresAt,
      p_event_type: state.eventType,
      p_event_id: state.eventId,
      p_event_ts: state.eventTs,
    });
    if (error) {
      // 500 → RevenueCat retries, which is what we want for a transient DB issue.
      console.error('apply_revenuecat_event failed:', error.message);
      return new Response(JSON.stringify({ error: 'DB error' }), { status: 500, headers });
    }
  } catch (e) {
    console.error('revenuecat-webhook threw:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ ok: true, applied: true }), { status: 200, headers });
});
