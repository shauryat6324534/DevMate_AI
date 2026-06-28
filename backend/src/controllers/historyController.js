import historyService from '../services/historyService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const historyController = {
  /**
   * Load history records for the authenticated user context.
   * Supports filtering by featureType and whitelisted sort order.
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      // Parse filters and sorting options from query parameters
      const featureType = req.query.featureType || req.query.feature_type;
      const sort = req.query.sort || 'DESC';

      const normalizedSort = sort.toUpperCase();
      if (!['ASC', 'DESC'].includes(normalizedSort)) {
        const error = new Error('Invalid sort parameter. Allowed values are "ASC" or "DESC"');
        error.statusCode = 400;
        throw error;
      }

      const filters = {};
      if (featureType) {
        filters.featureType = featureType.trim();
      }

      const result = await historyService.getUserHistory(userId, filters, normalizedSort);
      return sendSuccess(res, result, 200, 'Activity history records loaded successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch single user history log item.
   * Enforces validations and tenant check constraints.
   */
  async getHistoryById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!id) {
        const error = new Error('History ID parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const historyId = parseInt(id, 10);
      if (isNaN(historyId) || historyId <= 0) {
        const error = new Error('Invalid history ID format');
        error.statusCode = 400;
        throw error;
      }

      // Verify log entry existence and owner isolation boundaries
      const rawHistory = await historyService.getRawHistory(historyId);
      if (!rawHistory) {
        const error = new Error('History record not found');
        error.statusCode = 404;
        throw error;
      }

      if (rawHistory.userId !== userId) {
        const error = new Error('Access denied, unauthorized to view this history record');
        error.statusCode = 403;
        throw error;
      }

      const historyItem = await historyService.getHistoryById(userId, historyId);
      return sendSuccess(res, historyItem, 200, 'History record loaded successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default historyController;
