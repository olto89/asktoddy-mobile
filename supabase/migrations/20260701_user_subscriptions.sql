-- Server-side RevenueCat entitlement mirror (Pro exemption).
--
-- Purpose: analyze-construction's getUserTier() needs to know who is Pro so it
-- can skip the free-tier 5-quote/month cap. RevenueCat is the source of truth;
-- the revenuecat-webhook edge function mirrors entitlement state into this table
-- so the quote hot path only ever does a fast local read (never an external call
-- to RevenueCat).
--
-- Identity: app_user_id in the RevenueCat payload IS the Supabase auth user id,
-- because the app calls Purchases.logIn(user.id) on login. No mapping table.

create table if not exists public.user_subscriptions (
  user_id         uuid        primary key references auth.users (id) on delete cascade,
  entitlement     text        not null default 'premium',
  is_active       boolean     not null default false,
  product_id      text,
  store           text,                              -- APP_STORE / PLAY_STORE
  environment     text,                              -- SANDBOX / PRODUCTION
  expires_at      timestamptz,                       -- entitlement expiry (null = non-expiring)
  last_event_type text,
  last_event_id   text,
  event_ts        timestamptz not null default 'epoch',  -- for out-of-order guard
  updated_at      timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

-- Users may read their own subscription (e.g. to reflect Pro status in the UI).
-- All writes go through the service-role client / the RPC below.
drop policy if exists "Users can read own subscription" on public.user_subscriptions;
create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.user_subscriptions;
create policy "Service role manages subscriptions"
  on public.user_subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Apply a RevenueCat webhook event idempotently and in order. The WHERE clause on
-- the upsert drops stale/out-of-order deliveries (a late EXPIRATION can't clobber
-- a newer RENEWAL), so webhook retries and re-ordering are safe.
create or replace function public.apply_revenuecat_event(
  p_user_id     uuid,
  p_entitlement text,
  p_is_active   boolean,
  p_product_id  text,
  p_store       text,
  p_environment text,
  p_expires_at  timestamptz,
  p_event_type  text,
  p_event_id    text,
  p_event_ts    timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ignore events for a user that doesn't exist locally: RevenueCat test events
  -- and purchases under an anonymous/aliased id carry an app_user_id with no
  -- matching auth.users row. That's not an error (nothing to mirror), so no-op
  -- and let the webhook return 200 — otherwise the FK violation would 500 and
  -- RevenueCat would retry forever.
  if not exists (select 1 from auth.users where id = p_user_id) then
    return;
  end if;

  insert into public.user_subscriptions as us
    (user_id, entitlement, is_active, product_id, store, environment, expires_at,
     last_event_type, last_event_id, event_ts, updated_at)
  values
    (p_user_id, coalesce(p_entitlement, 'premium'), p_is_active, p_product_id, p_store,
     p_environment, p_expires_at, p_event_type, p_event_id, coalesce(p_event_ts, now()), now())
  on conflict (user_id) do update set
    entitlement     = excluded.entitlement,
    is_active       = excluded.is_active,
    product_id      = excluded.product_id,
    store           = excluded.store,
    environment     = excluded.environment,
    expires_at      = excluded.expires_at,
    last_event_type = excluded.last_event_type,
    last_event_id   = excluded.last_event_id,
    event_ts        = excluded.event_ts,
    updated_at      = now()
  where excluded.event_ts >= us.event_ts;  -- ignore stale / out-of-order events
end;
$$;
