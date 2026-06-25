import crypto from 'crypto';
import type {
  FonepayQrRequest,
  FonepayQrResponse,
  FonepayWebhookCallback,
  PaymentService,
} from './fonepay.types.js';

const MOCK_WEBHOOK_DELAY_MS = 2000;

export class MockFonepayAdapter implements PaymentService {
  private readonly callbacks = new Map<string, FonepayWebhookCallback>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  async generateDynamicQr(request: FonepayQrRequest): Promise<FonepayQrResponse> {
    const qrData = [
      '000201',
      '010212',
      '2634',
      `0016fonepay.com.merchant${request.prn.slice(0, 8)}`,
      `52040000530352454${String(Math.round(request.amount * 100)).padStart(10, '0')}`,
      '5802NP',
      '5913Kirana Wholesale',
      '6009Kathmandu',
      `6210${request.prn}`,
      '6304MOCK',
    ].join('');

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║       MOCK FONEPAY — QR GENERATED        ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  PRN    : ${request.prn.padEnd(28)} ║`);
    console.log(`║  Amount : NPR ${String(request.amount).padEnd(23)} ║`);
    console.log(`║  Webhook: fires in ${MOCK_WEBHOOK_DELAY_MS / 1000}s`.padEnd(43) + '║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    this.scheduleMockWebhook(request.prn, request.amount);

    return {
      qrData,
      prn: request.prn,
      amount: request.amount,
      provider: 'mock',
    };
  }

  onPaymentComplete(prn: string, callback: FonepayWebhookCallback): void {
    this.callbacks.set(prn, callback);
  }

  private scheduleMockWebhook(prn: string, amount: number): void {
    const existing = this.timers.get(prn);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      const callback = this.callbacks.get(prn);
      if (!callback) {
        return;
      }

      const payload = {
        prn,
        amount,
        status: 'success' as const,
        transactionId: `MOCK-FP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        paidAt: new Date(),
      };

      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║     MOCK FONEPAY — PAYMENT SUCCESS       ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  PRN    : ${prn.padEnd(28)} ║`);
      console.log(`║  Txn ID : ${payload.transactionId.padEnd(28)} ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');

      callback(payload);
      this.callbacks.delete(prn);
      this.timers.delete(prn);
    }, MOCK_WEBHOOK_DELAY_MS);

    this.timers.set(prn, timer);
  }
}
