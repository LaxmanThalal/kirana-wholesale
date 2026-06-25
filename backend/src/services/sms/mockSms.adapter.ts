import type { SmsSendResult, SmsService } from './sms.types.js';

export class MockSmsAdapter implements SmsService {
  generateOtp(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         MOCK SMS — OTP DELIVERY          ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Phone : ${phone.padEnd(28)} ║`);
    console.log(`║  OTP   : ${otp.padEnd(28)} ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    return {
      success: true,
      provider: 'mock',
      messageId: `mock-${Date.now()}`,
    };
  }
}
