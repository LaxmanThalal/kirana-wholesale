import { bootstrapWorkerProcess } from './workers/orderProcessing.worker.js';

bootstrapWorkerProcess().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Worker failed to start:', message);
  process.exit(1);
});
