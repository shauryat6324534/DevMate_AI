import profileService from '../services/profileService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const profileController = {
  /**
   * Retrieves profile details for the authenticated user.
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const result = await profileService.getProfile(userId);
      return sendSuccess(res, result, 200, 'Profile loaded successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validates and updates profile details (name, email).
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        const error = new Error('Name parameter is required and must be non-empty');
        error.statusCode = 400;
        throw error;
      }

      if (!email || typeof email !== 'string' || email.trim() === '') {
        const error = new Error('Email parameter is required and must be non-empty');
        error.statusCode = 400;
        throw error;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        const error = new Error('Email format is invalid');
        error.statusCode = 400;
        throw error;
      }

      const result = await profileService.updateProfile(userId, name.trim(), email.trim().toLowerCase());
      return sendSuccess(res, result, 200, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validates password constraints, checks current password, and updates it.
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
        const error = new Error('Current password is required');
        error.statusCode = 400;
        throw error;
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
        const error = new Error('New password is required');
        error.statusCode = 400;
        throw error;
      }

      if (newPassword.length < 6) {
        const error = new Error('New password must be at least 6 characters long');
        error.statusCode = 400;
        throw error;
      }

      const result = await profileService.changePassword(userId, currentPassword, newPassword);
      return sendSuccess(res, result, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default profileController;
