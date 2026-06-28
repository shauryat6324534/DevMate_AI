import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const chatManagementService = {
  /**
   * Helper verifying conversation ownership.
   */
  async verifyOwnership(userId, conversationId) {
    const rows = await query(
      'SELECT id, user_id as userId FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (!rows || rows.length === 0) {
      const error = new Error('Chat session not found');
      error.statusCode = 404;
      throw error;
    }

    if (rows[0].userId !== userId) {
      const error = new Error('Not authorized to manage this chat session');
      error.statusCode = 403;
      throw error;
    }

    return true;
  },

  /**
   * Renames a chat title context.
   */
  async renameChat(userId, conversationId, title) {
    await this.verifyOwnership(userId, conversationId);

    logger.info(`Chat Management Service: Renaming chat ${conversationId} to "${title}"`);
    await query(
      'UPDATE conversations SET title = ? WHERE id = ?',
      [title, conversationId]
    );

    return {
      id: conversationId,
      title,
      userId
    };
  },

  /**
   * Deletes all conversation messages and the conversation thread.
   */
  async deleteChat(userId, conversationId) {
    await this.verifyOwnership(userId, conversationId);

    logger.info(`Chat Management Service: Deleting conversation messages for chat ${conversationId}`);
    await query('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);

    logger.info(`Chat Management Service: Deleting conversation thread ${conversationId}`);
    await query('DELETE FROM conversations WHERE id = ?', [conversationId]);

    return {
      success: true,
      message: 'Chat session deleted successfully'
    };
  },

  /**
   * Retrieves paginated, sorted lists of conversations.
   */
  async listChats(userId, page = 1, limit = 10, sortBy = 'latest', sortOrder = 'DESC') {
    logger.info(`Chat Management Service: Listing chats for user ${userId} (Page: ${page}, Limit: ${limit}, SortBy: ${sortBy})`);
    
    const offset = (page - 1) * limit;

    // Handle Sorting options: Latest First vs Oldest First
    let orderClause = 'DESC';
    if (sortBy === 'oldest' || sortOrder.toUpperCase() === 'ASC') {
      orderClause = 'ASC';
    }

    const conversations = await query(
      `SELECT id, title, created_at as createdAt 
       FROM conversations 
       WHERE user_id = ? 
       ORDER BY created_at ${orderClause}, id ${orderClause} 
       LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
      [userId]
    );

    const countResult = await query(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?',
      [userId]
    );

    const total = countResult && countResult[0] ? countResult[0].count : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      conversations,
      page,
      limit,
      total,
      totalPages
    };
  },

  /**
   * Searches conversation titles or message contents.
   */
  async searchChats(userId, queryTerm) {
    logger.info(`Chat Management Service: Searching chats for user ${userId} with term "${queryTerm}"`);
    
    const term = `%${queryTerm}%`;
    const rows = await query(
      `SELECT DISTINCT c.id, c.title, c.created_at as createdAt 
       FROM conversations c 
       LEFT JOIN messages m ON m.conversation_id = c.id 
       WHERE c.user_id = ? AND (c.title LIKE ? OR m.content LIKE ?) 
       ORDER BY c.created_at DESC`,
      [userId, term, term]
    );

    return rows;
  }
};

export default chatManagementService;
