import axios from 'axios';
import crypto from 'crypto';
import type {
  FonepayConfig,
  FonepayQrRequest,
  FonepayQrResponse,
  FonepayWebhookCallback,
  PaymentService,
} from './fonepay.types.js';

interface FonepayApiResponse {
  qrData?: string;
  qrMessage?: string;
  responseCode?: string;
  responseMessage?: string;
}

export class FonepayAdapter implements PaymentService {
  private readonly callbacks = new Map<string, FonepayWebhookCallback>();

  constructor(private readonly config: FonepayConfig) {}

  async generateDynamicQr(request: FonepayQrRequest): Promise<FonepayQrResponse> {
    const remarks1 = request.remarks1 ?? 'Kirana Wholesale';
    const remarks2 = request.remarks2 ?? request.prn;

    const dataToHash = `${request.amount},${request.prn},${this.config.merchantCode},${remarks1},${remarks2}`;
    const dataValidation = crypto
      .createHmac('sha512', this.config.merchantSecret)
      .update(dataToHash)
      .digest('hex');

    const payload = {
      amount: request.amount,
      remarks1,
      remarks2,
      prn: request.prn,
      merchantCode: this.config.merchantCode,
      dataValidation,
      username: this.config.username,
      password: this.config.password,
    };

    const url = `${this.config.dynamicQrUrl}/thirdPartyDynamicQrDownload`;

    const response = await axios.post<FonepayApiResponse>(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });

    const qrData = response.data.qrData ?? response.data.qrMessage;
    if (!qrData) {
      throw new Error(
        response.data.responseMessage ?? 'Fonepay did not return QR data'
      );
    }

    return {
      qrData,
      prn: request.prn,
      amount: request.amount,
      provider: 'fonepay',
    };
  }

  onPaymentComplete(prn: string, callback: FonepayWebhookCallback): void {
    this.callbacks.set(prn, callback);
  }

  handleWebhook(payload: Parameters<FonepayWebhookCallback>[0]): void {
    const callback = this.callbacks.get(payload.prn);
    if (callback) {
      callback(payload);
      this.callbacks.delete(payload.prn);
    }
  }
}
