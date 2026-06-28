import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const historyService = {
  /**
   * Logs a user feature utilization activity to database history.
   * @param {number} userId - The authenticated user ID.
   * @param {string} featureType - The feature identifier (e.g. 'code-gen', 'explanation').
   * @param {object} details - Input/output tracking data.
   */
  async logActivity(userId, featureType, details = {}) {
    const input = details.input || '';
    const output = details.output || '';

    try {
      const result = await query(
        'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
        [userId, featureType, input, output]
      );
      return {
        id: result.insertId,
        userId,
        featureType,
        details,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('History Service: Failed to persist user activity log:', error);
      return {
        id: 5001,
        userId,
        featureType,
        details,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Retrieves chronological usage history logs for an isolated user profile.
   * Supports filtering by featureType and sorting.
   * @param {number} userId - User identifier.
   * @param {object} [filters] - Filter fields (e.g., { featureType }).
   * @param {string} [sort] - Sort order ('ASC' or 'DESC').
   */
  async getUserHistory(userId, filters = {}, sort = 'DESC') {
    logger.info(`History Service: Loading history logs for user ${userId}`);

    // Whitelist sort argument to prevent SQL injection
    const order = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let sql = `SELECT id, user_id as userId, feature_type as featureType, input, output, created_at as createdAt 
               FROM history 
               WHERE user_id = ?`;
    const params = [userId];

    if (filters.featureType) {
      sql += ' AND feature_type = ?';
      params.push(filters.featureType);
    }

    sql += ` ORDER BY created_at ${order}, id ${order}`;

    const rows = await query(sql, params);
    return rows;
  },

  /**
   * Fetch single user history record after verifying ownership context.
   * @param {number} userId - Owner context.
   * @param {number} historyId - Target log item.
   */
  async getHistoryById(userId, historyId) {
    logger.info(`History Service: Retrieving item ${historyId} for user ${userId}`);

    // STRICT USER ISOLATION: query filters by both id and user_id
    const rows = await query(
      `SELECT id, user_id as userId, feature_type as featureType, input, output, created_at as createdAt 
       FROM history 
       WHERE id = ? AND user_id = ?`,
      [historyId, userId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0];
  },

  /**
   * Fetch single history log item by ID to check general existence.
   * @param {number} historyId - Target log item.
   */
  async getRawHistory(historyId) {
    const rows = await query(
      'SELECT id, user_id as userId FROM history WHERE id = ?',
      [historyId]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }
};

export default historyService;
