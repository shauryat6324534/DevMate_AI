import conversationService from '../services/conversationService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const conversationController = {
  /**
   * Validates credentials and handles request to establish new conversation sessions.
   */
  async createConversation(req, res, next) {
    try {
      const { prompt } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const conversation = await conversationService.createConversation(userId, prompt);
      return sendSuccess(res, conversation, 201, 'Conversation created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieves all conversations belonging to the isolated authenticated user.
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const conversations = await conversationService.getUserConversations(userId);
      return sendSuccess(res, conversations, 200, 'Conversations loaded successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validates parameters and ownership constraints before returning details of a single conversation session.
   */
  async getConversationById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!id) {
        const error = new Error('Conversation ID is required');
        error.statusCode = 400;
        throw error;
      }

      const conversationId = parseInt(id, 10);
      if (isNaN(conversationId) || conversationId <= 0) {
        const error = new Error('Invalid conversation ID');
        error.statusCode = 400;
        throw error;
      }

      // Check if conversation exists at all to return 404 vs 403
      const rawConversation = await conversationService.getRawConversation(conversationId);
      if (!rawConversation) {
        const error = new Error('Conversation not found');
        error.statusCode = 404;
        throw error;
      }

      // Enforce isolation ownership check
      if (rawConversation.userId !== userId) {
        const error = new Error('Access denied, you do not own this conversation');
        error.statusCode = 403;
        throw error;
      }

      const conversation = await conversationService.getConversationById(userId, conversationId);
      return sendSuccess(res, conversation, 200, 'Conversation loaded successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default conversationController;
