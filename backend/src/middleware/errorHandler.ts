import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  console.error(`[${statusCode}] ${message}`);

  res.status(statusCode).json({
    error: message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
}
