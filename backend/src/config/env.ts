import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface EnvConfig {
  port: number;
  mongoUri: string;
  redisUrl?: string;
  nodeEnv: 'development' | 'production' | 'test';
  sparrowToken?: string;
  sparrowFrom?: string;
  fonepayMerchantCode?: string;
  fonepayMerchantSecret?: string;
  fonepayUsername?: string;
  fonepayPassword?: string;
  fonepayDynamicQrUrl: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is missing from environment variables`);
  }
  return value;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: requireEnv('MONGO_URI'),
  redisUrl: process.env.REDIS_URL,
  nodeEnv: (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development',
  sparrowToken: process.env.SPARROW_TOKEN,
  sparrowFrom: process.env.SPARROW_FROM,
  fonepayMerchantCode: process.env.FONEPAY_MERCHANT_CODE,
  fonepayMerchantSecret: process.env.FONEPAY_MERCHANT_SECRET,
  fonepayUsername: process.env.FONEPAY_USERNAME,
  fonepayPassword: process.env.FONEPAY_PASSWORD,
  fonepayDynamicQrUrl:
    process.env.FONEPAY_DYNAMIC_QR_URL ??
    'https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty',
};
