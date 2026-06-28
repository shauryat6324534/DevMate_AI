import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const profileService = {
  /**
   * Fetches user profile details.
   */
  async getProfile(userId) {
    logger.info(`Profile Service: Fetching profile for user ${userId}`);
    const rows = await query('SELECT id, name, email FROM users WHERE id = ?', [userId]);

    if (!rows || rows.length === 0) {
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  },

  /**
   * Updates user name and email. Checks for duplicates.
   */
  async updateProfile(userId, name, email) {
    logger.info(`Profile Service: Updating details for user ${userId}`);

    // Check duplicate email
    const duplicate = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (duplicate && duplicate.length > 0) {
      const error = new Error('Email is already registered by another user');
      error.statusCode = 400;
      throw error;
    }

    await query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );

    return {
      id: userId,
      name,
      email
    };
  },

  /**
   * Modifies password. Verifies current password and hashes the new one using bcrypt.
   */
  async changePassword(userId, currentPassword, newPassword) {
    logger.info(`Profile Service: Changing password for user ${userId}`);

    const users = await query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }

    // Hash with salt rounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }
};

export default profileService;
