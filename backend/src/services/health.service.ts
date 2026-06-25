import { getDatabaseStatus } from '../config/database.js';
import { env } from '../config/env.js';

export interface HealthStatus {
  service: string;
  status: 'ok';
  environment: string;
  database: 'connected' | 'disconnected' | 'connecting';
  timestamp: string;
}

export function getHealthStatus(): HealthStatus {
  return {
    service: 'Kirana Wholesale Backend',
    status: 'ok',
    environment: env.nodeEnv,
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  };
}
