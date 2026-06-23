import chatService from '../services/chatService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const chatController = {
  async createConversation(req, res, next) {
    try {
      const { title } = req.body;
      const userId = req.user?.id || 1; 

      const result = await chatService.createConversation(userId, title);
      return sendSuccess(res, result, 201, 'Conversation thread created successfully');
    } catch (error) {
      next(error);
    }
  },

  async getConversations(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const result = await chatService.getConversations(userId);
      return sendSuccess(res, result, 200, 'Conversations loaded successfully');
    } catch (error) {
      next(error);
    }
  },

  async addMessage(req, res, next) {
    try {
      const { role, content } = req.body;
      const { conversationId } = req.params;

      if (!role || !content) {
        const error = new Error('Role and content fields are required inside body');
        error.statusCode = 400;
        throw error;
      }

      const result = await chatService.addMessage(conversationId, role, content);
      return sendSuccess(res, result, 201, 'Message submitted to thread');
    } catch (error) {
      next(error);
    }
  }
};

export default chatController;
