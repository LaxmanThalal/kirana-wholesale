import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  type OrderStatus as OrderStatusType,
  type PaymentMethod as PaymentMethodType,
  type PaymentStatus as PaymentStatusType,
} from '../types/enums.js';

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IOrder {
  orderNumber: string;
  store: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  orderStatus: OrderStatusType;
  fonepayPrn?: string;
  notes?: string;
}

export interface IOrderDocument extends IOrder, Document {}

export interface IOrderModel extends Model<IOrderDocument> {}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    items: { type: [orderItemSchema], required: true, validate: [(v: IOrderItem[]) => v.length > 0, 'Order must have at least one item'] },
    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    fonepayPrn: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });

export const Order = mongoose.model<IOrderDocument, IOrderModel>('Order', orderSchema);
