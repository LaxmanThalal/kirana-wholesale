import { Router, type Request, type Response } from 'express';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { Ledger } from '../models/Ledger.js';
import { Order } from '../models/Order.js';

const router = Router();

const SAMPLE_STORES = [
  {
    _id: '667ab8e92f1a3e001f543201',
    name: 'Boudha Kirana Pasal',
    ownerName: 'Tenzing Sherpa',
    phone: '9801234567',
    address: {
      street: 'Boudha Road',
      ward: 6,
      municipality: 'Kathmandu MC',
      district: 'Kathmandu',
    },
    creditLimit: 100000,
    outstandingBalance: 15000,
    isActive: true,
  },
  {
    _id: '667ab8e92f1a3e001f543202',
    name: 'Kalimati Grocery Store',
    ownerName: 'Ram Bahadur',
    phone: '9841567890',
    address: {
      street: 'Kalimati Bazar',
      ward: 13,
      municipality: 'Kathmandu MC',
      district: 'Kathmandu',
    },
    creditLimit: 50000,
    outstandingBalance: 42000,
    isActive: true,
  },
  {
    _id: '667ab8e92f1a3e001f543203',
    name: 'Patan Food Mart',
    ownerName: 'Sita Shrestha',
    phone: '9818765432',
    address: {
      street: 'Mangal Bazar',
      ward: 12,
      municipality: 'Lalitpur MC',
      district: 'Lalitpur',
    },
    creditLimit: 200000,
    outstandingBalance: 0,
    isActive: true,
  },
];

const SAMPLE_PRODUCTS = [
  {
    _id: '667ab9cd2f1a3e001f543301',
    sku: 'WAIWAI-75G',
    name: 'Wai Wai Noodles (75g)',
    category: 'Noodles',
    unit: 'piece',
    wholesalePrice: 20,
    stockQuantity: 500,
    minStockLevel: 50,
    isActive: true,
  },
  {
    _id: '667ab9cd2f1a3e001f543302',
    sku: 'DDC-GHEE-1L',
    name: 'DDC Pure Ghee (1L)',
    category: 'Dairy',
    unit: 'liter',
    wholesalePrice: 1200,
    stockQuantity: 80,
    minStockLevel: 10,
    isActive: true,
  },
  {
    _id: '667ab9cd2f1a3e001f543303',
    sku: 'RICE-BASMATI-25K',
    name: 'Basmati Rice (25kg)',
    category: 'Grains',
    unit: 'kg',
    wholesalePrice: 2450,
    stockQuantity: 40,
    minStockLevel: 5,
    isActive: true,
  },
  {
    _id: '667ab9cd2f1a3e001f543304',
    sku: 'TOKLA-TEA-500G',
    name: 'Tokla Tea (500g)',
    category: 'Beverages',
    unit: 'piece',
    wholesalePrice: 380,
    stockQuantity: 120,
    minStockLevel: 15,
    isActive: true,
  },
  {
    _id: '667ab9cd2f1a3e001f543305',
    sku: 'SUGAR-50KG',
    name: 'Sugar (50kg)',
    category: 'Essentials',
    unit: 'kg',
    wholesalePrice: 4800,
    stockQuantity: 15,
    minStockLevel: 3,
    isActive: true,
  },
];

router.post('/api/seed', async (req: Request, res: Response) => {
  try {
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Ledger.deleteMany({});
    await Order.deleteMany({});

    await Store.insertMany(SAMPLE_STORES);
    await Product.insertMany(SAMPLE_PRODUCTS);

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully with sample Kirana stores and products!',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
