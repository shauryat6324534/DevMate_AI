import reviewService from '../services/reviewService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const reviewController = {
  /**
   * Accepts and validates request parameters for source code analysis and quality reviews.
   */
  async reviewCode(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block is required for review analysis');
        error.statusCode = 400;
        throw error;
      }

      const result = await reviewService.reviewCode(userId, code.trim());
      return sendSuccess(res, result, 200, 'Code quality review executed');
    } catch (error) {
      next(error);
    }
  }
};

export default reviewController;
