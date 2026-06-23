import authService from '../services/authService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const authController = {
  /**
   * Parse user credentials, validate email and password strength,
   * and delegate to the authentication service.
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // 1. Check for required parameters
      if (!name || !email || !password) {
        const error = new Error('Name, email, and password are required fields');
        error.statusCode = 400;
        throw error;
      }

      // 2. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
      }

      // 3. Enforce password complexity rules
      if (password.length < 8) {
        const error = new Error('Password must be at least 8 characters long');
        error.statusCode = 400;
        throw error;
      }
      if (!/[A-Z]/.test(password)) {
        const error = new Error('Password must contain at least one uppercase letter');
        error.statusCode = 400;
        throw error;
      }
      if (!/[0-9]/.test(password)) {
        const error = new Error('Password must contain at least one number');
        error.statusCode = 400;
        throw error;
      }
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharRegex.test(password)) {
        const error = new Error('Password must contain at least one special character');
        error.statusCode = 400;
        throw error;
      }

      const result = await authService.register(name.trim(), email.trim(), password);
      return sendSuccess(res, result, 201, 'Registration successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate parameters and execute user login.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const error = new Error('Email and password parameters are required');
        error.statusCode = 400;
        throw error;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
      }

      const result = await authService.login(email.trim(), password);
      return sendSuccess(res, result, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log out user. Instructs client to purge stateless tokens.
   */
  async logout(req, res, next) {
    try {
      return sendSuccess(res, null, 200, 'Logout successful. Please clear credentials on client.');
    } catch (error) {
      next(error);
    }
  }
};

export default authController;
