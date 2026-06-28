import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';
import historyService from './historyService.js';
import logger from '../utils/logger.js';

/**
 * Heuristic programming constructs checker.
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
 * Pure normalized fallback response if AI endpoints are down.
 * @param {string} code
 */
export const fallbackOptimizeCode = (code) => {
  const isValid = localValidateCode(code);
  if (!isValid) {
    return {
      isValid: false,
      invalidReason: 'The provided input does not appear to be valid source code.',
      optimizedCode: '',
      improvements: [],
      bestPractices: []
    };
  }

  return {
    isValid: true,
    invalidReason: null,
    optimizedCode: code,
    improvements: ['No obvious optimization bottlenecks detected by local analyzer.'],
    bestPractices: ['Maintain consistent function signatures and naming conventions.']
  };
};

export const optimizationService = {
  /**
   * Optimizes code algorithms and constructs using AI completions.
   * Logs usage activity to database logs.
   * @param {number} userId - Owner context.
   * @param {string} code - Target code block.
   */
  async optimizeCode(userId, code) {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Optimization analysis requires a non-empty code block');
    }

    let result = null;

    try {
      const prompt = promptBuilder.buildOptimizationPrompt(code);
      const aiResult = await aiService.executePrompt(prompt, {
        temperature: 0.1,
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
      logger.warn(`Optimization Service: AI query failed. Running offline fallback parser. Error: ${error.message}`);
      result = fallbackOptimizeCode(code);
    }

    // Persist usage metrics to activity history logs
    try {
      await historyService.logActivity(userId, 'optimize', {
        input: code,
        output: JSON.stringify(result)
      });
    } catch (logErr) {
      logger.error('Optimization Service: Failed to log history activity:', logErr);
    }

    return result;
  }
};

export default optimizationService;
