import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const conversationService = {
  /**
   * Helper to format prompts into trimmed conversation titles.
   * @param {string} prompt - Optional initial message prompt.
   * @returns {string} Clean title.
   */
  generateTitle(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return 'New Conversation';
    }
    const cleanPrompt = prompt.trim().replace(/\s+/g, ' ');
    if (cleanPrompt.length <= 50) {
      return cleanPrompt;
    }
    return cleanPrompt.substring(0, 47) + '...';
  },

  /**
   * Insert new conversation record.
   * @param {number} userId - The owner of the conversation.
   * @param {string} [prompt] - Optional prompt to set title.
   */
  async createConversation(userId, prompt) {
    const title = this.generateTitle(prompt);

    logger.info(`Conversation Service: Creating conversation for user ${userId} with title "${title}"`);
    const result = await query(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [userId, title]
    );

    return {
      id: result.insertId,
      userId,
      title,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Fetch all conversations for a user.
   * @param {number} userId - The authenticated user ID.
   */
  async getUserConversations(userId) {
    logger.info(`Conversation Service: Fetching conversations for user ${userId}`);
    const rows = await query(
      'SELECT id, user_id as userId, title, created_at as createdAt FROM conversations WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  /**
   * Retrieve single conversation. Includes user isolation query logic.
   * @param {number} userId - The authenticated user.
   * @param {number} conversationId - Target conversation ID.
   */
  async getConversationById(userId, conversationId) {
    logger.info(`Conversation Service: Retrieving conversation ${conversationId} for user ${userId}`);
    
    // STRICT RULE: Query MUST include user verification
    const rows = await query(
      'SELECT id, user_id as userId, title, created_at as createdAt FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0];
  },

  /**
   * Retrieve a conversation by ID only to check general existence.
   * @param {number} conversationId - The conversation ID.
   */
  async getRawConversation(conversationId) {
    const rows = await query('SELECT id, user_id as userId FROM conversations WHERE id = ?', [conversationId]);
    return rows && rows.length > 0 ? rows[0] : null;
  },

  /**
   * Verify if the conversation belongs to the authenticated user.
   * @param {number} userId - User ID.
   * @param {number} conversationId - Conversation ID.
   * @returns {Promise<boolean>}
   */
  async verifyOwnership(userId, conversationId) {
    const rows = await query(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );
    return rows && rows.length > 0;
  }
};

export default conversationService;
