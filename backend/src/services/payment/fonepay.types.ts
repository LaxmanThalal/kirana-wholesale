export interface FonepayQrRequest {
  amount: number;
  prn: string;
  remarks1?: string;
  remarks2?: string;
}

export interface FonepayQrResponse {
  qrData: string;
  prn: string;
  amount: number;
  provider: 'fonepay' | 'mock';
}

export type FonepayPaymentStatus = 'success' | 'failed' | 'pending';

export interface FonepayWebhookPayload {
  prn: string;
  amount: number;
  status: FonepayPaymentStatus;
  transactionId: string;
  paidAt?: Date;
}

export type FonepayWebhookCallback = (payload: FonepayWebhookPayload) => void;

export interface PaymentService {
  generateDynamicQr(request: FonepayQrRequest): Promise<FonepayQrResponse>;
  onPaymentComplete(prn: string, callback: FonepayWebhookCallback): void;
}

export interface FonepayConfig {
  merchantCode: string;
  merchantSecret: string;
  username: string;
  password: string;
  dynamicQrUrl: string;
}
