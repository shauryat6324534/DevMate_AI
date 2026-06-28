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

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/code', codeRoutes);
router.use('/explain-code', explainRoutes);
router.use('/debug-code', debugRoutes);
router.use('/optimize-code', optimizationRoutes);
router.use('/', documentationRoutes);
router.use('/review-code', reviewRoutes);
router.use('/learning-assistant', learningRoutes);
router.use('/downloads', downloadRoutes);
router.use('/history', historyRoutes);
router.use('/generate-code', generateCodeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);

export default router;
