import { pool, query } from '../config/db.js';
import conversationController from '../controllers/conversationController.js';
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
  logger.info('Starting Conversation System Integration Audit...');
  logger.info('==================================================');

  // Pre-test cleanup
  const emailA = `conv-a-test-${Date.now()}@devmate.ai`;
  const emailB = `conv-b-test-${Date.now()}@devmate.ai`;

  // 1. Insert test users
  const userAResult = await query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    ['User A', emailA, 'HashedPassword1!']
  );
  const userBResult = await query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    ['User B', emailB, 'HashedPassword1!']
  );

  const userAId = userAResult.insertId;
  const userBId = userBResult.insertId;

  let testConversationId = null;

  try {
    // Test 1: Create conversation with custom title
    logger.info('Test 1: Creating conversation for User A...');
    const createReq = {
      body: {
        prompt: 'Create a robust and fast microservice API in Python'
      },
      user: { id: userAId }
    };
    const createRes = mockResponse();
    await conversationController.createConversation(createReq, createRes, (err) => {
      if (err) throw err;
    });

    if (createRes.statusCode === 201 && createRes.jsonData.success) {
      testConversationId = createRes.jsonData.data.id;
      const title = createRes.jsonData.data.title;
      logger.info(`Test 1 Passed: Conversation created (ID: ${testConversationId}) with title "${title}".`);
    } else {
      throw new Error(`Test 1 Failed: Status ${createRes.statusCode}`);
    }

    // Test 2: Fetch all conversations for User A
    logger.info('Test 2: Fetching all conversations for User A...');
    const listReq = { user: { id: userAId } };
    const listRes = mockResponse();
    await conversationController.getConversations(listReq, listRes, (err) => {
      if (err) throw err;
    });

    if (listRes.statusCode === 200 && listRes.jsonData.success && listRes.jsonData.data.length >= 1) {
      logger.info(`Test 2 Passed: Fetched ${listRes.jsonData.data.length} conversations successfully.`);
    } else {
      throw new Error(`Test 2 Failed: Status ${listRes.statusCode}`);
    }

    // Test 3: Fetch single conversation with correct ownership
    logger.info('Test 3: Fetching single conversation by ID for User A...');
    const singleReq = {
      params: { id: String(testConversationId) },
      user: { id: userAId }
    };
    const singleRes = mockResponse();
    await conversationController.getConversationById(singleReq, singleRes, (err) => {
      if (err) throw err;
    });

    if (singleRes.statusCode === 200 && singleRes.jsonData.success && singleRes.jsonData.data.id === testConversationId) {
      logger.info('Test 3 Passed: Successfully retrieved conversation after verifying owner.');
    } else {
      throw new Error(`Test 3 Failed: Status ${singleRes.statusCode}`);
    }

    // Test 4: User isolation check (User B trying to fetch User A's conversation)
    logger.info('Test 4: Verifying user isolation (User B access check to User A\'s conversation)...');
    const isoReq = {
      params: { id: String(testConversationId) },
      user: { id: userBId }
    };
    const isoRes = mockResponse();
    let isoError = null;

    await conversationController.getConversationById(isoReq, isoRes, (err) => {
      isoError = err;
    });

    if (isoError && isoError.statusCode === 403) {
      logger.info('Test 4 Passed: User B access attempt to User A\'s conversation correctly blocked with 403.');
    } else {
      throw new Error(`Test 4 Failed: Expected 403 Forbidden, got error status: ${isoError?.statusCode}`);
    }

    // Test 5: Unauthorized access checks (Missing JWT credentials)
    logger.info('Test 5: Testing route validation with missing credentials (unauthenticated)...');
    const authReq = {
      params: { id: String(testConversationId) }
    };
    const authRes = mockResponse();
    let authError = null;

    await conversationController.getConversationById(authReq, authRes, (err) => {
      authError = err;
    });

    if (authError && authError.statusCode === 401) {
      logger.info('Test 5 Passed: Request without authenticated credentials blocked with 401.');
    } else {
      throw new Error(`Test 5 Failed: Expected 401 Unauthorized, got: ${authError?.statusCode}`);
    }

    // Test 6: Invalid conversation ID validation checks
    logger.info('Test 6: Fetching with invalid ID structure (e.g. non-numeric)...');
    const badIdReq = {
      params: { id: 'invalid-id-string' },
      user: { id: userAId }
    };
    const badIdRes = mockResponse();
    let badIdError = null;

    await conversationController.getConversationById(badIdReq, badIdRes, (err) => {
      badIdError = err;
    });

    if (badIdError && badIdError.statusCode === 400) {
      logger.info('Test 6 Passed: Non-numeric ID format blocked with 400.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400, got: ${badIdError?.statusCode}`);
    }

    // Test 7: Conversation not found checks (Non-existent ID check)
    logger.info('Test 7: Fetching non-existent conversation ID...');
    const missingReq = {
      params: { id: '999999' },
      user: { id: userAId }
    };
    const missingRes = mockResponse();
    let missingError = null;

    await conversationController.getConversationById(missingReq, missingRes, (err) => {
      missingError = err;
    });

    if (missingError && missingError.statusCode === 404) {
      logger.info('Test 7 Passed: Non-existent ID correctly responded with 404.');
    } else {
      throw new Error(`Test 7 Failed: Expected 404, got: ${missingError?.statusCode}`);
    }

  } finally {
    // Post-test cleanup
    logger.info('Cleaning up database test records...');
    if (testConversationId) {
      await query('DELETE FROM conversations WHERE id = ?', [testConversationId]);
    }
    await query('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);
    logger.info('Cleanup complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Conversation System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Conversation System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
