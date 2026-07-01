/**
 * Per-user quote usage limiting (T2).
 *
 * Enforces the free-tier monthly quota server-side. The previous gate lived only
 * in the client (AsyncStorage), so clearing app data reset it — this moves the
 * source of truth into the database, keyed off the verified user id.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const FREE_MONTHLY_LIMIT = 5;

export type Tier = 'free' | 'pro';

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  tier: Tier;
}

/** Current UTC billing period as 'YYYY-MM'. */
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Resolve a user's subscription tier from the RevenueCat entitlement mirror
 * (public.user_subscriptions), kept up to date by the revenuecat-webhook function.
 *
 * A user is 'pro' when they hold an active 'premium' entitlement that hasn't
 * expired. Fails to 'free' on any error: a DB hiccup shouldn't hand out unlimited
 * quotes, and a legitimate Pro user is only briefly capped at the (lenient) free
 * limit — checkQuoteAllowed itself then fails OPEN on a usage-read error.
 */
export async function getUserTier(userId: string): Promise<Tier> {
  try {
    const { data, error } = await adminClient()
      .from('user_subscriptions')
      .select('is_active, expires_at')
      .eq('user_id', userId)
      .eq('entitlement', 'premium')
      .maybeSingle();

    if (error) {
      console.error('⚠️ tier lookup failed, treating as free:', error.message);
      return 'free';
    }
    if (!data || !data.is_active) return 'free';
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return 'free';
    return 'pro';
  } catch (e) {
    console.error('⚠️ tier lookup threw, treating as free:', e);
    return 'free';
  }
}

/**
 * Read-only check of whether the user may generate another quote this month.
 * Pro users are unlimited. Fails OPEN on a tracking error so a transient DB
 * issue never blocks a legitimate user — abuse during an outage is bounded.
 */
export async function checkQuoteAllowed(userId: string): Promise<UsageStatus> {
  const tier = await getUserTier(userId);
  if (tier === 'pro') {
    return { allowed: true, used: 0, limit: Infinity, tier };
  }

  const limit = FREE_MONTHLY_LIMIT;
  try {
    const { data, error } = await adminClient()
      .from('quote_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('period', currentPeriod())
      .maybeSingle();

    if (error) {
      console.error('⚠️ usage check failed, allowing request:', error.message);
      return { allowed: true, used: 0, limit, tier };
    }

    const used = data?.count ?? 0;
    return { allowed: used < limit, used, limit, tier };
  } catch (e) {
    console.error('⚠️ usage check threw, allowing request:', e);
    return { allowed: true, used: 0, limit, tier };
  }
}

/** Atomically record a successful quote generation. Best-effort; logs on failure. */
export async function recordQuoteUsage(userId: string): Promise<void> {
  try {
    const { error } = await adminClient().rpc('increment_quote_usage', {
      p_user_id: userId,
      p_period: currentPeriod(),
    });
    if (error) console.error('⚠️ usage increment failed:', error.message);
  } catch (e) {
    console.error('⚠️ usage increment threw:', e);
  }
}
