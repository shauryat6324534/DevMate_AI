import express from 'express';
import downloadController from '../controllers/downloadController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/prepare', downloadController.prepareDownload);

export default router;
