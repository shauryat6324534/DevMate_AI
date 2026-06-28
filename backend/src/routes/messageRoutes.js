import express from 'express';
import messageController from '../controllers/messageController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication context for all message paths
router.use(protect);

router.post('/', messageController.saveMessage);
router.get('/:conversationId', messageController.getMessages);

export default router;
