import optimizationService from '../services/optimizationService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const optimizationController = {
  /**
   * Accepts and validates request parameters for source code analysis and optimization.
   */
  async optimizeCode(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code snippet block is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await optimizationService.optimizeCode(userId, code.trim());
      return sendSuccess(res, result, 200, 'Optimization parameters prepared successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default optimizationController;
