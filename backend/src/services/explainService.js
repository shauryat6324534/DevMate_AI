import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const explainService = {
  async explainCode(code, level = 'beginner') {
    const prompt = promptBuilder.buildExplanationPrompt(code, level);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      explanation: `This is a mock code explanation at a ${level} level showing how the logic executes step-by-step.`,
      meta: aiResult
    };
  }
};

export default explainService;
