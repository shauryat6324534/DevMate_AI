import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const debugService = {
  async debugCode(code, errorLogs = '') {
    const prompt = promptBuilder.buildDebuggerPrompt(code, errorLogs);
    const aiResult = await aiService.executePrompt(prompt);

    return {
      correctedCode: `// Corrected version of provided code\n${code}`,
      rootCause: 'A mock analysis identifying missing brackets or boundary conditions.',
      suggestions: ['Ensure variables are declared with appropriate scope', 'Verify return statements'],
      meta: aiResult
    };
  }
};

export default debugService;
