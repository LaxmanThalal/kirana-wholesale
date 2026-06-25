import axios from 'axios';
import type { SmsSendResult, SmsService } from './sms.types.js';

const SPARROW_SMS_URL = 'http://api.sparrowsms.com/v2/sms/';

export interface SparrowSmsConfig {
  token: string;
  from: string;
}

interface SparrowSmsResponse {
  count?: number;
  response_code?: number;
  response?: string;
}

export class SparrowSmsAdapter implements SmsService {
  constructor(private readonly config: SparrowSmsConfig) {}

  generateOtp(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    const text = `Your Kirana Wholesale OTP is ${otp}. Valid for 5 minutes.`;

    try {
      const params = new URLSearchParams({
        token: this.config.token,
        from: this.config.from,
        to: phone,
        text,
      });

      const response = await axios.post<SparrowSmsResponse>(
        SPARROW_SMS_URL,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10_000,
        }
      );

      return {
        success: response.data.response_code === 200,
        provider: 'sparrow',
        responseCode: response.data.response_code,
        messageId: response.data.count !== undefined ? String(response.data.count) : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Sparrow SMS error';
      return {
        success: false,
        provider: 'sparrow',
        error: message,
      };
    }
  }
}
