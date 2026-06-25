import { Router } from 'express';
import healthRoutes from './health.routes.js';
import orderRoutes from './order.routes.js';
import seedRoutes from './seed.routes.js';
import authRoutes from '../controllers/auth.controller.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/auth', authRoutes);
router.use('/', seedRoutes);

export default router;
