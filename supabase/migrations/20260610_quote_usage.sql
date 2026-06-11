-- Server-side per-user quote usage tracking (T2).
-- Enforces the free-tier monthly quota in the analyze-construction edge function,
-- replacing the previous client-only (bypassable) AsyncStorage gate.

create table if not exists public.quote_usage (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  period     text        not null,            -- 'YYYY-MM' (UTC month)
  count      int         not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

alter table public.quote_usage enable row level security;

-- Users may read their own usage (e.g. to show "3 of 5 used"). All writes go
-- through the edge function's service-role client / the RPC below.
drop policy if exists "Users can read own usage" on public.quote_usage;
create policy "Users can read own usage"
  on public.quote_usage for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages usage" on public.quote_usage;
create policy "Service role manages usage"
  on public.quote_usage for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Atomic increment: upsert the row and bump the counter in a single statement so
-- concurrent quote requests can't race past the limit. Returns the new count.
create or replace function public.increment_quote_usage(p_user_id uuid, p_period text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.quote_usage (user_id, period, count)
    values (p_user_id, p_period, 1)
  on conflict (user_id, period)
    do update set count = quote_usage.count + 1, updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;
