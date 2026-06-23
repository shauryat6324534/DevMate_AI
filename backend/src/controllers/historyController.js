import historyService from '../services/historyService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const historyController = {
  async getHistory(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const result = await historyService.getUserHistory(userId);
      return sendSuccess(res, result, 200, 'Activity history records loaded successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default historyController;
