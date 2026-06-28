import explainService from '../services/explainService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const explainController = {
  /**
   * Accepts and validates request parameters for source code analysis and explanation details.
   */
  async explainCode(req, res, next) {
    try {
      const { code, level } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required inside body');
        error.statusCode = 400;
        throw error;
      }

      // Default explanation level to beginner
      let selectedLevel = 'beginner';
      if (level && ['beginner', 'intermediate', 'advanced'].includes(level.trim().toLowerCase())) {
        selectedLevel = level.trim().toLowerCase();
      }

      const result = await explainService.explainCode(userId, code.trim(), selectedLevel);
      return sendSuccess(res, result, 200, 'Code breakdown explanation succeeded');
    } catch (error) {
      next(error);
    }
  }
};

export default explainController;
