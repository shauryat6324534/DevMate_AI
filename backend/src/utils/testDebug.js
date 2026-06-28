import { pool, query } from '../config/db.js';
import debugController from '../controllers/debugController.js';
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
  logger.info('Starting Debugger System Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `dbg-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  try {
    // Test 1: Debug Python Code with missing colon
    logger.info('Test 1: Debugging Python function with missing colon...');
    const pythonCode = `def fib(n)
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)`;

    const req1 = {
      body: { code: pythonCode, errorLogs: 'SyntaxError: invalid syntax' },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await debugController.debugCode(req1, res1, (err) => { if (err) throw err; });

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      if (data.isValid && data.hasBugs && data.bugDescription && data.correctedCode) {
        logger.info(`Test 1 Passed: Python bug diagnostic succeeded. Corrected code starts with: "${data.correctedCode.split('\n')[0]}"`);
      } else {
        throw new Error(`Test 1 Failed: Bad payload properties: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: Debug Java Code
    logger.info('Test 2: Debugging Java logical error (divide by zero)...');
    const javaCode = `public class Calculator {
    public static int divide(int a, int b) {
        return a / 0;
    }
}`;

    const req2 = {
      body: { code: javaCode },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await debugController.debugCode(req2, res2, (err) => { if (err) throw err; });

    if (res2.statusCode === 200 && res2.jsonData.success) {
      const data = res2.jsonData.data;
      if (data.isValid && data.bugDescription) {
        logger.info('Test 2 Passed: Java logical error diagnosis succeeded.');
      } else {
        throw new Error('Test 2 Failed: Java diagnostic returned invalid structure.');
      }
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.statusCode}`);
    }

    // Test 3: Debug JavaScript Code
    logger.info('Test 3: Debugging JavaScript undefined variable comparison...');
    const jsCode = `if (myVar === undefined) { console.log("empty"); }`;

    const req3 = {
      body: { code: jsCode },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await debugController.debugCode(req3, res3, (err) => { if (err) throw err; });

    if (res3.statusCode === 200 && res3.jsonData.success) {
      const data = res3.jsonData.data;
      if (data.isValid) {
        logger.info('Test 3 Passed: JavaScript debugging diagnosis succeeded.');
      } else {
        throw new Error('Test 3 Failed: JavaScript diagnosis returned invalid structure.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.statusCode}`);
    }

    // Test 4: Debug SQL query with missing FROM clause
    logger.info('Test 4: Debugging SQL query with missing FROM...');
    const sqlCode = `SELECT username WHERE id = 1;`;

    const req4 = {
      body: { code: sqlCode },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await debugController.debugCode(req4, res4, (err) => { if (err) throw err; });

    if (res4.statusCode === 200 && res4.jsonData.success) {
      const data = res4.jsonData.data;
      if (data.isValid && data.hasBugs && data.correctedCode) {
        logger.info(`Test 4 Passed: SQL query debugging diagnosis succeeded. Corrected: "${data.correctedCode}"`);
      } else {
        throw new Error('Test 4 Failed: SQL diagnosis returned invalid structure.');
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.statusCode}`);
    }

    // Test 5: Invalid Input Blockages
    logger.info('Test 5: Testing invalid code inputs checks...');
    const badCode = `just some generic plain english instructions`;

    const req5 = {
      body: { code: badCode },
      user: { id: userId }
    };
    const res5 = mockResponse();
    await debugController.debugCode(req5, res5, (err) => { if (err) throw err; });

    if (res5.statusCode === 200 && res5.jsonData.success) {
      const data = res5.jsonData.data;
      if (!data.isValid && data.invalidReason) {
        logger.info(`Test 5 Passed: Gibberish input successfully detected as invalid. Reason: "${data.invalidReason}"`);
      } else {
        throw new Error(`Test 5 Failed: Expected isValid to be false, got: ${data.isValid}`);
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
    await debugController.debugCode(req6, res6, (err) => { err6 = err; });

    if (err6 && err6.statusCode === 400) {
      logger.info('Test 6 Passed: Empty parameter correctly rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400 error status, got: ${err6?.statusCode}`);
    }

    // Test 7: Verify history log persistence integration
    logger.info('Test 7: Confirming log persistence inside MySQL history tables...');
    const historyRows = await query(
      'SELECT id, feature_type, input, output FROM history WHERE user_id = ? AND feature_type = ?',
      [userId, 'debugger']
    );

    if (historyRows && historyRows.length >= 4) {
      logger.info(`Test 7 Passed: Successfully recorded ${historyRows.length} activity history entries.`);
    } else {
      throw new Error(`Test 7 Failed: Expected at least 4 logs, found ${historyRows ? historyRows.length : 0}`);
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
    logger.info('Debugger System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Debugger System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
