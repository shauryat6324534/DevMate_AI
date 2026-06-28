import messageService from '../services/messageService.js';
import conversationService from '../services/conversationService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const messageController = {
  /**
   * Save a single user or AI message into an existing conversation.
   * Enforces ownership checks and content validation.
   */
  async saveMessage(req, res, next) {
    try {
      const { conversationId, sender, content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      // 1. Parameter presence validations
      if (conversationId === undefined || conversationId === null) {
        const error = new Error('Conversation ID is required');
        error.statusCode = 400;
        throw error;
      }

      const parsedId = parseInt(conversationId, 10);
      if (isNaN(parsedId) || parsedId <= 0) {
        const error = new Error('Invalid conversation ID');
        error.statusCode = 400;
        throw error;
      }

      if (!sender || !['user', 'ai'].includes(sender)) {
        const error = new Error('Invalid or missing sender. Allowed values are "user" or "ai"');
        error.statusCode = 400;
        throw error;
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        const error = new Error('Message content cannot be empty');
        error.statusCode = 400;
        throw error;
      }

      // 2. Validate conversation existence and ownership
      const rawConversation = await conversationService.getRawConversation(parsedId);
      if (!rawConversation) {
        const error = new Error('Conversation not found');
        error.statusCode = 404;
        throw error;
      }

      if (rawConversation.userId !== userId) {
        const error = new Error('Access denied, you do not own this conversation');
        error.statusCode = 403;
        throw error;
      }

      // 3. Delegate message insertion
      const message = await messageService.saveMessage(parsedId, sender, content.trim());
      return sendSuccess(res, message, 201, 'Message saved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch paginated chronological messages for a conversation context.
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!conversationId) {
        const error = new Error('Conversation ID is required');
        error.statusCode = 400;
        throw error;
      }

      const parsedId = parseInt(conversationId, 10);
      if (isNaN(parsedId) || parsedId <= 0) {
        const error = new Error('Invalid conversation ID');
        error.statusCode = 400;
        throw error;
      }

      // 1. Verify ownership of the conversation session
      const rawConversation = await conversationService.getRawConversation(parsedId);
      if (!rawConversation) {
        const error = new Error('Conversation not found');
        error.statusCode = 404;
        throw error;
      }

      if (rawConversation.userId !== userId) {
        const error = new Error('Access denied, you do not own this conversation');
        error.statusCode = 403;
        throw error;
      }

      // 2. Parse pagination arguments
      let page = parseInt(req.query.page, 10);
      let limit = parseInt(req.query.limit, 10);

      if (isNaN(page) || page <= 0) page = 1;
      if (isNaN(limit) || limit <= 0) limit = 20;

      // 3. Load chronological page list
      const result = await messageService.getConversationMessages(userId, parsedId, page, limit);
      return sendSuccess(res, result, 200, 'Messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default messageController;
