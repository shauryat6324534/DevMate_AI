/**
 * Prompt Builder utility to structure system context and parameters
 * into structured message payloads for the AI Service layer.
 */
export const promptBuilder = {
  buildNLUPrompt(prompt) {
    return [
      {
        role: 'system',
        content: 'Analyze the user\'s coding assistant request. Categorize and extract the parameters into a JSON object with keys: "language", "intent" (e.g. Function Generation, Class Generation, API Development, Scripting, Database Query), "constraints" (list of rule strings, default empty array), and "codeType" (one of: "function", "class", "module", "script"). Return ONLY valid raw JSON.'
      },
      {
        role: 'user',
        content: `Analyze request: "${prompt}"`
      }
    ];
  },

  buildStructuredCodeGenerationPrompt(prompt, nluResult) {
    const { language, intent, constraints, codeType } = nluResult;
    const constraintsStr = constraints && constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '- none';
    return [
      {
        role: 'system',
        content: `You are DevMate AI, a professional code generator. Output ONLY clean, production-ready, correctly commented code in ${language}. Ensure the structural block matches code type "${codeType}" and fits the intent "${intent}". Do not write any explanations or text around the code block.`
      },
      {
        role: 'user',
        content: `Generate ${language} code for: "${prompt}".\nConstraints:\n${constraintsStr}`
      }
    ];
  },

  buildCodeGenerationPrompt(description, language, constraints = []) {
    return [
      {
        role: 'system',
        content: 'You are DevMate AI, a production-grade code generator. Output only the requested code within markdown blocks with minimal explanation, adhering strictly to constraints.'
      },
      {
        role: 'user',
        content: `Generate code based on description: "${description}" in language: "${language}". Constraints: ${constraints.join(', ') || 'none'}`
      }
    ];
  },

  buildExplanationPrompt(code, level = 'beginner') {
    return [
      {
        role: 'system',
        content: `You are DevMate AI, an expert programming instructor. Your task is to analyze the provided source code, verify if it is valid program code, and explain it in beginner-friendly language at a ${level} level.
You MUST output ONLY a valid JSON object matching the following structure (no markdown wrapping, no extra conversational text, just raw JSON):
{
  "isValid": true,
  "invalidReason": null,
  "purpose": "A high-level description of what the code achieves",
  "workflow": ["Step 1 of execution...", "Step 2 of execution..."],
  "logic": "Detailed breakdown of the algorithm and internal logic flow",
  "inputs": ["Parameter details, types, and descriptions"],
  "outputs": ["Returned value types and descriptions"],
  "complexity": {
    "time": "O(...) - description",
    "space": "O(...) - description"
  }
}
If the input is not valid programming code (e.g. plain English text, random characters, or severe syntax errors), return:
{
  "isValid": false,
  "invalidReason": "Description of why the input is invalid",
  "purpose": "N/A",
  "workflow": [],
  "logic": "N/A",
  "inputs": [],
  "outputs": [],
  "complexity": {
    "time": "N/A",
    "space": "N/A"
  }
}`
      },
      {
        role: 'user',
        content: `Analyze and explain the following code:\n\`\`\`\n${code}\n\`\`\``
      }
    ];
  },

  buildDebuggerPrompt(code, errorLogs = '') {
    return [
      {
        role: 'system',
        content: `You are DevMate AI, a precise debugging assistant. Analyze the provided code and optional error logs for syntax errors, logical bugs, runtime risks, or common mistakes.
You MUST output ONLY a valid JSON object matching the following structure (no markdown wrapping, no extra conversational text, just raw JSON):
{
  "isValid": true,
  "invalidReason": null,
  "hasBugs": true,
  "bugDescription": "A concise description of the bugs identified in the code",
  "rootCause": "Detailed root cause analysis explaining why the bugs happen",
  "suggestedFix": "Step-by-step description of how to fix the bugs",
  "correctedCode": "The complete, corrected source code with the bugs resolved. If isValid is false or hasBugs is false, output the original code."
}
If the input code is not valid program code (e.g. plain text, completely unparseable gibberish), return:
{
  "isValid": false,
  "invalidReason": "Describe why the input is invalid",
  "hasBugs": false,
  "bugDescription": "N/A",
  "rootCause": "N/A",
  "suggestedFix": "N/A",
  "correctedCode": ""
}`
      },
      {
        role: 'user',
        content: `Debug the following code. Optional error context: "${errorLogs}".\n\nCode:\n\`\`\`\n${code}\n\`\`\``
      }
    ];
  },

  buildOptimizationPrompt(code) {
    return [
      {
        role: 'system',
        content: 'You are DevMate AI, a senior software engineer. Analyze the code for performance bottleneck spots, memory overhead, and readability. Recommend optimized revisions.'
      },
      {
        role: 'user',
        content: `Optimize the following code:\n\`\`\`\n${code}\n\`\`\``
      }
    ];
  },

  buildDocumentationPrompt(code, format = 'markdown') {
    return [
      {
        role: 'system',
        content: `You are DevMate AI, a technical writer. Generate clean, professional documentation in ${format} format including API details, interfaces, and inline commentary suggestions.`
      },
      {
        role: 'user',
        content: `Document this code:\n\`\`\`\n${code}\n\`\`\``
      }
    ];
  },

  buildReviewPrompt(code) {
    return [
      {
        role: 'system',
        content: 'You are DevMate AI, a code reviewer. Perform a strict quality assessment. Score naming conventions, design patterns, security concerns, and smell patterns.'
      },
      {
        role: 'user',
        content: `Review the following code:\n\`\`\`\n${code}\n\`\`\``
      }
    ];
  },

  buildLearningPrompt(concept) {
    return [
      {
        role: 'system',
        content: 'You are DevMate AI, a programming mentor. Explain coding concepts using simple real-world analogies, supply code exercises, and lay out progressive learning paths.'
      },
      {
        role: 'user',
        content: `Help me learn this concept: "${concept}"`
      }
    ];
  }
};

export default promptBuilder;
