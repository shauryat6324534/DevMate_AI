/**
 * Prompt Builder utility to structure system context and parameters
 * into structured prompts for the AI Service layer.
 */
export const promptBuilder = {
  buildCodeGenerationPrompt(description, language, constraints = []) {
    return `Generate production-ready code based on description: "${description}" in language: "${language}". Constraints: ${constraints.join(', ') || 'none'}`;
  },

  buildExplanationPrompt(code, level = 'beginner') {
    return `Analyze and break down the following code. Explain it at a ${level} level: \n${code}`;
  },

  buildDebuggerPrompt(code, errorLogs = '') {
    return `Analyze the following code for syntax and logical errors. Context error logs: "${errorLogs}". \nCode:\n${code}`;
  },

  buildOptimizationPrompt(code) {
    return `Identify performance, memory, and readability optimization spots for the following code:\n${code}`;
  },

  buildDocumentationPrompt(code, format = 'markdown') {
    return `Generate clean, robust documentation formatted in ${format} for this codebase:\n${code}`;
  },

  buildReviewPrompt(code) {
    return `Perform a detailed code review verifying styling conventions, naming guidelines, and design patterns on:\n${code}`;
  },

  buildLearningPrompt(concept) {
    return `Produce explanations, exercises, and a study workflow path for teaching the programming concept: "${concept}"`;
  }
};

export default promptBuilder;
