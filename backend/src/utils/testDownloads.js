import { pool, query } from '../config/db.js';
import downloadController from '../controllers/downloadController.js';
import logger from './logger.js';

const mockResponse = () => {
  const res = {
    headers: {}
  };
  res.setHeader = function (name, value) {
    this.headers[name] = value;
    return this;
  };
  res.send = function (data) {
    this.sentData = data;
    return this;
  };
  return res;
};

async function runTests() {
  logger.info('==================================================');
  logger.info('Starting Download System Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `dl-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  const emailB = `dl-testB-${Date.now()}@devmate.ai`;
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, 'Pw!']);
  const userIdB = userBRes.insertId;

  // Insert mock history logs for User A representing the expected feature types
  const hCode = await query(
    'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
    [userId, 'code-gen', 'Generate Python addition', 'def add(a, b):\n    return a + b']
  );
  const hCodeId = hCode.insertId;

  const hExplain = await query(
    'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
    [userId, 'explanation', 'Code check', JSON.stringify({ purpose: 'Adds numbers', logic: 'Returns sum', workflow: ['step 1'], complexity: { time: 'O(1)', space: 'O(1)' } })]
  );
  const hExplainId = hExplain.insertId;

  const hDoc = await query(
    'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
    [userId, 'readme', 'Readme prompt', JSON.stringify({ isValid: true, readme: '# My Readme' })]
  );
  const hDocId = hDoc.insertId;

  const hReview = await query(
    'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
    [userId, 'review', 'Review code', JSON.stringify({ qualityScore: 80, readabilityScore: 85, maintainabilityScore: 75, namingConventions: [], codeSmells: [], antiPatterns: [], refactoringOpportunities: [], bestPractices: [] })]
  );
  const hReviewId = hReview.insertId;

  const hLearn = await query(
    'INSERT INTO history (user_id, feature_type, input, output) VALUES (?, ?, ?, ?)',
    [userId, 'learning-assistant', 'Recursion', JSON.stringify({ explanation: 'Recursion lesson', learningPath: [], exercises: [], response: 'Success summary' })]
  );
  const hLearnId = hLearn.insertId;

  try {
    // Test 1: Code download as TXT
    logger.info('Test 1: Downloading code output as TXT...');
    const req1 = {
      query: { id: hCodeId, format: 'txt' },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await downloadController.downloadCode(req1, res1, (err) => { if (err) throw err; });

    if (res1.headers['Content-Disposition'] && res1.headers['Content-Disposition'].includes('attachment')) {
      if (res1.sentData && res1.sentData.includes('def add')) {
        logger.info('Test 1 Passed: Code TXT download content structured successfully.');
      } else {
        throw new Error('Test 1 Failed: Content not matches raw code.');
      }
    } else {
      throw new Error('Test 1 Failed: Missing download attachment headers.');
    }

    // Test 2: Code download as MD
    logger.info('Test 2: Downloading code output as MD...');
    const req2 = {
      query: { id: hCodeId, format: 'md' },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await downloadController.downloadCode(req2, res2, (err) => { if (err) throw err; });

    if (res2.sentData && res2.sentData.includes('# Generated Code')) {
      logger.info('Test 2 Passed: Code MD download content structured successfully.');
    } else {
      throw new Error('Test 2 Failed: Code MD formatting failed.');
    }

    // Test 3: Explanation download as TXT
    logger.info('Test 3: Downloading explanation as TXT...');
    const req3 = {
      query: { id: hExplainId, format: 'txt' },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await downloadController.downloadExplanation(req3, res3, (err) => { if (err) throw err; });

    if (res3.sentData && res3.sentData.includes('Purpose: Adds numbers')) {
      logger.info('Test 3 Passed: Explanation TXT download successfully formatted.');
    } else {
      throw new Error('Test 3 Failed: Explanation plain text mapping failed.');
    }

    // Test 4: Explanation download as MD
    logger.info('Test 4: Downloading explanation as MD...');
    const req4 = {
      query: { id: hExplainId, format: 'md' },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await downloadController.downloadExplanation(req4, res4, (err) => { if (err) throw err; });

    if (res4.sentData && res4.sentData.includes('## Purpose')) {
      logger.info('Test 4 Passed: Explanation MD download successfully formatted.');
    } else {
      throw new Error('Test 4 Failed: Explanation Markdown mapping failed.');
    }

    // Test 5: Documentation download (README)
    logger.info('Test 5: Downloading documentation output...');
    const req5 = {
      query: { id: hDocId, format: 'md' },
      user: { id: userId }
    };
    const res5 = mockResponse();
    await downloadController.downloadDocumentation(req5, res5, (err) => { if (err) throw err; });

    if (res5.sentData && res5.sentData.includes('# My Readme')) {
      logger.info('Test 5 Passed: Documentation download successfully formatted.');
    } else {
      throw new Error('Test 5 Failed: Documentation markdown extraction failed.');
    }

    // Test 6: Review reports download
    logger.info('Test 6: Downloading review reports...');
    const req6 = {
      query: { id: hReviewId, format: 'md' },
      user: { id: userId }
    };
    const res6 = mockResponse();
    await downloadController.downloadReview(req6, res6, (err) => { if (err) throw err; });

    if (res6.sentData && res6.sentData.includes('# Code Review Report')) {
      logger.info('Test 6 Passed: Review reports download successfully formatted.');
    } else {
      throw new Error('Test 6 Failed: Review report Markdown mapping failed.');
    }

    // Test 7: Learning concepts download
    logger.info('Test 7: Downloading learning lesson...');
    const req7 = {
      query: { id: hLearnId, format: 'md' },
      user: { id: userId }
    };
    const res7 = mockResponse();
    await downloadController.downloadLearning(req7, res7, (err) => { if (err) throw err; });

    if (res7.sentData && res7.sentData.includes('# Programming Lesson')) {
      logger.info('Test 7 Passed: Learning concepts download successfully formatted.');
    } else {
      throw new Error('Test 7 Failed: Learning lesson Markdown mapping failed.');
    }

    // Test 8: Ownership Isolation Boundary checks (403)
    logger.info('Test 8: Verifying ownership check boundaries (User B downloading User A content)...');
    const req8 = {
      query: { id: hCodeId, format: 'txt' },
      user: { id: userIdB }
    };
    const res8 = mockResponse();
    let err8 = null;
    await downloadController.downloadCode(req8, res8, (err) => { err8 = err; });

    if (err8 && err8.statusCode === 403) {
      logger.info('Test 8 Passed: Cross-tenant download correctly rejected with 403 Forbidden.');
    } else {
      throw new Error(`Test 8 Failed: Expected 403 error status, got: ${err8?.statusCode}`);
    }

    // Test 9: Empty parameter validation check (400)
    logger.info('Test 9: Validating error code return for missing query parameters...');
    const req9 = {
      query: {},
      user: { id: userId }
    };
    const res9 = mockResponse();
    let err9 = null;
    await downloadController.downloadCode(req9, res9, (err) => { err9 = err; });

    if (err9 && err9.statusCode === 400) {
      logger.info('Test 9 Passed: Missing parameter correctly rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 9 Failed: Expected 400 error status, got: ${err9?.statusCode}`);
    }

    // Test 10: Downloads metadata table audit records checks
    logger.info('Test 10: Confirming downloads metadata logs inserts in MySQL tables...');
    const downloadRows = await query(
      'SELECT id, file_name, file_type FROM downloads WHERE user_id = ?',
      [userId]
    );

    if (downloadRows && downloadRows.length >= 7) {
      logger.info(`Test 10 Passed: Successfully recorded ${downloadRows.length} downloads audit records.`);
    } else {
      throw new Error(`Test 10 Failed: Expected at least 7 entries, found ${downloadRows ? downloadRows.length : 0}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    await query('DELETE FROM downloads WHERE user_id IN (?, ?)', [userId, userIdB]);
    await query('DELETE FROM history WHERE user_id IN (?, ?)', [userId, userIdB]);
    await query('DELETE FROM users WHERE id IN (?, ?)', [userId, userIdB]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Download System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Download System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
