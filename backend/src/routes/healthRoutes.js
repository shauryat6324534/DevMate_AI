import express from 'express';
import { sendSuccess } from '../utils/responseHelper.js';

const router = express.Router();

router.get('/', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    reactVersion: '19'
  }, 200, 'DevMate AI backend services are active');
});

export default router;
