import optimizeService from '../services/optimizeService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const optimizeController = {
  async optimizeCode(req, res, next) {
    try {
      const { code } = req.body;

      if (!code) {
        const error = new Error('Code snippet block is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await optimizeService.optimizeCode(code);
      return sendSuccess(res, result, 200, 'Optimization parameters prepared successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default optimizeController;
