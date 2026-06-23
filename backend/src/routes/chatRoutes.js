import express from 'express';
import chatController from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth middleware context
router.use(protect);

router.post('/', chatController.createConversation);
router.get('/', chatController.getConversations);
router.post('/:conversationId/messages', chatController.addMessage);

export default router;
