import { Router } from 'express';
import { checkoutOrder } from '../controllers/order.controller.js';

const router = Router();

router.post('/checkout', checkoutOrder);

export default router;
