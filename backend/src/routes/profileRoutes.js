import express from 'express';
import profileController from '../controllers/profileController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT token verification on all profile management endpoints
router.use(protect);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

export default router;
