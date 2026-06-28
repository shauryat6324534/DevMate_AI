import { pool, query } from '../config/db.js';
import historyController from '../controllers/historyController.js';
import historyService from '../services/historyService.js';
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
  logger.info('Starting History System Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `hist-a-test-${Date.now()}@devmate.ai`;
  const emailB = `hist-b-test-${Date.now()}@devmate.ai`;

  // 1. Create test users
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, 'Pw!']);
  const userAId = userARes.insertId;
  const userBId = userBRes.insertId;

  const historyIds = [];

  try {
    // Test 1: Log activity across different feature types
    logger.info('Test 1: Logging multiple feature activities for User A...');
    
    const features = [
      { type: 'code-gen', input: 'generate API', output: 'function code()' },
      { type: 'explanation', input: 'explain code', output: 'this code...' },
      { type: 'debugger', input: 'fix error', output: 'corrected...' },
      { type: 'optimize', input: 'optimize loops', output: 'optimized...' },
      { type: 'documentation', input: 'document class', output: 'docstring...' },
      { type: 'review', input: 'review PR', output: 'comments...' }
    ];

    for (const f of features) {
      const result = await historyService.logActivity(userAId, f.type, { input: f.input, output: f.output });
      if (result && result.id) {
        historyIds.push(result.id);
      }
    }

    if (historyIds.length === 6) {
      logger.info('Test 1 Passed: Logs successfully created for all 6 features.');
    } else {
      throw new Error(`Test 1 Failed: Expected 6 logs, got ${historyIds.length}`);
    }

    // Test 2: Fetch history for User A
    logger.info('Test 2: Loading activity history list for User A...');
    const getReq = {
      query: {},
      user: { id: userAId }
    };
    const getRes = mockResponse();
    await historyController.getHistory(getReq, getRes, (err) => {
      if (err) throw err;
    });

    if (getRes.statusCode === 200 && getRes.jsonData.success && getRes.jsonData.data.length >= 6) {
      logger.info(`Test 2 Passed: Fetched ${getRes.jsonData.data.length} history records.`);
    } else {
      throw new Error(`Test 2 Failed: Status ${getRes.statusCode}`);
    }

    // Test 3: Filter history by featureType
    logger.info('Test 3: Filtering history list by featureType="code-gen"...');
    const filterReq = {
      query: { featureType: 'code-gen' },
      user: { id: userAId }
    };
    const filterRes = mockResponse();
    await historyController.getHistory(filterReq, filterRes, (err) => {
      if (err) throw err;
    });

    if (filterRes.statusCode === 200 && filterRes.jsonData.success) {
      const records = filterRes.jsonData.data;
      const allCodeGen = records.every(r => r.featureType === 'code-gen');
      if (allCodeGen && records.length > 0) {
        logger.info(`Test 3 Passed: Successfully filtered; returned ${records.length} code-gen rows.`);
      } else {
        throw new Error('Test 3 Failed: Returned items with unmatched featureType.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${filterRes.statusCode}`);
    }

    // Test 4: Verify chronological sort direction controls (ASC vs DESC)
    logger.info('Test 4: Checking chronological sorting (ASC vs DESC)...');
    
    const ascReq = {
      query: { sort: 'ASC' },
      user: { id: userAId }
    };
    const ascRes = mockResponse();
    await historyController.getHistory(ascReq, ascRes, (err) => {
      if (err) throw err;
    });

    const descReq = {
      query: { sort: 'DESC' },
      user: { id: userAId }
    };
    const descRes = mockResponse();
    await historyController.getHistory(descReq, descRes, (err) => {
      if (err) throw err;
    });

    if (ascRes.statusCode === 200 && descRes.statusCode === 200) {
      const firstAsc = ascRes.jsonData.data[0].id;
      const firstDesc = descRes.jsonData.data[0].id;

      if (firstAsc !== firstDesc) {
        logger.info('Test 4 Passed: Chronological sort direction validated.');
      } else {
        throw new Error('Test 4 Failed: ASC and DESC returned identical ordering.');
      }
    } else {
      throw new Error('Test 4 Failed: Bad responses for sorting.');
    }

    // Test 5: Verify user isolation blocks User B from User A's logs
    logger.info('Test 5: Testing tenant isolation (User B lookup on User A\'s log)...');
    const isoReq = {
      params: { id: String(historyIds[0]) },
      user: { id: userBId }
    };
    const isoRes = mockResponse();
    let isoError = null;

    await historyController.getHistoryById(isoReq, isoRes, (err) => {
      isoError = err;
    });

    if (isoError && isoError.statusCode === 403) {
      logger.info('Test 5 Passed: User B access request blocked with 403 Forbidden.');
    } else {
      throw new Error(`Test 5 Failed: Expected 403 Forbidden, got: ${isoError?.statusCode}`);
    }

    // Test 6: Rejections on invalid formats
    logger.info('Test 6: Validation checks for bad/non-numeric history IDs...');
    const badIdReq = {
      params: { id: 'invalid-id-string' },
      user: { id: userAId }
    };
    const badIdRes = mockResponse();
    let badIdError = null;

    await historyController.getHistoryById(badIdReq, badIdRes, (err) => {
      badIdError = err;
    });

    if (badIdError && badIdError.statusCode === 400) {
      logger.info('Test 6 Passed: Bad numeric format blocked with 400.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400, got: ${badIdError?.statusCode}`);
    }

    // Test 7: Unauthorized calls
    logger.info('Test 7: Testing route validation with missing credentials (unauthenticated)...');
    const noAuthReq = {
      params: { id: String(historyIds[0]) }
    };
    const noAuthRes = mockResponse();
    let noAuthError = null;

    await historyController.getHistoryById(noAuthReq, noAuthRes, (err) => {
      noAuthError = err;
    });

    if (noAuthError && noAuthError.statusCode === 401) {
      logger.info('Test 7 Passed: Unauthenticated request blocked with 401.');
    } else {
      throw new Error(`Test 7 Failed: Expected 401, got: ${noAuthError?.statusCode}`);
    }

    // Test 8: Non-existent history record validation
    logger.info('Test 8: Checking missing history ID mappings (404)...');
    const missingReq = {
      params: { id: '999999' },
      user: { id: userAId }
    };
    const missingRes = mockResponse();
    let missingError = null;

    await historyController.getHistoryById(missingReq, missingRes, (err) => {
      missingError = err;
    });

    if (missingError && missingError.statusCode === 404) {
      logger.info('Test 8 Passed: Non-existent log record returned 404.');
    } else {
      throw new Error(`Test 8 Failed: Expected 404, got: ${missingError?.statusCode}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    if (historyIds.length > 0) {
      await query('DELETE FROM history WHERE id IN (' + historyIds.join(',') + ')');
    }
    await query('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('History System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('History System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
