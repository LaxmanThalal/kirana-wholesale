import { ProductInfo } from '../hooks/useCart';

export interface StoreInfo {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  isActive: boolean;
}

export const MOCK_STORES: StoreInfo[] = [
  {
    _id: '667ab8e92f1a3e001f543201',
    name: 'Boudha Kirana Pasal',
    ownerName: 'Tenzing Sherpa',
    phone: '9801234567',
    creditLimit: 100000,
    outstandingBalance: 15000,
    availableCredit: 85000,
    isActive: true,
  },
  {
    _id: '667ab8e92f1a3e001f543202',
    name: 'Kalimati Grocery Store',
    ownerName: 'Ram Bahadur',
    phone: '9841567890',
    creditLimit: 50000,
    outstandingBalance: 42000,
    availableCredit: 8000,
    isActive: true,
  },
  {
    _id: '667ab8e92f1a3e001f543203',
    name: 'Patan Food Mart',
    ownerName: 'Sita Shrestha',
    phone: '9818765432',
    creditLimit: 200000,
    outstandingBalance: 0,
    availableCredit: 200000,
    isActive: true,
  },
];

export const MOCK_PRODUCTS: ProductInfo[] = [
  {
    _id: '667ab9cd2f1a3e001f543301',
    sku: 'WAIWAI-75G',
    name: 'Wai Wai Noodles (75g)',
    category: 'Noodles',
    unit: 'PIECE',
    wholesalePrice: 20,
    stockQuantity: 500,
  },
  {
    _id: '667ab9cd2f1a3e001f543302',
    sku: 'DDC-GHEE-1L',
    name: 'DDC Pure Ghee (1L)',
    category: 'Dairy',
    unit: 'PIECE',
    wholesalePrice: 1200,
    stockQuantity: 80,
  },
  {
    _id: '667ab9cd2f1a3e001f543303',
    sku: 'RICE-BASMATI-25K',
    name: 'Basmati Rice (25kg)',
    category: 'Grains',
    unit: 'BAG',
    wholesalePrice: 2450,
    stockQuantity: 40,
  },
  {
    _id: '667ab9cd2f1a3e001f543304',
    sku: 'TOKLA-TEA-500G',
    name: 'Tokla Tea (500g)',
    category: 'Beverages',
    unit: 'PIECE',
    wholesalePrice: 380,
    stockQuantity: 120,
  },
  {
    _id: '667ab9cd2f1a3e001f543305',
    sku: 'SUGAR-50KG',
    name: 'Sugar (50kg)',
    category: 'Essentials',
    unit: 'BAG',
    wholesalePrice: 4800,
    stockQuantity: 15,
  },
];
