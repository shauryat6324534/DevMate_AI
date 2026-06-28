import chatManagementService from '../services/chatManagementService.js';
import conversationService from '../services/conversationService.js';
import messageService from '../services/messageService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const chatManagementController = {
  /**
   * Renames a specific conversation thread.
   */
  async renameChat(req, res, next) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!title || typeof title !== 'string' || title.trim() === '') {
        const error = new Error('Title parameter is required and must be non-empty');
        error.statusCode = 400;
        throw error;
      }

      const result = await chatManagementService.renameChat(userId, parseInt(id, 10), title.trim());
      return sendSuccess(res, result, 200, 'Chat renamed successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes a conversation thread and its associated message history.
   */
  async deleteChat(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const result = await chatManagementService.deleteChat(userId, parseInt(id, 10));
      return sendSuccess(res, result, 200, 'Chat deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lists paginated, sorted user chats.
   */
  async listChats(req, res, next) {
    try {
      const userId = req.user?.id;
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const sortBy = req.query.sortBy || 'latest';
      const sortOrder = req.query.sortOrder || 'DESC';

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const result = await chatManagementService.listChats(userId, page, limit, sortBy, sortOrder);
      return sendSuccess(res, result, 200, 'Chats loaded successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Searches titles or message body contents.
   */
  async searchChats(req, res, next) {
    try {
      const userId = req.user?.id;
      const queryTerm = req.query.q || req.query.query;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!queryTerm || typeof queryTerm !== 'string' || queryTerm.trim() === '') {
        const error = new Error('Search query term "q" is required and must be non-empty');
        error.statusCode = 400;
        throw error;
      }

      const result = await chatManagementService.searchChats(userId, queryTerm.trim());
      return sendSuccess(res, result, 200, 'Chats search results loaded');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Legacy backward-compatibility wrapper to create chats.
   */
  async createConversation(req, res, next) {
    try {
      const { title } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      const result = await conversationService.createConversation(userId, title);
      return sendSuccess(res, result, 201, 'Conversation thread created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Legacy backward-compatibility wrapper to append messages.
   */
  async addMessage(req, res, next) {
    try {
      const { role, content } = req.body;
      const { conversationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!role || !content) {
        const error = new Error('Role and content fields are required inside body');
        error.statusCode = 400;
        throw error;
      }

      // Verify ownership before saving messages
      const activeConvId = parseInt(conversationId, 10);
      const owned = await conversationService.verifyOwnership(userId, activeConvId);
      if (!owned) {
        const error = new Error('Not authorized to access this conversation session');
        error.statusCode = 403;
        throw error;
      }

      const result = await messageService.saveMessage(activeConvId, role, content);
      return sendSuccess(res, result, 201, 'Message submitted to thread');
    } catch (error) {
      next(error);
    }
  }
};

export default chatManagementController;
