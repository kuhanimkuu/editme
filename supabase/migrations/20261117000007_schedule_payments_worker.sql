-- ============================================================================
-- EditMe 7: run payments-worker every 5 minutes, only when there's work
--
-- The worker sends queued refunds and withdrawals. Every 5 minutes the
-- database checks for pending ones and, only if there are some, calls the
-- function with CRON_SECRET. Both values come from Vault (set once per
-- project, never in a migration or in git):
--
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as the CRON_SECRET function secret>', 'cron_secret');
--
-- Without them (e.g. on a local stack) the job does nothing.
-- ============================================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.run_payments_worker()
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.wallet_transactions
                  where status = 'pending' and type in ('refund', 'withdrawal')) then
    return;
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_secret is null then
    raise warning 'payments-worker not scheduled: project_url / cron_secret missing from Vault';
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/payments-worker',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret,
                                  'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
end;
$$;

-- Only the scheduler (running as postgres) may run it.
revoke all on function public.run_payments_worker() from public, anon, authenticated;

-- The "anything pending?" check uses wallet_transactions_pending_idx (migration 2).

select cron.schedule('payments-worker', '*/5 * * * *', $$select public.run_payments_worker()$$);
