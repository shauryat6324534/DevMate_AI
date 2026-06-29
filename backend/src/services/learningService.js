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

const formatLearningResponseToMarkdown = (result) => {
  const explanation = result.explanation || '';
  const path = Array.isArray(result.learningPath)
    ? result.learningPath.map(s => `- ${s}`).join('\n')
    : '';
  const exercises = Array.isArray(result.exercises)
    ? result.exercises.map(e => `#### ${e.title}\n${e.description}\n\n\`\`\`javascript\n${e.codeTemplate}\n\`\`\``).join('\n\n')
    : '';
  const response = result.response || '';

  return `${response}\n\n### Conceptual Explanation\n${explanation}\n\n### Suggested Learning Path\n${path}\n\n### Practice Exercises\n${exercises}`;
};

const attemptRepairJSON = (text) => {
  let cleaned = text.trim();

  // 1. Remove markdown code block wrapping if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  // 2. Trim leading text before the first '{' and trailing text after the last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Fix unescaped newlines and common malformed structures inside double quotes
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    try {
      let inQuote = false;
      let chars = cleaned.split('');
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === '"' && (i === 0 || chars[i - 1] !== '\\')) {
          inQuote = !inQuote;
        } else if (inQuote && chars[i] === '\n') {
          chars[i] = '\\n';
        } else if (inQuote && chars[i] === '\r') {
          chars[i] = '\\r';
        } else if (inQuote && chars[i] === '\t') {
          chars[i] = '\\t';
        }
      }
      cleaned = chars.join('');
      return JSON.parse(cleaned);
    } catch (innerErr) {
      return null;
    }
  }
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
    const aiPrompt = promptBuilder.buildLearningPrompt(prompt, historyMessages);

    const tryProcessResponse = (rawText) => {
      logger.info(`Learning Assistant Service: Raw AI Response received: ${rawText}`);

      let cleanedText = rawText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      try {
        return JSON.parse(cleanedText);
      } catch (parseError) {
        logger.warn(`Learning Assistant Service: Initial JSON.parse failed. Error: ${parseError.message}. Attempting repair...`);
        const repaired = attemptRepairJSON(rawText);
        if (repaired) {
          logger.info("Learning Assistant Service: JSON repair succeeded!");
          return repaired;
        }
        throw parseError;
      }
    };

    try {
      const aiResult = await aiService.executePrompt(aiPrompt, {
        temperature: 0.2,
        maxTokens: 1200
      });
      result = tryProcessResponse(aiResult.text);
    } catch (firstAttemptError) {
      logger.warn(`Learning Assistant Service: First AI attempt or parsing failed: ${firstAttemptError.message}. Retrying once with extra guidance...`);

      try {
        const retryPrompt = JSON.parse(JSON.stringify(aiPrompt));
        if (retryPrompt.length > 0 && retryPrompt[0].role === 'system') {
          retryPrompt[0].content += "\nReturn ONLY valid JSON. Do not include markdown, explanations, or any extra text.";
        } else {
          retryPrompt.push({
            role: 'system',
            content: "Return ONLY valid JSON. Do not include markdown, explanations, or any extra text."
          });
        }

        const aiResultRetry = await aiService.executePrompt(retryPrompt, {
          temperature: 0.1,
          maxTokens: 1200
        });

        result = tryProcessResponse(aiResultRetry.text);
      } catch (retryError) {
        logger.error(`Learning Assistant Service: AI query and retry both failed. Running offline fallback. Error: ${retryError.message}`);
        result = fallbackLearningResponse(prompt);
      }
    }

    // Save messages in chronological conversation thread
    try {
      await messageService.saveMessage(activeConversationId, 'user', prompt);
      const savedContent = formatLearningResponseToMarkdown(result);
      await messageService.saveMessage(activeConversationId, 'ai', savedContent);
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
