import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const learningService = {
  async explainConcept(concept) {
    const prompt = promptBuilder.buildLearningPrompt(concept);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      conceptName: concept,
      explanation: `This is a mock concept breakdown explaining the principles of: "${concept}".`,
      exercises: [
        { id: 1, text: 'Write a basic example demonstrating this pattern' }
      ],
      meta: aiResult
    };
  }
};

export default learningService;
