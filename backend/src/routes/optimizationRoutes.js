import express from 'express';
import optimizationController from '../controllers/optimizationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT token authentication for all optimization paths
router.use(protect);

router.post('/', optimizationController.optimizeCode);

export default router;
