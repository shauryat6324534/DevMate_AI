import express from 'express';
import chatManagementController from '../controllers/chatManagementController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT token authentication for all chat management routes
router.use(protect);

router.get('/', chatManagementController.listChats);
router.get('/search', chatManagementController.searchChats);
router.patch('/:id/rename', chatManagementController.renameChat);
router.delete('/:id', chatManagementController.deleteChat);
router.post('/', chatManagementController.createConversation);
router.post('/:conversationId/messages', chatManagementController.addMessage);

export default router;
