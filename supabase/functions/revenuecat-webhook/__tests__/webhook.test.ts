/* eslint-disable @typescript-eslint/no-explicit-any */

// The webhook's index.ts uses Deno globals + an https import and can't be loaded
// under jest, so — following the usage.test.ts / advice.test.ts convention — we
// mirror the pure logic here: event → active mapping, app_user_id validation,
// event → state mapping, and the getUserTier active decision.

const ENTITLEMENT = 'premium';
const REVOKING_TYPES = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

// Mirror of isActiveFromEvent()
function isActiveFromEvent(type: string, expirationAtMs: number | null, now: number): boolean {
  if (REVOKING_TYPES.has(type)) return false;
  if (expirationAtMs != null) return expirationAtMs > now;
  return true;
}

// Mirror of isValidAppUserId()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidAppUserId(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

// Mirror of eventToState()
function eventToState(event: any, now: number): any {
  if (!event || typeof event !== 'object') return null;
  const userId = event.app_user_id;
  if (!isValidAppUserId(userId)) return null;

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

// Mirror of the getUserTier() active decision
function isPro(
  row: { is_active: boolean; expires_at: string | null } | null,
  now: number
): boolean {
  if (!row || !row.is_active) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return false;
  return true;
}

const NOW = Date.parse('2026-07-01T12:00:00Z');
const FUTURE = NOW + 30 * 24 * 3600 * 1000;
const PAST = NOW - 1000;

describe('isActiveFromEvent', () => {
  it('grants on purchase/renewal with a future expiry', () => {
    expect(isActiveFromEvent('INITIAL_PURCHASE', FUTURE, NOW)).toBe(true);
    expect(isActiveFromEvent('RENEWAL', FUTURE, NOW)).toBe(true);
    expect(isActiveFromEvent('PRODUCT_CHANGE', FUTURE, NOW)).toBe(true);
    expect(isActiveFromEvent('UNCANCELLATION', FUTURE, NOW)).toBe(true);
  });

  it('keeps access on CANCELLATION until the period ends', () => {
    // Cancellation = auto-renew off; user keeps access until expiry.
    expect(isActiveFromEvent('CANCELLATION', FUTURE, NOW)).toBe(true);
  });

  it('revokes on EXPIRATION and SUBSCRIPTION_PAUSED', () => {
    expect(isActiveFromEvent('EXPIRATION', FUTURE, NOW)).toBe(false);
    expect(isActiveFromEvent('SUBSCRIPTION_PAUSED', FUTURE, NOW)).toBe(false);
  });

  it('revokes when the expiry is already in the past', () => {
    expect(isActiveFromEvent('RENEWAL', PAST, NOW)).toBe(false);
  });

  it('grants a non-revoking event with no expiry (lifetime)', () => {
    expect(isActiveFromEvent('NON_RENEWING_PURCHASE', null, NOW)).toBe(true);
  });
});

describe('isValidAppUserId', () => {
  it('accepts a Supabase uuid', () => {
    expect(isValidAppUserId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('rejects anonymous RevenueCat ids and junk', () => {
    expect(isValidAppUserId('$RCAnonymousID:abc123')).toBe(false);
    expect(isValidAppUserId('')).toBe(false);
    expect(isValidAppUserId(undefined)).toBe(false);
    expect(isValidAppUserId(42)).toBe(false);
  });
});

describe('eventToState', () => {
  const uid = '123e4567-e89b-12d3-a456-426614174000';

  it('maps a sandbox INITIAL_PURCHASE for the premium entitlement', () => {
    const state = eventToState(
      {
        type: 'INITIAL_PURCHASE',
        app_user_id: uid,
        product_id: 'asktoddy_pro_monthly',
        entitlement_ids: ['premium'],
        store: 'APP_STORE',
        environment: 'SANDBOX',
        expiration_at_ms: FUTURE,
        event_timestamp_ms: NOW,
        id: 'evt_1',
      },
      NOW
    );
    expect(state).toMatchObject({
      userId: uid,
      entitlement: 'premium',
      isActive: true,
      productId: 'asktoddy_pro_monthly',
      store: 'APP_STORE',
      environment: 'SANDBOX',
      eventType: 'INITIAL_PURCHASE',
      eventId: 'evt_1',
    });
    expect(state.expiresAt).toBe(new Date(FUTURE).toISOString());
  });

  it('returns null for an anonymous app_user_id', () => {
    expect(
      eventToState({ type: 'INITIAL_PURCHASE', app_user_id: '$RCAnonymousID:x' }, NOW)
    ).toBeNull();
  });

  it('returns null for an event scoped to a different entitlement', () => {
    expect(
      eventToState({ type: 'INITIAL_PURCHASE', app_user_id: uid, entitlement_ids: ['gold'] }, NOW)
    ).toBeNull();
  });

  it('still maps when the event carries no entitlement_ids', () => {
    const state = eventToState(
      { type: 'RENEWAL', app_user_id: uid, expiration_at_ms: FUTURE },
      NOW
    );
    expect(state?.isActive).toBe(true);
  });
});

describe('getUserTier active decision (isPro)', () => {
  it('is pro for an active, unexpired entitlement', () => {
    expect(isPro({ is_active: true, expires_at: new Date(FUTURE).toISOString() }, NOW)).toBe(true);
  });

  it('is pro for an active entitlement with no expiry', () => {
    expect(isPro({ is_active: true, expires_at: null }, NOW)).toBe(true);
  });

  it('is free when inactive, expired, or missing', () => {
    expect(isPro({ is_active: false, expires_at: new Date(FUTURE).toISOString() }, NOW)).toBe(
      false
    );
    expect(isPro({ is_active: true, expires_at: new Date(PAST).toISOString() }, NOW)).toBe(false);
    expect(isPro(null, NOW)).toBe(false);
  });
});
