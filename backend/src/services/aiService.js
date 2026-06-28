import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Custom error class representing failure states in the AI Service layer.
 */
export class AIError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'AIError';
    this.statusCode = statusCode || 500;
    this.details = details;
  }
}

/**
 * Delay execution for a given duration.
 * @param {number} ms - Milliseconds to sleep.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute raw completion request to OpenRouter API endpoint.
 * @param {Array<object>} messages - Message array matching role/content schema.
 * @param {string} model - OpenRouter model identifier.
 * @param {object} options - Custom parameters (temperature, maxTokens, timeout).
 */
async function callOpenRouterModel(messages, model, options = {}) {
  const { openRouterApiKey, openRouterBaseUrl } = config.ai;
  const timeoutMs = options.timeout || 30000;

  if (!openRouterApiKey) {
    throw new AIError('OpenRouter API key is missing. Please configure OPENROUTER_API_KEY in .env', 401);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'DevMate AI'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options.extraParams
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = '';
      try {
        errText = await response.text();
      } catch (_) {}

      throw new AIError(
        `OpenRouter API returned status ${response.status}`,
        response.status,
        { status: response.status, statusText: response.statusText, responseBody: errText }
      );
    }

    const data = await response.json();
    if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new AIError('Invalid response format from OpenRouter API', 502, { rawResponse: data });
    }

    return {
      text: data.choices[0].message.content,
      modelUsed: model,
      provider: 'OpenRouter',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new AIError(`Request to model ${model} timed out after ${timeoutMs}ms`, 408, { model, timeoutMs });
    }
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(`Failed to connect to OpenRouter: ${error.message}`, 500, { originalError: error.message });
  }
}

export const aiService = {
  /**
   * Execute formatted prompt against AI models (OpenRouter integration) with failover and retry logic.
   * Supports both prompt string and messages array.
   */
  async executePrompt(promptOrMessages, options = {}) {
    const { primaryModel, fallbackModel, maxRetries } = config.ai;

    // Parse input to standard messages format
    let messages = [];
    if (typeof promptOrMessages === 'string') {
      messages = [{ role: 'user', content: promptOrMessages }];
    } else if (Array.isArray(promptOrMessages)) {
      messages = promptOrMessages;
    } else {
      throw new AIError('Invalid prompt format. Must be string or messages array.', 400);
    }

    const modelsToTry = [
      { name: primaryModel, label: 'Primary' },
      { name: fallbackModel, label: 'Fallback' }
    ];

    let lastError = null;

    for (const modelConfig of modelsToTry) {
      const modelName = modelConfig.name;
      const isFallback = modelConfig.label === 'Fallback';

      logger.info(`AI Service: Attempting prompt with ${modelConfig.label} model: ${modelName}`);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await callOpenRouterModel(messages, modelName, options);

          if (attempt > 1) {
            logger.info(`AI Service: Successfully resolved prompt on attempt ${attempt} using ${modelName}`);
          }
          return result;
        } catch (error) {
          lastError = error;

          logger.warn(`AI Service: Attempt ${attempt}/${maxRetries} failed for model ${modelName}. Error: ${error.message}`);

          // Abort entirely on fatal authorization errors (401/403)
          if (error instanceof AIError && [401, 403].includes(error.statusCode)) {
            logger.error(`AI Service: Fatal authorization error (${error.statusCode}): ${error.message}. Aborting all attempts.`);
            throw error;
          }

          // Check if error is retryable
          const isRetryable = this.isRetryableError(error);

          if (!isRetryable) {
            logger.warn(`AI Service: Encountered non-retryable error: ${error.message}. Aborting retries for ${modelName}.`);
            break;
          }

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            logger.info(`AI Service: Retrying in ${delay}ms...`);
            await sleep(delay);
          }
        }
      }

      if (!isFallback) {
        logger.warn(`AI Service: Primary model ${modelName} failed all ${maxRetries} attempts. Initiating failover to fallback...`);
      }
    }

    logger.error('AI Service: All attempted models failed to resolve the request.', lastError);
    throw new AIError(
      `AI Service failure: ${lastError?.message || 'Unknown error'}`,
      lastError?.statusCode || 500,
      {
        primaryModel,
        fallbackModel,
        attemptsPerModel: maxRetries,
        details: lastError?.details
      }
    );
  },

  /**
   * Determine whether an error should trigger a retry attempt.
   * @param {Error} error
   */
  isRetryableError(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error instanceof AIError) {
      return retryableStatuses.includes(error.statusCode);
    }
    return true;
  }
};

export default aiService;
