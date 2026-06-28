import express from 'express';
import learningController from '../controllers/learningController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', learningController.askAssistant);

export default router;
