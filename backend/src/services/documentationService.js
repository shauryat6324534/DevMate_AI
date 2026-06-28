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
 * Safely parses the JSON output from the AI.
 * If validation fails or parses improperly, falls back gracefully.
 */
const parseAiOutput = (text, defaultFallback) => {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn('Documentation Service: Failed to parse JSON response. Falling back to default format.');
    return defaultFallback;
  }
};

export const documentationService = {
  /**
   * Generates a project README markdown template.
   */
  async generateReadme(userId, code) {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Documentation generation requires a non-empty code block');
    }

    let result;
    const isValid = localValidateCode(code);

    if (!isValid) {
      result = {
        isValid: false,
        invalidReason: 'The provided input does not appear to be valid source code.',
        readme: ''
      };
    } else {
      try {
        const prompt = promptBuilder.buildReadmePrompt(code);
        const aiResult = await aiService.executePrompt(prompt, { temperature: 0.1 });
        result = parseAiOutput(aiResult.text, {
          isValid: true,
          invalidReason: null,
          readme: `# Project Overview\n\nGenerated overview for the module.\n\n## Tech Stack\n- Node.js\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\``
        });
      } catch (err) {
        logger.error('Documentation Service: Readme generation prompt failed:', err);
        result = {
          isValid: true,
          invalidReason: null,
          readme: `# Project Overview\n\nOffline Fallback: Generated overview for the module.\n\n## Tech Stack\n- Node.js\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\``
        };
      }
    }

    // Persist to history logs
    await historyService.logActivity(userId, 'readme', {
      input: code,
      output: JSON.stringify(result)
    });

    return result;
  },

  /**
   * Generates parameters, return values, and descriptions for code functions.
   */
  async generateFunctionDocs(userId, code) {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Documentation generation requires a non-empty code block');
    }

    let result;
    const isValid = localValidateCode(code);

    if (!isValid) {
      result = {
        isValid: false,
        invalidReason: 'The provided input does not appear to be valid source code.',
        functionDocs: ''
      };
    } else {
      try {
        const prompt = promptBuilder.buildFunctionDocsPrompt(code);
        const aiResult = await aiService.executePrompt(prompt, { temperature: 0.1 });
        result = parseAiOutput(aiResult.text, {
          isValid: true,
          invalidReason: null,
          functionDocs: `### Function Description\nGenerates execution details.\n\n#### Parameters\n- None\n\n#### Return Values\n- Success status boolean`
        });
      } catch (err) {
        logger.error('Documentation Service: Function docs prompt failed:', err);
        result = {
          isValid: true,
          invalidReason: null,
          functionDocs: `### Function Description\nOffline Fallback: Generates execution details.\n\n#### Parameters\n- None\n\n#### Return Values\n- Success status boolean`
        };
      }
    }

    // Persist to history logs
    await historyService.logActivity(userId, 'function-docs', {
      input: code,
      output: JSON.stringify(result)
    });

    return result;
  },

  /**
   * Generates endpoints, request bodies, and response structures details.
   */
  async generateApiDocs(userId, code) {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Documentation generation requires a non-empty code block');
    }

    let result;
    const isValid = localValidateCode(code);

    if (!isValid) {
      result = {
        isValid: false,
        invalidReason: 'The provided input does not appear to be valid source code.',
        apiDocs: ''
      };
    } else {
      try {
        const prompt = promptBuilder.buildApiDocsPrompt(code);
        const aiResult = await aiService.executePrompt(prompt, { temperature: 0.1 });
        result = parseAiOutput(aiResult.text, {
          isValid: true,
          invalidReason: null,
          apiDocs: `### API Endpoint Details\n- \`POST /api/v1/resource\`\n\n#### Request Body\n- Code inputs parameters\n\n#### Response Structure\n- Success JSON response payload`
        });
      } catch (err) {
        logger.error('Documentation Service: API docs prompt failed:', err);
        result = {
          isValid: true,
          invalidReason: null,
          apiDocs: `### API Endpoint Details\n- \`POST /api/v1/resource\`\n\n#### Request Body\n- Offline Fallback: Code inputs parameters\n\n#### Response Structure\n- Success JSON response payload`
        };
      }
    }

    // Persist to history logs
    await historyService.logActivity(userId, 'api-docs', {
      input: code,
      output: JSON.stringify(result)
    });

    return result;
  },

  /**
   * Adds inline descriptive commentary lines inside source code blocks.
   */
  async generateComments(userId, code) {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Documentation generation requires a non-empty code block');
    }

    let result;
    const isValid = localValidateCode(code);

    if (!isValid) {
      result = {
        isValid: false,
        invalidReason: 'The provided input does not appear to be valid source code.',
        commentedCode: ''
      };
    } else {
      try {
        const prompt = promptBuilder.buildCommentsPrompt(code);
        const aiResult = await aiService.executePrompt(prompt, { temperature: 0.1 });
        result = parseAiOutput(aiResult.text, {
          isValid: true,
          invalidReason: null,
          commentedCode: `// Offline Fallback: execution block\n${code}`
        });
      } catch (err) {
        logger.error('Documentation Service: Comments prompt failed:', err);
        result = {
          isValid: true,
          invalidReason: null,
          commentedCode: `// Offline Fallback: execution block\n${code}`
        };
      }
    }

    // Persist to history logs
    await historyService.logActivity(userId, 'comments', {
      input: code,
      output: JSON.stringify(result)
    });

    return result;
  }
};

export default documentationService;
