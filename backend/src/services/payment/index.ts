import { env } from '../../config/env.js';
import { FonepayAdapter } from './fonepay.adapter.js';
import { MockFonepayAdapter } from './mockFonepay.adapter.js';
import type { PaymentService } from './fonepay.types.js';

function hasFonepayCredentials(): boolean {
  return (
    env.fonepayMerchantCode !== undefined &&
    env.fonepayMerchantSecret !== undefined &&
    env.fonepayUsername !== undefined &&
    env.fonepayPassword !== undefined
  );
}

function createPaymentService(): PaymentService {
  if (env.nodeEnv === 'production' && hasFonepayCredentials()) {
    return new FonepayAdapter({
      merchantCode: env.fonepayMerchantCode!,
      merchantSecret: env.fonepayMerchantSecret!,
      username: env.fonepayUsername!,
      password: env.fonepayPassword!,
      dynamicQrUrl: env.fonepayDynamicQrUrl,
    });
  }

  if (env.nodeEnv === 'production') {
    console.warn(
      '⚠️  Fonepay credentials missing in production — falling back to mock payment service'
    );
  }

  return new MockFonepayAdapter();
}

export const paymentService: PaymentService = createPaymentService();

export { FonepayAdapter } from './fonepay.adapter.js';
export { MockFonepayAdapter } from './mockFonepay.adapter.js';
export type {
  FonepayQrRequest,
  FonepayQrResponse,
  FonepayWebhookPayload,
  PaymentService,
} from './fonepay.types.js';
