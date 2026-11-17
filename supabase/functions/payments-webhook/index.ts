// payments-webhook: the payment provider tells EditMe a checkout was paid.
// Called by the provider, not a person (verify_jwt = false in config.toml),
// so the provider's signature is the only proof: parseWebhook checks it.
// Recording the same payment twice does nothing, so provider retries are safe.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { json } from '../_shared/http.ts';
import { adminClient } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const provider = getPaymentProvider();
  if (!provider || provider.name === 'test') {
    return json({ error: 'No payment provider webhooks configured' }, 501);
  }

  let paid: { projectId: string; paymentRef: string } | null;
  try {
    paid = await provider.parseWebhook(req);
  } catch (e) {
    console.warn('Rejected webhook:', e instanceof Error ? e.message : e);
    return json({ error: 'Invalid signature' }, 400);
  }
  if (!paid) return json({ received: true }); // an event we don't act on

  const { error } = await adminClient().rpc('mark_escrow_funded', {
    p_project_id: paid.projectId,
    p_payment_ref: paid.paymentRef,
  });
  if (error) {
    console.error('mark_escrow_funded failed:', error.message);
    // 500 makes the provider retry later.
    return json({ error: 'Could not record the payment' }, 500);
  }
  return json({ received: true });
});
