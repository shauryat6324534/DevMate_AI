import express from 'express';
import historyController from '../controllers/historyController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', historyController.getHistory);

export default router;
