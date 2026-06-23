import express from 'express';
import docController from '../controllers/docController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/generate', docController.generateDocumentation);

export default router;
