import { aiService, AIError } from '../services/aiService.js';
import config from '../config/config.js';
import logger from './logger.js';

const originalFetch = global.fetch;

function restoreFetch() {
  global.fetch = originalFetch;
}

function mockFetch(responses) {
  let callCount = 0;
  global.fetch = async (url, options) => {
    const callIndex = callCount++;
    const currentResponse = responses[callIndex];
    if (!currentResponse) {
      throw new Error(`Mock Fetch: Unexpected fetch call at index ${callIndex}`);
    }

    const requestBody = JSON.parse(options.body);

    if (currentResponse.onRequest) {
      currentResponse.onRequest({ url, options, body: requestBody, callIndex });
    }

    if (currentResponse.networkError) {
      throw new Error(currentResponse.networkError);
    }

    if (currentResponse.timeout) {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      throw err;
    }

    return {
      ok: currentResponse.status >= 200 && currentResponse.status < 300,
      status: currentResponse.status,
      statusText: currentResponse.statusText || 'OK',
      text: async () => currentResponse.bodyText || '',
      json: async () => currentResponse.bodyJson || {}
    };
  };

  return {
    getCallCount: () => callCount
  };
}

async function runTests() {
  logger.info('==================================================');
  logger.info('Starting AI Service Layer Verification Audit...');
  logger.info('==================================================');

  // Test 1: Successful AI request (Mocked)
  logger.info('\n--- Test 1: Verify successful AI request parsing ---');
  const mockSuccessResponse = {
    status: 200,
    bodyJson: {
      id: 'gen-mock-1',
      choices: [{ message: { role: 'assistant', content: 'Test 1 Content Success' } }]
    },
    onRequest: ({ body }) => {
      logger.info(`Mock Request sent to model: ${body.model}`);
    }
  };

  const tracker1 = mockFetch([mockSuccessResponse]);
  try {
    const result = await aiService.executePrompt('Explain JS promises');
    if (result.text === 'Test 1 Content Success' && result.modelUsed === config.ai.primaryModel) {
      logger.info('Test 1 Passed: Response successfully decoded and matched standard schema.');
    } else {
      throw new Error(`Test 1 Failed: Unexpected result: ${JSON.stringify(result)}`);
    }
  } finally {
    restoreFetch();
  }

  // Test 2: Retry mechanism on temporary failure (Mocked)
  logger.info('\n--- Test 2: Verify retry logic with temporary errors ---');
  const responses2 = [
    { status: 429, bodyText: 'Rate Limited' },
    { status: 500, bodyText: 'Server Error' },
    {
      status: 200,
      bodyJson: {
        choices: [{ message: { role: 'assistant', content: 'Test 2 Content Success after retries' } }]
      }
    }
  ];

  const tracker2 = mockFetch(responses2);
  try {
    // Override maxRetries to avoid long wait during test execution
    const originalMaxRetries = config.ai.maxRetries;
    config.ai.maxRetries = 3;

    const result = await aiService.executePrompt('Hello world');
    const totalCalls = tracker2.getCallCount();

    if (totalCalls === 3 && result.text === 'Test 2 Content Success after retries') {
      logger.info('Test 2 Passed: Retried through 429 and 500 before successfully recovering.');
    } else {
      throw new Error(`Test 2 Failed: Expected 3 calls, got ${totalCalls}. Result: ${JSON.stringify(result)}`);
    }
  } finally {
    restoreFetch();
  }

  // Test 3: Non-retryable error (Mocked)
  logger.info('\n--- Test 3: Verify non-retryable errors stop immediately ---');
  const mock401Response = { status: 401, bodyText: 'Unauthorized: Invalid API Key' };
  const tracker3 = mockFetch([mock401Response, { status: 200, bodyJson: {} }]); // Mock 2nd call just in case it doesn't stop

  try {
    await aiService.executePrompt('This should fail immediately');
    throw new Error('Test 3 Failed: executePrompt should have thrown an AIError.');
  } catch (error) {
    const totalCalls = tracker3.getCallCount();
    if (error instanceof AIError && error.statusCode === 401 && totalCalls === 1) {
      logger.info('Test 3 Passed: Non-retryable 401 aborted retries immediately as expected.');
    } else {
      throw new Error(`Test 3 Failed: Unexpected error type or retry count. Calls: ${totalCalls}, Error: ${error.message}`);
    }
  } finally {
    restoreFetch();
  }

  // Test 4: Model failover mechanism (Mocked)
  logger.info('\n--- Test 4: Verify model failover (Primary -> Fallback) ---');
  // Primary model fails all 3 retries (502 bad gateway)
  // Fallback model succeeds on its 1st try
  const responses4 = [
    // Primary attempts
    { status: 502, bodyText: 'Primary fail 1', onRequest: ({ body }) => logger.info(`Attempt with model: ${body.model}`) },
    { status: 502, bodyText: 'Primary fail 2', onRequest: ({ body }) => logger.info(`Attempt with model: ${body.model}`) },
    { status: 502, bodyText: 'Primary fail 3', onRequest: ({ body }) => logger.info(`Attempt with model: ${body.model}`) },
    // Fallback attempt
    {
      status: 200,
      bodyJson: {
        choices: [{ message: { role: 'assistant', content: 'Fallback response content' } }]
      },
      onRequest: ({ body }) => logger.info(`Attempt with model: ${body.model}`)
    }
  ];

  const tracker4 = mockFetch(responses4);
  try {
    const result = await aiService.executePrompt('Write a sorting algorithm');
    const totalCalls = tracker4.getCallCount();

    if (totalCalls === 4 && result.modelUsed === config.ai.fallbackModel && result.text === 'Fallback response content') {
      logger.info('Test 4 Passed: Primary failed 3 times, successfully rolled over to Fallback model.');
    } else {
      throw new Error(`Test 4 Failed: Expected 4 calls, got ${totalCalls}. Model used: ${result?.modelUsed}`);
    }
  } finally {
    restoreFetch();
  }

  // Test 5: Timeout handling (Mocked)
  logger.info('\n--- Test 5: Verify timeout handling triggers retry ---');
  const responses5 = [
    { timeout: true, onRequest: () => logger.info('Simulated request timeout (AbortError)') },
    {
      status: 200,
      bodyJson: {
        choices: [{ message: { role: 'assistant', content: 'Success after timeout retry' } }]
      }
    }
  ];

  const tracker5 = mockFetch(responses5);
  try {
    const result = await aiService.executePrompt('Short prompt', { timeout: 100 }); // short timeout
    const totalCalls = tracker5.getCallCount();

    if (totalCalls === 2 && result.text === 'Success after timeout retry') {
      logger.info('Test 5 Passed: Timeout successfully caught, request retried, and completed.');
    } else {
      throw new Error(`Test 5 Failed: Expected 2 calls, got ${totalCalls}. Result: ${JSON.stringify(result)}`);
    }
  } finally {
    restoreFetch();
  }

  // Test 6: Live connectivity test (if API Key is not standard mock/empty)
  logger.info('\n--- Test 6: Live connectivity check ---');
  const apiKey = config.ai.openRouterApiKey;
  if (!apiKey || apiKey === 'mock_key_for_sprint_1' || apiKey.includes('your_openrouter_api_key')) {
    logger.info('Skipping Live Connection Test: No production OpenRouter API key found in .env.');
    logger.info('Test 6 Passed (Skipped successfully).');
  } else {
    logger.info(`Starting live connection request to OpenRouter using Primary Model: ${config.ai.primaryModel}...`);
    try {
      const result = await aiService.executePrompt('Respond with "DEV_MATE_ONLINE" only.', {
        temperature: 0.1,
        maxTokens: 50
      });
      logger.info(`Live response received: "${result.text}"`);
      logger.info(`Live model resolved: ${result.modelUsed}`);
      logger.info('Test 6 Passed: End-to-end OpenRouter live integration check completed successfully.');
    } catch (error) {
      logger.error('Test 6 Failed: Live connection to OpenRouter encountered error:', error);
      throw error;
    }
  }
}

runTests()
  .then(() => {
    logger.info('\n==================================================');
    logger.info('AI Service verification tests completed successfully!');
    logger.info('==================================================');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\nAI Service verification tests encountered errors:', error);
    process.exit(1);
  });
