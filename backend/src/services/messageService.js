import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const messageService = {
  /**
   * Save a conversation message to the database.
   * @param {number} conversationId - The conversation context.
   * @param {string} sender - 'user' or 'ai'.
   * @param {string} content - Message body.
   */
  async saveMessage(conversationId, sender, content) {
    logger.info(`Message Service: Saving message from "${sender}" in conversation ${conversationId}`);
    
    const result = await query(
      'INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)',
      [conversationId, sender, content]
    );

    return {
      id: result.insertId,
      conversationId,
      sender,
      content,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Fetch conversation messages using SQL JOIN to guarantee user isolation check.
   * Order chronologically (created_at ASC) and support offset pagination.
   * @param {number} userId - Authenticated user context.
   * @param {number} conversationId - Target conversation ID.
   * @param {number} page - Page number.
   * @param {number} limit - Items per page.
   */
  async getConversationMessages(userId, conversationId, page = 1, limit = 20) {
    logger.info(`Message Service: Fetching messages for conversation ${conversationId} (User: ${userId}, Page: ${page}, Limit: ${limit})`);

    const offset = (page - 1) * limit;

    // Strict User Isolation Check: INNER JOIN on conversations to verify ownership at SQL level
    const rows = await query(
      `SELECT m.id, m.conversation_id as conversationId, m.sender, m.content, m.created_at as createdAt 
       FROM messages m
       INNER JOIN conversations c ON m.conversation_id = c.id
       WHERE m.conversation_id = ? AND c.user_id = ?
       ORDER BY m.created_at ASC
       LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
      [conversationId, userId]
    );

    const total = await this.countConversationMessages(userId, conversationId);
    const totalPages = Math.ceil(total / limit);

    return {
      messages: rows,
      page,
      limit,
      total,
      totalPages
    };
  },

  /**
   * Count conversation messages enforcing tenant check.
   * @param {number} userId - Owner context.
   * @param {number} conversationId - Target session.
   * @returns {Promise<number>} Total count.
   */
  async countConversationMessages(userId, conversationId) {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM messages m
       INNER JOIN conversations c ON m.conversation_id = c.id
       WHERE m.conversation_id = ? AND c.user_id = ?`,
      [conversationId, userId]
    );
    return result && result[0] ? result[0].count : 0;
  }
};

export default messageService;
