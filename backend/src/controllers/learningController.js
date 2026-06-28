import learningService from '../services/learningService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const learningController = {
  /**
   * Accepts and validates request parameters for programming concept lessons and exercises.
   */
  async askAssistant(req, res, next) {
    try {
      const { prompt, conversationId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        const error = new Error('Prompt parameter is required inside body');
        error.statusCode = 400;
        throw error;
      }

      const cleanConversationId = conversationId ? parseInt(conversationId, 10) : null;

      const result = await learningService.askAssistant(userId, prompt.trim(), cleanConversationId);
      return sendSuccess(res, result, 200, 'Concept lesson explanation generated');
    } catch (error) {
      next(error);
    }
  }
};

export default learningController;
