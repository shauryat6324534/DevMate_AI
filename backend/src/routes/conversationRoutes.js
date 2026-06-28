import express from 'express';
import conversationController from '../controllers/conversationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All conversation endpoints require a valid JWT token
router.use(protect);

router.post('/', conversationController.createConversation);
router.get('/', conversationController.getConversations);
router.get('/:id', conversationController.getConversationById);

export default router;
