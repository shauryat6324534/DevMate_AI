import express from 'express';
import downloadController from '../controllers/downloadController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT token verification on all export queries
router.use(protect);

router.get('/code', downloadController.downloadCode);
router.get('/explanation', downloadController.downloadExplanation);
router.get('/documentation', downloadController.downloadDocumentation);
router.get('/review', downloadController.downloadReview);
router.get('/learning', downloadController.downloadLearning);

export default router;
