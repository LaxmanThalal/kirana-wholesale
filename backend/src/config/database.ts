import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ MongoDB connection error:', message);
    process.exit(1);
  }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' {
  const state = mongoose.connection.readyState;
  if (state === 1) return 'connected';
  if (state === 2) return 'connecting';
  return 'disconnected';
}
