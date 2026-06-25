import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { ProductUnit, type ProductUnit as ProductUnitType } from '../types/enums.js';

export interface IProduct {
  sku: string;
  name: string;
  category: string;
  unit: ProductUnitType;
  wholesalePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
}

export interface IProductDocument extends IProduct, Document {
  isLowStock: boolean;
  isInStock(quantity: number): boolean;
}

export interface IProductModel extends Model<IProductDocument> {}

const productSchema = new Schema<IProductDocument>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: {
      type: String,
      enum: Object.values(ProductUnit),
      required: true,
      default: ProductUnit.PIECE,
    },
    wholesalePrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, required: true, min: 0, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('isLowStock').get(function (this: IProductDocument) {
  return this.stockQuantity <= this.minStockLevel;
});

productSchema.methods.isInStock = function (
  this: IProductDocument,
  quantity: number
): boolean {
  return this.isActive && this.stockQuantity >= quantity;
};

productSchema.index({ name: 'text', category: 1 });
productSchema.index({ stockQuantity: 1, minStockLevel: 1 });

export const Product = mongoose.model<IProductDocument, IProductModel>(
  'Product',
  productSchema
);
