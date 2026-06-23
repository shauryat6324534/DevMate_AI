import codeService from '../services/codeService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const codeController = {
  async generateCode(req, res, next) {
    try {
      const { description, language, constraints } = req.body;

      if (!description || !language) {
        const error = new Error('Description and target programming language are required');
        error.statusCode = 400;
        throw error;
      }

      const result = await codeService.generateCode(description, language, constraints);
      return sendSuccess(res, result, 200, 'Code generation query completed');
    } catch (error) {
      next(error);
    }
  }
};

export default codeController;
