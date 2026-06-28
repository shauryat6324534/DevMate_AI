import { pool, query } from '../config/db.js';
import messageController from '../controllers/messageController.js';
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
  logger.info('Starting Message Persistence Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `msg-a-test-${Date.now()}@devmate.ai`;
  const emailB = `msg-b-test-${Date.now()}@devmate.ai`;

  // 1. Create test users
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, 'Pw!']);
  const userAId = userARes.insertId;
  const userBId = userBRes.insertId;

  // 2. Create test conversations
  const convARes = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userAId, 'User A Conversation']);
  const convBRes = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userBId, 'User B Conversation']);
  const convAId = convARes.insertId;
  const convBId = convBRes.insertId;

  try {
    // Test 1: Save user message in Conversation A
    logger.info('Test 1: Saving User message for User A...');
    const userReq = {
      body: {
        conversationId: convAId,
        sender: 'user',
        content: 'First prompt from User A'
      },
      user: { id: userAId }
    };
    const userRes = mockResponse();
    await messageController.saveMessage(userReq, userRes, (err) => {
      if (err) throw err;
    });

    if (userRes.statusCode === 201 && userRes.jsonData.success) {
      logger.info('Test 1 Passed: User message successfully saved in messages table.');
    } else {
      throw new Error(`Test 1 Failed: Status ${userRes.statusCode}`);
    }

    // Test 2: Save AI response in Conversation A
    logger.info('Test 2: Saving AI message response for User A...');
    const aiReq = {
      body: {
        conversationId: convAId,
        sender: 'ai',
        content: 'AI Response generation data'
      },
      user: { id: userAId }
    };
    const aiRes = mockResponse();
    await messageController.saveMessage(aiReq, aiRes, (err) => {
      if (err) throw err;
    });

    if (aiRes.statusCode === 201 && aiRes.jsonData.success) {
      logger.info('Test 2 Passed: AI response successfully saved in messages table.');
    } else {
      throw new Error(`Test 2 Failed: Status ${aiRes.statusCode}`);
    }

    // Test 3: Retrieve messages and verify chronological ordering
    logger.info('Test 3: Retrieving messages and checking chronological order...');
    const getReq = {
      params: { conversationId: String(convAId) },
      query: {},
      user: { id: userAId }
    };
    const getRes = mockResponse();
    await messageController.getMessages(getReq, getRes, (err) => {
      if (err) throw err;
    });

    if (getRes.statusCode === 200 && getRes.jsonData.success && getRes.jsonData.data.messages.length === 2) {
      const messages = getRes.jsonData.data.messages;
      const firstIsUser = messages[0].sender === 'user';
      const secondIsAi = messages[1].sender === 'ai';

      if (firstIsUser && secondIsAi) {
        logger.info('Test 3 Passed: Chronological sort (created_at ASC) verified correctly.');
      } else {
        throw new Error('Test 3 Failed: Messages returned out of chronological order.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${getRes.statusCode}`);
    }

    // Test 4: Verify paginated response structure
    logger.info('Test 4: Checking pagination controls (page=1, limit=1)...');
    const pagReq = {
      params: { conversationId: String(convAId) },
      query: { page: '1', limit: '1' },
      user: { id: userAId }
    };
    const pagRes = mockResponse();
    await messageController.getMessages(pagReq, pagRes, (err) => {
      if (err) throw err;
    });

    if (pagRes.statusCode === 200 && pagRes.jsonData.success) {
      const pagData = pagRes.jsonData.data;
      if (
        pagData.messages.length === 1 &&
        pagData.page === 1 &&
        pagData.limit === 1 &&
        pagData.total === 2 &&
        pagData.totalPages === 2
      ) {
        logger.info('Test 4 Passed: Pagination metadata matches expected parameters.');
      } else {
        throw new Error(`Test 4 Failed: Invalid pagination metadata returned: ${JSON.stringify(pagData)}`);
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${pagRes.statusCode}`);
    }

    // Test 5: Verify user isolation blocks User B from User A's messages
    logger.info('Test 5: Testing tenant isolation constraints (User B access check)...');
    const isoReq = {
      params: { conversationId: String(convAId) },
      query: {},
      user: { id: userBId }
    };
    const isoRes = mockResponse();
    let isoError = null;

    await messageController.getMessages(isoReq, isoRes, (err) => {
      isoError = err;
    });

    if (isoError && isoError.statusCode === 403) {
      logger.info('Test 5 Passed: User B block validated with 403 Forbidden.');
    } else {
      throw new Error(`Test 5 Failed: Expected 403 Forbidden, got status: ${isoError?.statusCode}`);
    }

    // Test 6: Rejections on invalid conversation IDs
    logger.info('Test 6: Validation checks for bad/non-numeric conversation IDs...');
    const badIdReq = {
      params: { conversationId: 'bad-id-param' },
      user: { id: userAId }
    };
    const badIdRes = mockResponse();
    let badIdError = null;

    await messageController.getMessages(badIdReq, badIdRes, (err) => {
      badIdError = err;
    });

    if (badIdError && badIdError.statusCode === 400) {
      logger.info('Test 6 Passed: Bad numeric format blocked with 400.');
    } else {
      throw new Error(`Test 6 Failed: Expected 400, got: ${badIdError?.statusCode}`);
    }

    // Test 7: Unauthorized calls rejections
    logger.info('Test 7: Missing credential validation rejections...');
    const noAuthReq = {
      params: { conversationId: String(convAId) }
    };
    const noAuthRes = mockResponse();
    let noAuthError = null;

    await messageController.getMessages(noAuthReq, noAuthRes, (err) => {
      noAuthError = err;
    });

    if (noAuthError && noAuthError.statusCode === 401) {
      logger.info('Test 7 Passed: Unauthenticated request intercepted and rejected with 401.');
    } else {
      throw new Error(`Test 7 Failed: Expected 401, got: ${noAuthError?.statusCode}`);
    }

    // Test 8: Non-existent conversation validation
    logger.info('Test 8: Checking missing conversation ID mappings (404)...');
    const missingReq = {
      params: { conversationId: '999999' },
      query: {},
      user: { id: userAId }
    };
    const missingRes = mockResponse();
    let missingError = null;

    await messageController.getMessages(missingReq, missingRes, (err) => {
      missingError = err;
    });

    if (missingError && missingError.statusCode === 404) {
      logger.info('Test 8 Passed: Non-existent conversation responded with 404.');
    } else {
      throw new Error(`Test 8 Failed: Expected 404, got: ${missingError?.statusCode}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test logs...');
    await query('DELETE FROM messages WHERE conversation_id IN (?, ?)', [convAId, convBId]);
    await query('DELETE FROM conversations WHERE id IN (?, ?)', [convAId, convBId]);
    await query('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Message System verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Message System verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
