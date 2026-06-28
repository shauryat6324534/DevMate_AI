import { pool, query } from '../config/db.js';
import documentationController from '../controllers/documentationController.js';
import globalErrorHandler from '../middleware/errorMiddleware.js';
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

async function runTests() {
  logger.info('==================================================');
  logger.info('Starting Documentation Generator & Security Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `docs-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  try {
    const sampleCode = `function testRun(a, b) {
      return a + b;
    }`;

    // Test 1: README generation
    logger.info('Test 1: Generating project README documentation...');
    const req1 = {
      body: { code: sampleCode },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await documentationController.generateReadme(req1, res1, (err) => { if (err) throw err; });

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      if (data.isValid && data.readme) {
        logger.info('Test 1 Passed: README generation successfully formatted.');
      } else {
        throw new Error(`Test 1 Failed: Bad readme response structure: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: Function docs generation
    logger.info('Test 2: Generating function documentation details...');
    const req2 = {
      body: { code: sampleCode },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await documentationController.generateFunctionDocs(req2, res2, (err) => { if (err) throw err; });

    if (res2.statusCode === 200 && res2.jsonData.success) {
      const data = res2.jsonData.data;
      if (data.isValid && data.functionDocs) {
        logger.info('Test 2 Passed: Function documentation successfully formatted.');
      } else {
        throw new Error('Test 2 Failed: Bad functionDocs response structure.');
      }
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.statusCode}`);
    }

    // Test 3: API docs generation
    logger.info('Test 3: Generating API endpoint documentation details...');
    const req3 = {
      body: { code: sampleCode },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await documentationController.generateApiDocs(req3, res3, (err) => { if (err) throw err; });

    if (res3.statusCode === 200 && res3.jsonData.success) {
      const data = res3.jsonData.data;
      if (data.isValid && data.apiDocs) {
        logger.info('Test 3 Passed: API documentation successfully formatted.');
      } else {
        throw new Error('Test 3 Failed: Bad apiDocs response structure.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.statusCode}`);
    }

    // Test 4: Inline Comments addition
    logger.info('Test 4: Generating inline comments inside code block...');
    const req4 = {
      body: { code: sampleCode },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await documentationController.generateComments(req4, res4, (err) => { if (err) throw err; });

    if (res4.statusCode === 200 && res4.jsonData.success) {
      const data = res4.jsonData.data;
      if (data.isValid && data.commentedCode) {
        logger.info('Test 4 Passed: Inline comments successfully generated.');
      } else {
        throw new Error('Test 4 Failed: Bad commentedCode response structure.');
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.statusCode}`);
    }

    // Test 5: Invalid Input Blockages
    logger.info('Test 5: Testing invalid inputs checks...');
    const badCode = `just plain simple english text instructions`;
    const req5 = {
      body: { code: badCode },
      user: { id: userId }
    };
    const res5 = mockResponse();
    await documentationController.generateReadme(req5, res5, (err) => { if (err) throw err; });

    if (res5.statusCode === 200 && res5.jsonData.success) {
      const data = res5.jsonData.data;
      if (!data.isValid && data.invalidReason) {
        logger.info(`Test 5 Passed: Invalid input successfully handled. Reason: "${data.invalidReason}"`);
      } else {
        throw new Error(`Test 5 Failed: Expected isValid = false, got: ${data.isValid}`);
      }
    } else {
      throw new Error(`Test 5 Failed: Status ${res5.statusCode}`);
    }

    // Test 6: Empty code block parameters check (400)
    logger.info('Test 6: Validating error code return for empty code parameters (400)...');
    const req6 = {
      body: { code: '' },
      user: { id: userId }
    };
    const res6 = mockResponse();
    let err6 = null;
    await documentationController.generateReadme(req6, res6, (err) => { err6 = err; });

    if (err6 && err6.statusCode === 400) {
      logger.info('Test 6 Passed: Empty parameter correctly rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400 error status, got: ${err6?.statusCode}`);
    }

    // Test 7: Confirming log persistence inside MySQL history tables
    logger.info('Test 7: Confirming log persistence inside MySQL history tables...');
    const readmeLogs = await query('SELECT id FROM history WHERE user_id = ? AND feature_type = ?', [userId, 'readme']);
    const funcLogs = await query('SELECT id FROM history WHERE user_id = ? AND feature_type = ?', [userId, 'function-docs']);
    const apiLogs = await query('SELECT id FROM history WHERE user_id = ? AND feature_type = ?', [userId, 'api-docs']);
    const commentLogs = await query('SELECT id FROM history WHERE user_id = ? AND feature_type = ?', [userId, 'comments']);

    if (readmeLogs.length >= 2 && funcLogs.length >= 1 && apiLogs.length >= 1 && commentLogs.length >= 1) {
      logger.info(`Test 7 Passed: Successfully recorded documentation history activities.`);
    } else {
      throw new Error(`Test 7 Failed: Missing database log references.`);
    }

    // Test 8: Security Trace Leak Check (Omission of details stack)
    logger.info('Test 8: Verifying error handling stack trace omission in client response...');
    const errObj = new Error('Test authorization fail error');
    // Ensure we mock line numbers/file traces inside stack property to confirm it is sanitized
    errObj.stack = `Error: Test authorization fail error\n    at login (c:/Users/Shaurya Binjola/Desktop/DevMate_AI/backend/src/services/authService.js:68:21)`;
    errObj.statusCode = 403;

    const req8 = { method: 'POST', originalUrl: '/api/auth/login' };
    const res8 = mockResponse();
    await globalErrorHandler(errObj, req8, res8, () => {});

    if (res8.statusCode === 403) {
      const data = res8.jsonData;
      if (data.success === false && data.error === 'Test authorization fail error') {
        if (data.details === undefined) {
          logger.info('Test 8 Passed: Internal stack trace / details field successfully omitted from response.');
        } else {
          throw new Error(`Test 8 Failed: Response exposes forbidden details: ${JSON.stringify(data)}`);
        }
      } else {
        throw new Error(`Test 8 Failed: Bad error response keys: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 8 Failed: Expected 403 error status code, got ${res8.statusCode}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    await query('DELETE FROM history WHERE user_id = ?', [userId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Documentation & Security verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Documentation & Security verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
