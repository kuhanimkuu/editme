// payments-worker: sends queued refunds (declined / cancelled / disputed
// projects) and editor withdrawals through the payment provider, then
// records how each went. Run it on a schedule (e.g. every 5 minutes with
// pg_cron + pg_net, or any cron service):
//
//   POST /functions/v1/payments-worker
//   Authorization: Bearer <CRON_SECRET>
//
// Only the holder of CRON_SECRET (a function secret) can run it. The gateway
// lets it through without a sign-in (verify_jwt = false in config.toml), so
// this secret check is what protects it.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { handlePost, HttpError, json, sameSecret } from '../_shared/http.ts';
import { adminClient } from '../_shared/supabase.ts';
import { getPaymentProvider, type ProviderOutcome } from '../_shared/payments.ts';

const BATCH = 25;

Deno.serve(handlePost(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  const given = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!secret || !given || !sameSecret(given, secret)) throw new HttpError(401, 'Not allowed');

  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(501, 'Payments are not set up yet');

  const admin = adminClient();
  const { data: pending, error } = await admin
    .from('wallet_transactions')
    .select('id, type, user_id, project_id, amount_cents')
    .eq('status', 'pending')
    .in('type', ['refund', 'withdrawal'])
    .order('created_at')
    .limit(BATCH);
  if (error) throw error;

  let sent = 0;
  let failed = 0;
  for (const txn of pending ?? []) {
    let outcome: ProviderOutcome;
    try {
      if (txn.type === 'refund') {
        const { data: project } = await admin
          .from('projects').select('payment_ref').eq('id', txn.project_id).maybeSingle();
        if (!project?.payment_ref) {
          outcome = { ok: false, reason: 'No payment reference to refund' };
        } else {
          outcome = await provider.refund({
            txnId: txn.id, paymentRef: project.payment_ref, amountCents: txn.amount_cents,
          });
        }
      } else {
        outcome = await provider.payout({
          txnId: txn.id, userId: txn.user_id, amountCents: txn.amount_cents,
        });
      }
    } catch (e) {
      // Left pending: tried again on the next run.
      console.error(`Provider call for ${txn.id} failed:`, e instanceof Error ? e.message : e);
      continue;
    }

    const { error: settleError } = await admin.rpc('settle_transaction', {
      p_txn_id: txn.id,
      p_ok: outcome.ok,
      p_provider_ref: outcome.ok ? outcome.providerRef : null,
    });
    if (settleError) {
      console.error(`settle_transaction ${txn.id}:`, settleError.message);
      continue;
    }
    if (outcome.ok) sent++;
    else {
      failed++;
      console.warn(`${txn.type} ${txn.id} failed: ${outcome.reason}`);
    }
  }
  return json({ checked: pending?.length ?? 0, sent, failed });
}));
