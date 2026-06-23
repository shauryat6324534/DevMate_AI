import promptBuilder from './promptBuilder.js';
import aiService from './aiService.js';

export const codeService = {
  async generateCode(description, language, constraints = []) {
    const prompt = promptBuilder.buildCodeGenerationPrompt(description, language, constraints);
    const aiResult = await aiService.executePrompt(prompt);
    
    return {
      generatedCode: `// Generated for: ${description}\nfunction devMateHelper() {\n  console.log("Ready to assist in ${language}");\n}`,
      meta: aiResult
    };
  }
};

export default codeService;
