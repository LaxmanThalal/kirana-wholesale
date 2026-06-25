import { Router, type Request, type Response } from 'express';
import { Product } from '../models/Product.js';

const router = Router();

router.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isActive: true }).lean();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
