import express from 'express';
import codeController from '../controllers/codeController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/generate', codeController.generateCode);

export default router;
