import debugService from '../services/debugService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const debugController = {
  async debugCode(req, res, next) {
    try {
      const { code, errorLogs } = req.body;

      if (!code) {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await debugService.debugCode(code, errorLogs);
      return sendSuccess(res, result, 200, 'Debugging diagnosis completed');
    } catch (error) {
      next(error);
    }
  }
};

export default debugController;
