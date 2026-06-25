import { Router, type Request, type Response } from 'express';
import { Store } from '../models/Store.js';

const router = Router();

router.get('/api/stores', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ isActive: true }).lean();
    res.status(200).json({ success: true, data: stores });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
