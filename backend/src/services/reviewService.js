import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const reviewService = {
  async reviewCode(code) {
    const prompt = promptBuilder.buildReviewPrompt(code);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      qualityScore: 85,
      smells: [
        { type: 'Complex Method', line: 12, description: 'Method has a high cyclomatic complexity (15)' }
      ],
      conventions: [
        { field: 'db_host', status: 'WARN', recommendation: 'Rename using camelCase conventions (dbHost)' }
      ],
      meta: aiResult
    };
  }
};

export default reviewService;
