import reviewService from '../services/reviewService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const reviewController = {
  async reviewCode(req, res, next) {
    try {
      const { code } = req.body;

      if (!code) {
        const error = new Error('Code block is required for review analysis');
        error.statusCode = 400;
        throw error;
      }

      const result = await reviewService.reviewCode(code);
      return sendSuccess(res, result, 200, 'Code quality review executed');
    } catch (error) {
      next(error);
    }
  }
};

export default reviewController;
