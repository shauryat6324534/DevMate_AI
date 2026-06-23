import express from 'express';
import reviewController from '../controllers/reviewController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/review', reviewController.reviewCode);

export default router;
