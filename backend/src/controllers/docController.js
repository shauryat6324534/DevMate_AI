import docService from '../services/docService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const docController = {
  async generateDocumentation(req, res, next) {
    try {
      const { code, format } = req.body;

      if (!code) {
        const error = new Error('Code block is required to generate documentation');
        error.statusCode = 400;
        throw error;
      }

      const result = await docService.generateDocumentation(code, format);
      return sendSuccess(res, result, 200, 'Documentation generated successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default docController;
