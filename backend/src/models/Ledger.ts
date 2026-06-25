import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import {
  LedgerEntryType,
  LedgerReferenceType,
  type LedgerEntryType as LedgerEntryTypeValue,
  type LedgerReferenceType as LedgerReferenceTypeValue,
} from '../types/enums.js';

export interface ILedger {
  store: Types.ObjectId;
  entryType: LedgerEntryTypeValue;
  amount: number;
  balanceAfter: number;
  referenceType: LedgerReferenceTypeValue;
  referenceId?: Types.ObjectId;
  description: string;
  createdBy?: string;
}

export interface ILedgerDocument extends ILedger, Document {}

export interface ILedgerModel extends Model<ILedgerDocument> {}

const ledgerSchema = new Schema<ILedgerDocument>(
  {
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    entryType: {
      type: String,
      enum: Object.values(LedgerEntryType),
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    balanceAfter: { type: Number, required: true, min: 0 },
    referenceType: {
      type: String,
      enum: Object.values(LedgerReferenceType),
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId },
    description: { type: String, required: true, trim: true },
    createdBy: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerSchema.index({ store: 1, createdAt: -1 });
ledgerSchema.index({ referenceType: 1, referenceId: 1 });

export const Ledger = mongoose.model<ILedgerDocument, ILedgerModel>('Ledger', ledgerSchema);
