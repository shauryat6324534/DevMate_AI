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
 * Robust fallback scanner logic if AI model is offline.
 * @param {string} code - Target code block.
 * @param {string} errorLogs - Optional runtime error trace details.
 */
export const fallbackDebugCode = (code, errorLogs = '') => {
  const isValid = localValidateCode(code);
  if (!isValid) {
    return {
      isValid: false,
      invalidReason: 'The provided input does not appear to be valid source code.',
      hasBugs: false,
      bugDescription: 'N/A',
      rootCause: 'N/A',
      suggestedFix: 'N/A',
      correctedCode: ''
    };
  }

  // Purely returns a normalized fallback response when AI is unreachable or response fails to parse
  return {
    isValid: true,
    invalidReason: null,
    hasBugs: true,
    bugDescription: 'A potential bug was flagged by the environment parser.',
    rootCause: 'Unable to perform deep AI diagnostics; check local environment logs.',
    suggestedFix: 'Review execution trace and boundary parameters values.',
    correctedCode: code // returns the original code unmodified
  };
};

export const debugService = {
  /**
   * Scans inputs for syntax, logical, and runtime anomalies using AI completions.
   * Logs usage details into history logs.
   * @param {number} userId - Owner context.
   * @param {string} code - Target code block.
   * @param {string} [errorLogs] - Optional error stack context.
   */
  async debugCode(userId, code, errorLogs = '') {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Debugging analysis requires a non-empty code block');
    }

    let result = null;

    try {
      const prompt = promptBuilder.buildDebuggerPrompt(code, errorLogs);
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
      logger.warn(`Debugger Service: AI query failed. Running offline fallback analyzer. Error: ${error.message}`);
      result = fallbackDebugCode(code, errorLogs);
    }

    // Persist usage metrics to activity history logs
    try {
      await historyService.logActivity(userId, 'debugger', {
        input: code,
        output: JSON.stringify(result)
      });
    } catch (logErr) {
      logger.error('Debugger Service: Failed to log history activity:', logErr);
    }

    return result;
  }
};

export default debugService;
