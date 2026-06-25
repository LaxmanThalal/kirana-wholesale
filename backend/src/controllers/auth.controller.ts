import { Router, Request, Response } from 'express';
import { smsService } from '../services/sms/index.js';
import { redisClient } from '../config/redisClient.js';

const router = Router();

const OTP_TTL_SECONDS = 120;

function generateOtp(): string {
  // 4‑digit numeric OTP
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.post('/request-otp', async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const otp = generateOtp();
  const key = `otp:${phone}`;
  // Store OTP in Redis with expiration
  await redisClient.set(key, otp, 'EX', OTP_TTL_SECONDS);
  // Send OTP via SMS service (real or mock depending on env)
  const result = await smsService.sendOtp(phone, otp);
  if (!result.success) {
    console.error('Failed to send OTP:', result.error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
  return res.status(200).json({ message: 'OTP sent' });
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body as { phone: string; otp: string };
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }
  const key = `otp:${phone}`;
  const stored = await redisClient.get(key);
  if (stored && stored === otp) {
    // Successful verification – delete the key
    await redisClient.del(key);
    return res.status(200).json({ verified: true });
  }
  return res.status(401).json({ verified: false, error: 'Invalid or expired OTP' });
});

export default router;
