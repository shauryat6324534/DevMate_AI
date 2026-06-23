import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const docService = {
  async generateDocumentation(code, format = 'markdown') {
    const prompt = promptBuilder.buildDocumentationPrompt(code, format);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      documentation: `# Module Documentation\n\n## Description\nGenerated documentation details in ${format}.\n\n### Methods\n- \`executeWorkflow\`: main execution route.`,
      meta: aiResult
    };
  }
};

export default docService;
