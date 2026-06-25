import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import routes from './routes/index.js';
import { startOrderProcessingWorker } from './workers/orderProcessing.worker.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(notFound);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await connectDatabase();
  startOrderProcessingWorker();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Failed to start server:', message);
  process.exit(1);
});
