import logger from '../utils/logger.js';
import config from '../config/config.js';

export const aiService = {
  /**
   * Execute formatted prompt against AI models (OpenRouter integration).
   * Mock response for Sprint 1.
   */
  async executePrompt(prompt, model = 'qwen/qwen3-coder:free') {
    logger.info(`AI Service: Dispatching prompt. Target Model: ${model}`);
    
    // In future sprints, this will call the OpenRouter API.
    return {
      text: `[Sprint 1 Mock AI Output] Received prompt: "${prompt.substring(0, 60)}..."`,
      modelUsed: model,
      provider: 'OpenRouter',
      timestamp: new Date().toISOString()
    };
  }
};

export default aiService;
