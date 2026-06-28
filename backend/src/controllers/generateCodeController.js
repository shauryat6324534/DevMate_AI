import nluService from '../services/nluService.js';
import codeGenerationService from '../services/codeGenerationService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const generateCodeController = {
  /**
   * Parse prompt request, validate input, analyze requirements (NLU),
   * and execute LLM code generation.
   */
  async generate(req, res, next) {
    try {
      const { prompt } = req.body;
      const userId = req.user?.id;

      // 1. Handle Empty or Missing Prompts
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        const error = new Error('Prompt parameter is required inside request body');
        error.statusCode = 400;
        throw error;
      }

      // 2. Perform Natural Language Understanding Analysis
      const nluResult = await nluService.processQuery(prompt.trim());

      // 3. Execute Code Generation
      const generationResult = await codeGenerationService.generateCode(prompt.trim(), nluResult, userId);

      // 4. Return Output
      return sendSuccess(res, generationResult, 200, 'Code generated successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default generateCodeController;
