import aiService from './aiService.js';
import promptBuilder from './promptBuilder.js';
import historyService from './historyService.js';
import logger from '../utils/logger.js';

export const codeGenerationService = {
  /**
   * Generates code based on user prompt and preprocessed NLU result.
   * Logs generation history when userId is supplied.
   * @param {string} prompt - User request.
   * @param {object} nluResult - Pre-extracted language/intent metadata.
   * @param {number} [userId] - Optional authenticated user ID.
   * @returns {Promise<object>} Standardized Code Generation output.
   */
  async generateCode(prompt, nluResult, userId = null) {
    logger.info(`Code Generation Service: Dispatching generation query in ${nluResult.language}`);

    const messages = promptBuilder.buildStructuredCodeGenerationPrompt(prompt, nluResult);

    // Call Centralized AI Service
    const aiResult = await aiService.executePrompt(messages, {
      temperature: 0.2 // lower temperature for stable code generation
    });

    const generatedCode = aiResult.text;

    // Persist activity details inside user history log
    if (userId) {
      try {
        await historyService.logActivity(userId, 'code-gen', {
          input: prompt,
          output: generatedCode
        });
        logger.info(`Code Generation Service: Activity successfully persisted for User ID: ${userId}`);
      } catch (logError) {
        logger.warn(`Code Generation Service: Failed to persist user activity log: ${logError.message}`);
      }
    }

    return {
      generatedCode,
      language: nluResult.language,
      intent: nluResult.intent,
      constraints: nluResult.constraints,
      codeType: nluResult.codeType,
      modelUsed: aiResult.modelUsed,
      timestamp: new Date().toISOString()
    };
  }
};

export default codeGenerationService;
