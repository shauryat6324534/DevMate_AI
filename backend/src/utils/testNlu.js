import { nluService, fallbackParseNLU } from '../services/nluService.js';
import { codeGenerationService } from '../services/codeGenerationService.js';
import { generateCodeController } from '../controllers/generateCodeController.js';
import aiService from '../services/aiService.js';
import logger from './logger.js';

const mockResponse = () => {
  const res = {};
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.jsonData = data;
    return this;
  };
  return res;
};

const originalExecute = aiService.executePrompt;

function mockAIResponses(nluResultText, codeGenResultText) {
  aiService.executePrompt = async (messages, options = {}) => {
    // Detect if this is NLU prompt (contains Analyze request)
    const isNlu = messages.some(m => m.content && m.content.includes('Analyze request'));
    
    if (isNlu) {
      return {
        text: nluResultText,
        modelUsed: 'mock-nlu-model',
        provider: 'OpenRouter',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        text: codeGenResultText,
        modelUsed: 'mock-codegen-model',
        provider: 'OpenRouter',
        timestamp: new Date().toISOString()
      };
    }
  };
}

function restoreAI() {
  aiService.executePrompt = originalExecute;
}

async function runTests() {
  logger.info('==================================================');
  logger.info('Starting NLU & Code Generation Integration Audit...');
  logger.info('==================================================');

  // Test 1: Python query parsing & generation
  logger.info('\nTest 1: Python Query Parsing & Generation...');
  mockAIResponses(
    JSON.stringify({
      language: 'Python',
      intent: 'Function Generation',
      constraints: ['recursion', 'positive inputs only'],
      codeType: 'function'
    }),
    'def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)'
  );

  try {
    const prompt = 'Create factorial function in Python using recursion';
    const nluResult = await nluService.processQuery(prompt);
    
    if (nluResult.language !== 'Python' || nluResult.intent !== 'Function Generation') {
      throw new Error(`NLU classification mismatch: ${JSON.stringify(nluResult)}`);
    }
    
    const genResult = await codeGenerationService.generateCode(prompt, nluResult, 1);
    
    if (genResult.generatedCode.includes('def factorial') && genResult.language === 'Python') {
      logger.info('Test 1 Passed: Successfully processed Python function requirements and generated code.');
    } else {
      throw new Error(`Generation details mismatch: ${JSON.stringify(genResult)}`);
    }
  } finally {
    restoreAI();
  }

  // Test 2: Java query parsing & generation
  logger.info('\nTest 2: Java Query Parsing & Generation...');
  mockAIResponses(
    JSON.stringify({
      language: 'Java',
      intent: 'Class Generation',
      constraints: ['encapsulation', 'override toString'],
      codeType: 'class'
    }),
    'public class User {\n    private String name;\n    public User(String name) { this.name = name; }\n}'
  );

  try {
    const prompt = 'Create class User in Java with encapsulation';
    const nluResult = await nluService.processQuery(prompt);
    
    if (nluResult.language !== 'Java' || nluResult.intent !== 'Class Generation') {
      throw new Error(`NLU classification mismatch: ${JSON.stringify(nluResult)}`);
    }
    
    const genResult = await codeGenerationService.generateCode(prompt, nluResult, 1);
    
    if (genResult.generatedCode.includes('public class User') && genResult.language === 'Java') {
      logger.info('Test 2 Passed: Successfully processed Java class requirements and generated code.');
    } else {
      throw new Error(`Generation details mismatch: ${JSON.stringify(genResult)}`);
    }
  } finally {
    restoreAI();
  }

  // Test 3: JavaScript query parsing & generation
  logger.info('\nTest 3: JavaScript Query Parsing & Generation...');
  mockAIResponses(
    JSON.stringify({
      language: 'JavaScript',
      intent: 'API Development',
      constraints: ['express framework', 'JSON response'],
      codeType: 'module'
    }),
    'import express from "express";\nconst router = express.Router();\nrouter.post("/login", (req, res) => res.json({ success: true }));'
  );

  try {
    const prompt = 'Create login API in Express';
    const nluResult = await nluService.processQuery(prompt);
    
    if (nluResult.language !== 'JavaScript' || nluResult.intent !== 'API Development') {
      throw new Error(`NLU classification mismatch: ${JSON.stringify(nluResult)}`);
    }
    
    const genResult = await codeGenerationService.generateCode(prompt, nluResult, 1);
    
    if (genResult.generatedCode.includes('express') && genResult.language === 'JavaScript') {
      logger.info('Test 3 Passed: Successfully processed JavaScript API requirements and generated code.');
    } else {
      throw new Error(`Generation details mismatch: ${JSON.stringify(genResult)}`);
    }
  } finally {
    restoreAI();
  }

  // Test 4: SQL query parsing & generation
  logger.info('\nTest 4: SQL Query Parsing & Generation...');
  mockAIResponses(
    JSON.stringify({
      language: 'SQL',
      intent: 'Database Query',
      constraints: ['select statement', 'where condition'],
      codeType: 'script'
    }),
    'SELECT * FROM users WHERE status = "active";'
  );

  try {
    const prompt = 'Select all active users in SQL';
    const nluResult = await nluService.processQuery(prompt);
    
    if (nluResult.language !== 'SQL' || nluResult.intent !== 'Database Query') {
      throw new Error(`NLU classification mismatch: ${JSON.stringify(nluResult)}`);
    }
    
    const genResult = await codeGenerationService.generateCode(prompt, nluResult, 1);
    
    if (genResult.generatedCode.includes('SELECT') && genResult.language === 'SQL') {
      logger.info('Test 4 Passed: Successfully processed SQL query requirements and generated code.');
    } else {
      throw new Error(`Generation details mismatch: ${JSON.stringify(genResult)}`);
    }
  } finally {
    restoreAI();
  }

  // Test 5: Input Validation & Empty prompt error handling
  logger.info('\nTest 5: Empty Prompt Controller rejection check...');
  const badReq = { body: { prompt: '' }, user: { id: 1 } };
  const badRes = mockResponse();
  let nextCalledWith = null;

  await generateCodeController.generate(badReq, badRes, (err) => {
    nextCalledWith = err;
  });

  if (nextCalledWith && nextCalledWith.statusCode === 400 && nextCalledWith.message.includes('required')) {
    logger.info('Test 5 Passed: Empty prompt correctly intercepted and rejected with status 400.');
  } else {
    throw new Error(`Test 5 Failed: Empty prompt was not rejected correctly. Error: ${nextCalledWith?.message}`);
  }

  // Test 6: Resiliency and fallback classification when LLM is down
  logger.info('\nTest 6: Fallback keyword classification fallback when AI fails...');
  aiService.executePrompt = async () => {
    throw new Error('OpenRouter endpoint rate-limit exceeded or connection timeout');
  };

  try {
    const prompt = 'create recursive factorial function in python';
    const nluResult = await nluService.processQuery(prompt);
    
    if (
      nluResult.language === 'Python' &&
      nluResult.intent === 'Function Generation' &&
      nluResult.constraints.includes('Use recursion') &&
      nluResult.source === 'fallback_parser'
    ) {
      logger.info('Test 6 Passed: Gracefully fell back to keyword NLU extractor under AI error conditions.');
    } else {
      throw new Error(`Test 6 Failed: Fallback parser returned invalid results: ${JSON.stringify(nluResult)}`);
    }
  } finally {
    restoreAI();
  }
}

runTests()
  .then(() => {
    logger.info('\n==================================================');
    logger.info('NLU & Code Gen verification tests completed successfully!');
    logger.info('==================================================');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\nNLU & Code Gen verification tests encountered errors:', error);
    process.exit(1);
  });
