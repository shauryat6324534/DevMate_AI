import debugService from '../services/debugService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const debugController = {
  /**
   * Accepts and validates request parameters for source code analysis and debugging assistance.
   */
  async debugCode(req, res, next) {
    try {
      const { code, errorLogs } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await debugService.debugCode(userId, code.trim(), errorLogs || '');
      return sendSuccess(res, result, 200, 'Debugging diagnosis completed');
    } catch (error) {
      next(error);
    }
  }
};

export default debugController;
