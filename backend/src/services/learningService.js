import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';
import historyService from './historyService.js';
import conversationService from './conversationService.js';
import messageService from './messageService.js';
import logger from '../utils/logger.js';

/**
 * Pure fallback responses layout if AI endpoints are unreachable.
 */
export const fallbackLearningResponse = (prompt) => {
  return {
    explanation: `Programming Concept Tutor Breakdown for: "${prompt}".`,
    learningPath: [
      'Step 1: Read structural documentation manuals.',
      'Step 2: Run local compiler executions to check constraints.',
      'Step 3: Refactor code templates using best patterns.'
    ],
    exercises: [
      {
        title: 'Exercise 1: Basic execution block',
        description: 'Verify input boundaries conditions inside function parameter declarations.',
        codeTemplate: '// Complete custom execution block logic...'
      }
    ],
    response: `Here is a custom curriculum map explaining: "${prompt}". Check the suggested paths and exercises details.`
  };
};

export const learningService = {
  /**
   * Prompts the AI programming assistant, maintaining conversation context threads.
   * Logs usage details into history logs.
   * @param {number} userId - Authenticated user context.
   * @param {string} prompt - User learning question or programming concept.
   * @param {number} [conversationId] - Optional conversation thread context.
   */
  async askAssistant(userId, prompt, conversationId = null) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Tutor analysis requires a non-empty learning query');
    }

    let activeConversationId = conversationId;
    let historyMessages = [];

    // Retrieve or create conversation context thread
    if (activeConversationId) {
      const owned = await conversationService.verifyOwnership(userId, activeConversationId);
      if (!owned) {
        const error = new Error('Not authorized to access this conversation session');
        error.statusCode = 403;
        throw error;
      }

      const res = await messageService.getConversationMessages(userId, activeConversationId, 1, 50);
      historyMessages = res.messages || [];
    } else {
      const conv = await conversationService.createConversation(userId, prompt);
      activeConversationId = conv.id;
    }

    let result = null;

    try {
      const aiPrompt = promptBuilder.buildLearningPrompt(prompt, historyMessages);
      const aiResult = await aiService.executePrompt(aiPrompt, {
        temperature: 0.2,
        maxTokens: 1200
      });

      let cleanedText = aiResult.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      result = JSON.parse(cleanedText);
    } catch (err) {
      logger.warn(`Learning Assistant Service: AI query failed. Running offline fallback. Error: ${err.message}`);
      result = fallbackLearningResponse(prompt);
    }

    // Save messages in chronological conversation thread
    try {
      await messageService.saveMessage(activeConversationId, 'user', prompt);
      await messageService.saveMessage(activeConversationId, 'ai', result.response || JSON.stringify(result));
    } catch (msgErr) {
      logger.error('Learning Assistant Service: Failed to persist conversation messages:', msgErr);
    }

    // Save history logs activity
    try {
      await historyService.logActivity(userId, 'learning-assistant', {
        input: prompt,
        output: JSON.stringify(result)
      });
    } catch (logErr) {
      logger.error('Learning Assistant Service: Failed to log history activity:', logErr);
    }

    // Inject active conversationId into result body
    result.conversationId = activeConversationId;

    return result;
  }
};

export default learningService;
