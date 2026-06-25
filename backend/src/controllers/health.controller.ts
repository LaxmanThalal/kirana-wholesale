import type { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service.js';

export function getHealth(_req: Request, res: Response): void {
  res.json(getHealthStatus());
}

export function getRoot(_req: Request, res: Response): void {
  res.send('Kirana Wholesale Backend Server Running');
}
