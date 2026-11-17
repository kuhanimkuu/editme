// The payment provider behind escrow. The provider isn't chosen yet (Stripe,
// M-Pesa...), so this is the one place that will change when it is: write a
// provider that implements PaymentProvider and return it from
// getPaymentProvider().
//
// Until then, PAYMENTS_MODE=test (function secret) turns on a fake provider
// that approves every payment instantly, for local development and staging.
// NEVER set it on the live project: escrow would be "funded" with no money.
// With no provider configured, payment functions answer 501.

export interface EscrowPaymentRequest {
  projectId: string;
  amountCents: number;
  currency: string;
  description: string;
  customerEmail?: string;
  /** Where the provider's checkout page sends the client back to. */
  returnUrl: string;
}

export type EscrowPaymentResult =
  /** Paid already (no checkout page needed). */
  | { status: 'paid'; paymentRef: string }
  /** The client finishes paying on the provider's page; the provider then
   *  calls payments-webhook. */
  | { status: 'redirect'; checkoutUrl: string; paymentRef: string };

export interface PaymentProvider {
  readonly name: string;
  createEscrowPayment(req: EscrowPaymentRequest): Promise<EscrowPaymentResult>;
  /** Checks the request really comes from the provider (signature) and
   *  returns a completed escrow payment, or null for other events. Throws
   *  on a bad signature. */
  parseWebhook(req: Request): Promise<{ projectId: string; paymentRef: string } | null>;
  /** Gives a client's escrow back to them. */
  refund(input: { txnId: string; paymentRef: string; amountCents: number }): Promise<ProviderOutcome>;
  /** Sends an editor's withdrawal to their payout method. */
  payout(input: { txnId: string; userId: string; amountCents: number }): Promise<ProviderOutcome>;
}

export type ProviderOutcome = { ok: true; providerRef: string } | { ok: false; reason: string };

const testProvider: PaymentProvider = {
  name: 'test',
  createEscrowPayment(req) {
    return Promise.resolve({ status: 'paid', paymentRef: `test_pay_${req.projectId}` });
  },
  parseWebhook() {
    return Promise.reject(new Error('The test provider has no webhooks'));
  },
  refund({ txnId }) {
    return Promise.resolve({ ok: true, providerRef: `test_refund_${txnId}` });
  },
  payout({ txnId }) {
    return Promise.resolve({ ok: true, providerRef: `test_payout_${txnId}` });
  },
};

export function getPaymentProvider(): PaymentProvider | null {
  switch (Deno.env.get('PAYMENTS_MODE')) {
    case 'test':
      return testProvider;
    // case 'stripe': return stripeProvider;
    default:
      return null;
  }
}
