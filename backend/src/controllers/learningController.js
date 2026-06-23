import learningService from '../services/learningService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const learningController = {
  async explainConcept(req, res, next) {
    try {
      const { concept } = req.body;

      if (!concept) {
        const error = new Error('Concept parameter is required inside body');
        error.statusCode = 400;
        throw error;
      }

      const result = await learningService.explainConcept(concept);
      return sendSuccess(res, result, 200, 'Concept lesson explanation generated');
    } catch (error) {
      next(error);
    }
  }
};

export default learningController;
