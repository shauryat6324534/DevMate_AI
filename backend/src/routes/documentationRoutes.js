import express from 'express';
import documentationController from '../controllers/documentationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT token authentication for all documentation routes
router.use(protect);

router.post('/generate-readme', documentationController.generateReadme);
router.post('/generate-function-docs', documentationController.generateFunctionDocs);
router.post('/generate-api-docs', documentationController.generateApiDocs);
router.post('/generate-comments', documentationController.generateComments);

export default router;
