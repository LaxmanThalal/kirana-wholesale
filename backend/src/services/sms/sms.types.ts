export interface SmsSendResult {
  success: boolean;
  provider: 'sparrow' | 'mock';
  messageId?: string;
  responseCode?: number;
  error?: string;
}

export interface SmsService {
  generateOtp(): string;
  sendOtp(phone: string, otp: string): Promise<SmsSendResult>;
}
