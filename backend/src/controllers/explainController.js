import explainService from '../services/explainService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const explainController = {
  async explainCode(req, res, next) {
    try {
      const { code, level } = req.body;

      if (!code) {
        const error = new Error('Code block parameter is required inside body');
        error.statusCode = 400;
        throw error;
      }

      const result = await explainService.explainCode(code, level);
      return sendSuccess(res, result, 200, 'Code breakdown explanation succeeded');
    } catch (error) {
      next(error);
    }
  }
};

export default explainController;
