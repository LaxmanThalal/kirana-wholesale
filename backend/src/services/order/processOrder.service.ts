import mongoose, { Types } from 'mongoose';
import { Ledger } from '../../models/Ledger.js';
import { Order, type IOrderItem } from '../../models/Order.js';
import { Product } from '../../models/Product.js';
import { Store } from '../../models/Store.js';
import type { CheckoutPayload, OrderProcessingResult } from '../../types/checkout.types.js';
import {
  LedgerEntryType,
  LedgerReferenceType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../types/enums.js';

export class OrderProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: 'STORE_NOT_FOUND' | 'STORE_INACTIVE' | 'INSUFFICIENT_STOCK' | 'INSUFFICIENT_CREDIT' | 'INVALID_PRODUCT'
  ) {
    super(message);
    this.name = 'OrderProcessingError';
  }
}

export async function processOrderCheckout(
  orderNumber: string,
  checkout: CheckoutPayload
): Promise<OrderProcessingResult> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const store = await Store.findById(checkout.storeId).session(session);
    if (!store) {
      throw new OrderProcessingError('Store not found', 'STORE_NOT_FOUND');
    }
    if (!store.isActive) {
      throw new OrderProcessingError('Store is inactive', 'STORE_INACTIVE');
    }

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of checkout.items) {
      if (!Types.ObjectId.isValid(item.productId)) {
        throw new OrderProcessingError(
          `Invalid product ID: ${item.productId}`,
          'INVALID_PRODUCT'
        );
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          isActive: true,
          stockQuantity: { $gte: item.quantity },
        },
        { $inc: { stockQuantity: -item.quantity } },
        { session, new: true }
      );

      if (!product) {
        throw new OrderProcessingError(
          `Insufficient stock for product ${item.productId}`,
          'INSUFFICIENT_STOCK'
        );
      }

      const lineTotal = product.wholesalePrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.wholesalePrice,
        lineTotal,
      });
    }

    const totalAmount = subtotal;
    let ledgerEntryId: string | undefined;

    if (checkout.paymentMethod === PaymentMethod.UDHARO) {
      const availableCredit = store.creditLimit - store.outstandingBalance;
      if (availableCredit < totalAmount) {
        throw new OrderProcessingError(
          `Insufficient credit. Available: NPR ${availableCredit}, Required: NPR ${totalAmount}`,
          'INSUFFICIENT_CREDIT'
        );
      }

      store.outstandingBalance += totalAmount;
      await store.save({ session });
    }

    const paymentStatus =
      checkout.paymentMethod === PaymentMethod.CASH ||
      checkout.paymentMethod === PaymentMethod.FONEPAY
        ? PaymentStatus.PENDING
        : PaymentStatus.PENDING;

    const [order] = await Order.create(
      [
        {
          orderNumber,
          store: store._id,
          items: orderItems,
          subtotal,
          totalAmount,
          paymentMethod: checkout.paymentMethod,
          paymentStatus,
          orderStatus: OrderStatus.CONFIRMED,
          fonepayPrn: checkout.fonepayPrn,
          notes: checkout.notes,
        },
      ],
      { session }
    );

    if (checkout.paymentMethod === PaymentMethod.UDHARO) {
      const [ledgerEntry] = await Ledger.create(
        [
          {
            store: store._id,
            entryType: LedgerEntryType.DEBIT,
            amount: totalAmount,
            balanceAfter: store.outstandingBalance,
            referenceType: LedgerReferenceType.ORDER,
            referenceId: order._id,
            description: `Udharo debit for order ${orderNumber}`,
          },
        ],
        { session }
      );
      ledgerEntryId = ledgerEntry._id.toString();
    }

    await session.commitTransaction();

    console.log(
      `✅ Order ${orderNumber} processed — NPR ${totalAmount}, ${orderItems.length} item(s), stock updated`
    );

    if (ledgerEntryId) {
      console.log(`   Ledger entry ${ledgerEntryId} recorded (udharo debit)`);
    }

    return {
      orderId: order._id.toString(),
      orderNumber,
      totalAmount,
      paymentMethod: checkout.paymentMethod,
      ledgerEntryId,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
