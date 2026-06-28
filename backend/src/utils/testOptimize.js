import { pool, query } from '../config/db.js';
import optimizationController from '../controllers/optimizationController.js';
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
  logger.info('Starting Optimizer System Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `opt-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  try {
    // Test 1: Optimize Python Loops
    logger.info('Test 1: Optimizing Python nested list lookup loops...');
    const pythonCode = `def find_duplicates(items):
    dupes = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j] and items[i] not in dupes:
                dupes.append(items[i])
    return dupes`;

    const req1 = {
      body: { code: pythonCode },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await optimizationController.optimizeCode(req1, res1, (err) => { if (err) throw err; });

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      if (data.isValid && data.optimizedCode && Array.isArray(data.improvements) && Array.isArray(data.bestPractices)) {
        logger.info(`Test 1 Passed: Python loop optimization succeeded. Improvements count: ${data.improvements.length}`);
      } else {
        throw new Error(`Test 1 Failed: Bad payload properties: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: Optimize Java class logic
    logger.info('Test 2: Optimizing Java string concatenations...');
    const javaCode = `public class Concat {
    public String concatenate(String[] words) {
        String result = "";
        for (String w : words) {
            result += w;
        }
        return result;
    }
}`;

    const req2 = {
      body: { code: javaCode },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await optimizationController.optimizeCode(req2, res2, (err) => { if (err) throw err; });

    if (res2.statusCode === 200 && res2.jsonData.success) {
      const data = res2.jsonData.data;
      if (data.isValid && data.optimizedCode) {
        logger.info('Test 2 Passed: Java optimization succeeded.');
      } else {
        throw new Error('Test 2 Failed: Java optimization returned invalid structure.');
      }
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.statusCode}`);
    }

    // Test 3: Optimize JavaScript array manipulation
    logger.info('Test 3: Optimizing JavaScript array index operations...');
    const jsCode = `const getUnique = (arr) => {
    return arr.filter((value, index, self) => self.indexOf(value) === index);
};`;

    const req3 = {
      body: { code: jsCode },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await optimizationController.optimizeCode(req3, res3, (err) => { if (err) throw err; });

    if (res3.statusCode === 200 && res3.jsonData.success) {
      const data = res3.jsonData.data;
      if (data.isValid) {
        logger.info('Test 3 Passed: JavaScript optimization succeeded.');
      } else {
        throw new Error('Test 3 Failed: JavaScript optimization returned invalid structure.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.statusCode}`);
    }

    // Test 4: Optimize SQL Subquery joins
    logger.info('Test 4: Optimizing SQL query subquery references...');
    const sqlCode = `SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active');`;

    const req4 = {
      body: { code: sqlCode },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await optimizationController.optimizeCode(req4, res4, (err) => { if (err) throw err; });

    if (res4.statusCode === 200 && res4.jsonData.success) {
      const data = res4.jsonData.data;
      if (data.isValid && data.optimizedCode) {
        logger.info('Test 4 Passed: SQL optimization succeeded.');
      } else {
        throw new Error('Test 4 Failed: SQL optimization returned invalid structure.');
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.statusCode}`);
    }

    // Test 5: Invalid Code Handling (gibberish string input)
    logger.info('Test 5: Testing invalid code inputs checks...');
    const badCode = `just some random text without code structural constructs`;

    const req5 = {
      body: { code: badCode },
      user: { id: userId }
    };
    const res5 = mockResponse();
    await optimizationController.optimizeCode(req5, res5, (err) => { if (err) throw err; });

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
    await optimizationController.optimizeCode(req6, res6, (err) => { err6 = err; });

    if (err6 && err6.statusCode === 400) {
      logger.info('Test 6 Passed: Empty parameter correctly rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400 error status, got: ${err6?.statusCode}`);
    }

    // Test 7: Verify history log persistence integration
    logger.info('Test 7: Confirming log persistence inside MySQL history tables...');
    const historyRows = await query(
      'SELECT id, feature_type, input, output FROM history WHERE user_id = ? AND feature_type = ?',
      [userId, 'optimize']
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
    logger.info('Optimizer System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Optimizer System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
