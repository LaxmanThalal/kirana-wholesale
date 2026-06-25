import { env } from '../../config/env.js';
import { MockSmsAdapter } from './mockSms.adapter.js';
import { SparrowSmsAdapter } from './sparrowSms.adapter.js';
import type { SmsService } from './sms.types.js';

function createSmsService(): SmsService {
  const useSparrow =
    env.nodeEnv === 'production' && env.sparrowToken !== undefined && env.sparrowFrom !== undefined;

  if (useSparrow) {
    return new SparrowSmsAdapter({
      token: env.sparrowToken!,
      from: env.sparrowFrom!,
    });
  }

  if (env.nodeEnv === 'production') {
    console.warn(
      '⚠️  SPARROW_TOKEN or SPARROW_FROM missing in production — falling back to mock SMS'
    );
  }

  return new MockSmsAdapter();
}

export const smsService: SmsService = createSmsService();

export { MockSmsAdapter } from './mockSms.adapter.js';
export { SparrowSmsAdapter } from './sparrowSms.adapter.js';
export type { SmsSendResult, SmsService } from './sms.types.js';
