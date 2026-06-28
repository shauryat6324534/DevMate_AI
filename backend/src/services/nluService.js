import aiService from './aiService.js';
import promptBuilder from './promptBuilder.js';
import logger from '../utils/logger.js';

/**
 * Fallback parser using regex and string matching to parse coding requirements
 * when LLM endpoint is down or returns invalid JSON.
 * @param {string} text - User's query.
 * @returns {object} Standardized NLU Result.
 */
export const fallbackParseNLU = (text) => {
  const normalized = text.toLowerCase().trim();

  // 1. Detect Programming Language
  let language = 'JavaScript'; // default fallback
  if (normalized.includes('python')) {
    language = 'Python';
  } else if (normalized.includes('java') && !normalized.includes('javascript')) {
    language = 'Java';
  } else if (normalized.includes('sql') || normalized.includes('postgres') || normalized.includes('mysql')) {
    language = 'SQL';
  } else if (normalized.includes('c++') || normalized.includes('cpp')) {
    language = 'C++';
  } else if (normalized.includes('typescript') || normalized.includes('ts')) {
    language = 'TypeScript';
  } else if (normalized.includes('html')) {
    language = 'HTML';
  } else if (normalized.includes('css')) {
    language = 'CSS';
  }

  // 2. Detect Intent
  let intent = 'Code Generation'; // default fallback
  if (normalized.includes('api') || normalized.includes('endpoint') || normalized.includes('controller') || normalized.includes('route')) {
    intent = 'API Development';
  } else if (normalized.includes('function') || normalized.includes('method') || normalized.includes('helper')) {
    intent = 'Function Generation';
  } else if (normalized.includes('class') || normalized.includes('model') || normalized.includes('interface')) {
    intent = 'Class Generation';
  } else if (normalized.includes('script') || normalized.includes('automation')) {
    intent = 'Scripting';
  } else if (normalized.includes('query') || normalized.includes('select') || normalized.includes('insert') || normalized.includes('database')) {
    intent = 'Database Query';
  }

  // 3. Identify Code Type
  let codeType = 'script';
  if (intent === 'Function Generation') {
    codeType = 'function';
  } else if (intent === 'Class Generation') {
    codeType = 'class';
  } else if (intent === 'API Development') {
    codeType = 'module';
  }

  // 4. Extract Constraints
  const constraints = [];
  if (normalized.includes('recursion') || normalized.includes('recursive')) {
    constraints.push('Use recursion');
  }
  if (normalized.includes('loop') || normalized.includes('iterate')) {
    constraints.push('Use loops');
  }
  if (normalized.includes('exception') || normalized.includes('try catch') || normalized.includes('try-catch')) {
    constraints.push('Handle exceptions');
  }
  if (normalized.includes('non-negative') || normalized.includes('positive')) {
    constraints.push('Accept non-negative numbers only');
  }

  return {
    language,
    intent,
    constraints,
    codeType,
    source: 'fallback_parser'
  };
};

export const nluService = {
  /**
   * Process prompt using AI to extract structured context (language, intent, constraints, code type).
   * Falls back to keyword parsing on failure.
   * @param {string} prompt - User request.
   * @returns {Promise<object>} Standardized NLU Result.
   */
  async processQuery(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('NLU Service: Cannot process empty or invalid prompt');
    }

    try {
      const messages = promptBuilder.buildNLUPrompt(prompt);
      
      // Request parsing from AI Service
      const result = await aiService.executePrompt(messages, {
        temperature: 0.1, // low temperature for structured classification
        maxTokens: 500
      });

      // Clean LLM response text (remove markdown json wrap if present)
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```')) {
        // Strip markdown backticks
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      // Parse JSON payload
      const nluData = JSON.parse(cleanedText);

      // Validate schema
      const language = nluData.language || 'JavaScript';
      const intent = nluData.intent || 'Code Generation';
      const constraints = Array.isArray(nluData.constraints) ? nluData.constraints : [];
      const codeType = nluData.codeType || 'script';

      return {
        language,
        intent,
        constraints,
        codeType,
        source: 'ai_parser',
        modelUsed: result.modelUsed
      };
    } catch (error) {
      logger.warn(`NLU Service: AI parsing failed or timed out. Falling back to rule-based parser. Error: ${error.message}`);
      return fallbackParseNLU(prompt);
    }
  }
};

export default nluService;
