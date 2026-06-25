import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IStoreAddress {
  street?: string;
  ward?: number;
  municipality: string;
  district: string;
}

export interface IStore {
  name: string;
  ownerName: string;
  phone: string;
  address: IStoreAddress;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
}

export interface IStoreDocument extends IStore, Document {
  availableCredit: number;
  canPurchaseOnCredit(amount: number): boolean;
}

export interface IStoreModel extends Model<IStoreDocument> {}

const storeAddressSchema = new Schema<IStoreAddress>(
  {
    street: { type: String, trim: true },
    ward: { type: Number, min: 1, max: 35 },
    municipality: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true, default: 'Kathmandu' },
  },
  { _id: false }
);

const storeSchema = new Schema<IStoreDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^9[678]\d{8}$/,
    },
    address: { type: storeAddressSchema, required: true },
    creditLimit: { type: Number, required: true, min: 0, default: 0 },
    outstandingBalance: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

storeSchema.virtual('availableCredit').get(function (this: IStoreDocument) {
  return Math.max(0, this.creditLimit - this.outstandingBalance);
});

storeSchema.methods.canPurchaseOnCredit = function (
  this: IStoreDocument,
  amount: number
): boolean {
  return this.isActive && this.availableCredit >= amount;
};

storeSchema.index({ name: 'text', ownerName: 'text' });

export const Store = mongoose.model<IStoreDocument, IStoreModel>('Store', storeSchema);
