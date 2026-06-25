import type { Request, Response, NextFunction } from 'express';
import { enqueueOrderJob, generateOrderNumber } from '../queues/orderProcessing.queue.js';
import type { CheckoutPayload } from '../types/checkout.types.js';
import { PaymentMethod } from '../types/enums.js';
import type { AppError } from '../middleware/errorHandler.js';

function isValidPaymentMethod(value: string): value is CheckoutPayload['paymentMethod'] {
  return Object.values(PaymentMethod).includes(value as CheckoutPayload['paymentMethod']);
}

function validateCheckoutPayload(body: unknown): CheckoutPayload {
  if (!body || typeof body !== 'object') {
    const error = new Error('Request body is required') as AppError;
    error.statusCode = 400;
    throw error;
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.storeId !== 'string' || payload.storeId.trim() === '') {
    const error = new Error('storeId is required') as AppError;
    error.statusCode = 400;
    throw error;
  }

  if (typeof payload.paymentMethod !== 'string' || !isValidPaymentMethod(payload.paymentMethod)) {
    const error = new Error(
      `paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`
    ) as AppError;
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    const error = new Error('items must be a non-empty array') as AppError;
    error.statusCode = 400;
    throw error;
  }

  const items = payload.items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      const error = new Error(`items[${index}] must be an object`) as AppError;
      error.statusCode = 400;
      throw error;
    }

    const row = item as Record<string, unknown>;

    if (typeof row.productId !== 'string' || row.productId.trim() === '') {
      const error = new Error(`items[${index}].productId is required`) as AppError;
      error.statusCode = 400;
      throw error;
    }

    if (typeof row.quantity !== 'number' || !Number.isInteger(row.quantity) || row.quantity < 1) {
      const error = new Error(`items[${index}].quantity must be a positive integer`) as AppError;
      error.statusCode = 400;
      throw error;
    }

    return {
      productId: row.productId.trim(),
      quantity: row.quantity,
    };
  });

  const checkout: CheckoutPayload = {
    storeId: payload.storeId.trim(),
    items,
    paymentMethod: payload.paymentMethod,
  };

  if (typeof payload.notes === 'string' && payload.notes.trim() !== '') {
    checkout.notes = payload.notes.trim();
  }

  if (typeof payload.fonepayPrn === 'string' && payload.fonepayPrn.trim() !== '') {
    checkout.fonepayPrn = payload.fonepayPrn.trim();
  }

  return checkout;
}

export async function checkoutOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const checkout = validateCheckoutPayload(req.body);
    const orderNumber = generateOrderNumber();
    const jobId = await enqueueOrderJob({ orderNumber, checkout });

    res.status(202).json({
      message: 'Order queued for processing',
      jobId,
      orderNumber,
      status: 'queued',
    });
  } catch (error) {
    next(error);
  }
}
