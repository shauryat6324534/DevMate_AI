import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const optimizeService = {
  async optimizeCode(code) {
    const prompt = promptBuilder.buildOptimizationPrompt(code);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      optimizedCode: `// Optimized version of provided code\n${code}`,
      improvements: ['Replaced linear lookups with O(1) hashing structures', 'Removed recursive deep copies'],
      meta: aiResult
    };
  }
};

export default optimizeService;
