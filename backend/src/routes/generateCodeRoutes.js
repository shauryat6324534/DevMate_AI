import express from 'express';
import generateCodeController from '../controllers/generateCodeController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Secure routes with JWT authentication
router.use(protect);

router.post('/', generateCodeController.generate);

export default router;
