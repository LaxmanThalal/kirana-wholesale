import { Queue } from 'bullmq';
import { createRedisConnection, ORDER_PROCESSING_QUEUE } from '../config/redis.js';
import type { OrderProcessingJobData } from '../types/checkout.types.js';

let orderQueue: Queue<OrderProcessingJobData> | null = null;

export function getOrderProcessingQueue(): Queue<OrderProcessingJobData> {
  if (!orderQueue) {
    orderQueue = new Queue<OrderProcessingJobData>(ORDER_PROCESSING_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  return orderQueue;
}

export async function enqueueOrderJob(
  data: OrderProcessingJobData
): Promise<string> {
  const queue = getOrderProcessingQueue();
  const job = await queue.add('process-order', data, {
    jobId: data.orderNumber,
  });
  return job.id ?? data.orderNumber;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
