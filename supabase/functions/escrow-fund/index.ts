// escrow-fund: the client pays for a project they created (create_project);
// the money is held in escrow until they approve the delivery.
//
// POST { projectId }
//   -> { status: 'secured' }                       paid (test mode)
//   -> { status: 'redirect', checkoutUrl }          finish on the provider's page
//
// The amount always comes from the project row, never from the browser.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { handlePost, HttpError, json, readJson, requireUuid } from '../_shared/http.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { getPaymentProvider } from '../_shared/payments.ts';

Deno.serve(handlePost(async (req) => {
  const user = await requireUser(req);
  const { projectId: raw } = await readJson<{ projectId?: unknown }>(req);
  const projectId = requireUuid(raw, 'projectId');

  const admin = adminClient();
  const { data: project, error } = await admin
    .from('projects')
    .select('id, client_id, status, title, price_cents, currency')
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  // Someone else's project looks the same as a missing one.
  if (!project || project.client_id !== user.id) throw new HttpError(404, 'Project not found');
  if (project.status !== 'awaiting_payment') {
    throw new HttpError(409, 'This project is already paid for or closed');
  }

  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(501, 'Payments are not set up yet');

  const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';
  const result = await provider.createEscrowPayment({
    projectId: project.id,
    amountCents: project.price_cents,
    currency: project.currency,
    description: `EditMe escrow: ${project.title}`,
    customerEmail: user.email,
    returnUrl: `${appUrl}/projects?paid=${project.id}`,
  });

  if (result.status === 'paid') {
    const { error: fundError } = await admin.rpc('mark_escrow_funded', {
      p_project_id: project.id,
      p_payment_ref: result.paymentRef,
    });
    if (fundError) throw fundError;
    return json({ status: 'secured' });
  }
  return json({ status: 'redirect', checkoutUrl: result.checkoutUrl });
}));
