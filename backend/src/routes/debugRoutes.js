import express from 'express';
import debugController from '../controllers/debugController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', debugController.debugCode);

export default router;
