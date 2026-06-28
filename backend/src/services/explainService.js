import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';
import historyService from './historyService.js';
import logger from '../utils/logger.js';

/**
 * Heuristic programming constructs checker.
 * @param {string} code
 * @returns {boolean} True if input has syntax structural features.
 */
export const localValidateCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  if (trimmed.length < 5) return false;

  const indicators = [
    '{', '}', ';', '(', ')', 'def ', 'function', 'class ', 'import ', 'require(',
    'let ', 'const ', 'var ', 'return', 'select ', 'from ', 'insert ', 'update ',
    'delete ', 'where ', 'public ', 'private ', 'void ', 'int ', 'double ', 'float ',
    '#include', 'print(', 'console.log', 'system.out', 'def ', 'elif ', 'lambda'
  ];
  return indicators.some(ind => trimmed.toLowerCase().includes(ind));
};

/**
 * Offline-ready breakdown to map structured outputs if AI is unavailable.
 * @param {string} code
 * @param {string} level
 * @returns {object} Structured explanation object.
 */
export const fallbackExplainCode = (code, level = 'beginner') => {
  const isValid = localValidateCode(code);
  if (!isValid) {
    return {
      isValid: false,
      invalidReason: 'The provided input does not appear to be valid source code.',
      purpose: 'N/A',
      workflow: [],
      logic: 'N/A',
      inputs: [],
      outputs: [],
      complexity: { time: 'N/A', space: 'N/A' }
    };
  }

  let lang = 'JavaScript';
  const lower = code.toLowerCase();
  if (lower.includes('def ') || lower.includes('import pandas') || lower.includes('print(')) lang = 'Python';
  else if (lower.includes('public class') || lower.includes('system.out.print')) lang = 'Java';
  else if (lower.includes('select ') && lower.includes('from ')) lang = 'SQL';

  return {
    isValid: true,
    invalidReason: null,
    purpose: `Processes execution contexts or handles algorithmic calculations in ${lang}.`,
    workflow: [
      'Initializes variables and binds context query inputs.',
      'Performs validation checks and processing loop tasks.',
      'Resolves calculation bounds and returns final values.'
    ],
    logic: `Runs sequential processing logic in ${lang} based on configuration inputs.`,
    inputs: ['Input parameters depending on function signature.'],
    outputs: ['Returned value types defined by implementation.'],
    complexity: {
      time: 'O(N) - Linear time complexity.',
      space: 'O(1) - Constant space allocation.'
    }
  };
};

export const explainService = {
  /**
   * Explains input source code purposes, logic, workflows, inputs, outputs, and complexities.
   * Stores utilization metrics inside activity history log tables.
   * @param {number} userId - Authenticated user context.
   * @param {string} code - Target code string to break down.
   * @param {string} [level] - Educational detail level (beginner, intermediate, advanced).
   */
  async explainCode(userId, code, level = 'beginner') {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Code explanation requires a non-empty code block');
    }

    let result = null;

    try {
      const prompt = promptBuilder.buildExplanationPrompt(code, level);
      const aiResult = await aiService.executePrompt(prompt, {
        temperature: 0.2,
        maxTokens: 1000
      });

      let cleanedText = aiResult.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      result = JSON.parse(cleanedText);

      if (result.isValid === undefined) {
        result.isValid = localValidateCode(code);
      }
    } catch (error) {
      logger.warn(`Explanation Service: AI response failed. Falling back to local offline processor. Error: ${error.message}`);
      result = fallbackExplainCode(code, level);
    }

    // Centralised History Logging Integration
    try {
      await historyService.logActivity(userId, 'explanation', {
        input: code,
        output: JSON.stringify(result)
      });
    } catch (historyError) {
      logger.error('Explanation Service: Failed to persist usage to history logs:', historyError);
    }

    return result;
  }
};

export default explainService;
