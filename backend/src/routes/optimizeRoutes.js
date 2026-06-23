import express from 'express';
import optimizeController from '../controllers/optimizeController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/optimize', optimizeController.optimizeCode);

export default router;
