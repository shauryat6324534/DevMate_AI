import express from 'express';
import explainController from '../controllers/explainController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/explain', explainController.explainCode);

export default router;
