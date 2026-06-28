import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import chatManagementRoutes from './chatManagementRoutes.js';
import codeRoutes from './codeRoutes.js';
import explainRoutes from './explainRoutes.js';
import debugRoutes from './debugRoutes.js';
import optimizationRoutes from './optimizationRoutes.js';
import documentationRoutes from './documentationRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import learningRoutes from './learningRoutes.js';
import downloadRoutes from './downloadRoutes.js';
import historyRoutes from './historyRoutes.js';
import generateCodeRoutes from './generateCodeRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import messageRoutes from './messageRoutes.js';
import profileRoutes from './profileRoutes.js';
import { authLimiter, aiLimiter, profileLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authLimiter, authRoutes);
router.use('/chats', chatManagementRoutes);
router.use('/code', aiLimiter, codeRoutes);
router.use('/explain-code', aiLimiter, explainRoutes);
router.use('/debug-code', aiLimiter, debugRoutes);
router.use('/optimize-code', aiLimiter, optimizationRoutes);

// Apply AI rate limiter specifically to documentation paths
router.use('/generate-readme', aiLimiter);
router.use('/generate-function-docs', aiLimiter);
router.use('/generate-api-docs', aiLimiter);
router.use('/generate-comments', aiLimiter);
router.use('/', documentationRoutes);

router.use('/review-code', aiLimiter, reviewRoutes);
router.use('/learning-assistant', aiLimiter, learningRoutes);
router.use('/download', downloadRoutes);
router.use('/history', historyRoutes);
router.use('/generate-code', aiLimiter, generateCodeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/profile', profileLimiter, profileRoutes);

export default router;
