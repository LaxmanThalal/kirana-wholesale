import type { PaymentMethod } from '../types/enums.js';

export interface CheckoutItemPayload {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  storeId: string;
  items: CheckoutItemPayload[];
  paymentMethod: PaymentMethod;
  notes?: string;
  fonepayPrn?: string;
}

export interface OrderProcessingJobData {
  orderNumber: string;
  checkout: CheckoutPayload;
}

export interface CheckoutAcceptedResponse {
  message: string;
  jobId: string;
  orderNumber: string;
  status: 'queued';
}

export interface OrderProcessingResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  ledgerEntryId?: string;
}
