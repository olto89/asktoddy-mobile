/**
 * Tests for SubscriptionService (T6).
 * Guards against the regression where `logger` was referenced but never
 * imported (which made initialize() throw + get swallowed, leaving the service
 * permanently uninitialised), and covers the paywall-copy/plan helpers used by
 * PaywallModal.
 */
import { subscriptionService, SUBSCRIPTION_PLANS, PREMIUM_FEATURES } from '../SubscriptionService';

describe('SubscriptionService', () => {
  it('initialises without throwing (logger import regression guard)', async () => {
    await expect(subscriptionService.initialize()).resolves.toBeUndefined();
    // A free, inactive subscription is the default state after init.
    expect(subscriptionService.isFreePlan()).toBe(true);
    expect(subscriptionService.isInTrial()).toBe(false);
  });

  it('returns paywall copy for known features and a sensible default', () => {
    expect(subscriptionService.getPaywallMessage(PREMIUM_FEATURES.PDF_GENERATION)).toMatch(/PDF/i);
    expect(subscriptionService.getPaywallMessage('unknown' as never)).toBe(
      'Unlock premium features'
    );
  });

  it('offers a trial CTA while on the free plan', () => {
    expect(subscriptionService.getUpgradeCTA(PREMIUM_FEATURES.PDF_GENERATION)).toMatch(
      /free trial/i
    );
  });

  it('startFreeTrial activates a trial without throwing', async () => {
    const ok = await subscriptionService.startFreeTrial();
    expect(ok).toBe(true);
    expect(subscriptionService.isInTrial()).toBe(true);
  });

  it('activateSubscription marks the subscription active for a valid plan', async () => {
    const ok = await subscriptionService.activateSubscription('pro_monthly');
    expect(ok).toBe(true);
    expect(subscriptionService.getSubscriptionStatus()?.isActive).toBe(true);
    expect(subscriptionService.isFreePlan()).toBe(false);
  });

  it('activateSubscription rejects an unknown plan', async () => {
    const ok = await subscriptionService.activateSubscription('does_not_exist');
    expect(ok).toBe(false);
  });

  it('exposes the expected plan catalogue', () => {
    expect(SUBSCRIPTION_PLANS.pro_monthly.price).toBe('£9.99');
    expect(SUBSCRIPTION_PLANS.free.id).toBe('free');
  });
});
