import { Router } from 'express';
import { getHealth, getRoot } from '../controllers/health.controller.js';

const router = Router();

router.get('/', getRoot);
router.get('/health', getHealth);

export default router;
