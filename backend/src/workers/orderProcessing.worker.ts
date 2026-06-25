import { Worker, type Job } from 'bullmq';
import { connectDatabase } from '../config/database.js';
import { createRedisConnection, ORDER_PROCESSING_QUEUE } from '../config/redis.js';
import {
  OrderProcessingError,
  processOrderCheckout,
} from '../services/order/processOrder.service.js';
import type { OrderProcessingJobData } from '../types/checkout.types.js';

let worker: Worker<OrderProcessingJobData> | null = null;

async function handleOrderJob(job: Job<OrderProcessingJobData>): Promise<void> {
  const { orderNumber, checkout } = job.data;

  console.log(`📦 Processing order ${orderNumber} (job ${job.id})`);

  try {
    const result = await processOrderCheckout(orderNumber, checkout);
    console.log(`   Order ${result.orderNumber} confirmed — NPR ${result.totalAmount}`);
  } catch (error) {
    if (error instanceof OrderProcessingError) {
      console.error(`❌ Order ${orderNumber} failed [${error.code}]: ${error.message}`);
    }
    throw error;
  }
}

export function startOrderProcessingWorker(): Worker<OrderProcessingJobData> {
  if (worker) {
    return worker;
  }

  worker = new Worker<OrderProcessingJobData>(
    ORDER_PROCESSING_QUEUE,
    handleOrderJob,
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✔ Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`✘ Job ${job?.id} failed: ${error.message}`);
  });

  console.log(`🔧 Order processing worker listening on queue "${ORDER_PROCESSING_QUEUE}"`);

  return worker;
}

export async function stopOrderProcessingWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}

export async function bootstrapWorkerProcess(): Promise<void> {
  await connectDatabase();
  startOrderProcessingWorker();
}
