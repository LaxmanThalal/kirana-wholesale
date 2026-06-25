export const ProductUnit = {
  PIECE: 'piece',
  KG: 'kg',
  LITER: 'liter',
  CARTON: 'carton',
  DOZEN: 'dozen',
} as const;

export type ProductUnit = (typeof ProductUnit)[keyof typeof ProductUnit];

export const PaymentMethod = {
  CASH: 'cash',
  FONEPAY: 'fonepay',
  UDHARO: 'udharo',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const LedgerEntryType = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;

export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

export const LedgerReferenceType = {
  ORDER: 'order',
  PAYMENT: 'payment',
  ADJUSTMENT: 'adjustment',
  CREDIT_LIMIT: 'credit_limit',
} as const;

export type LedgerReferenceType =
  (typeof LedgerReferenceType)[keyof typeof LedgerReferenceType];
