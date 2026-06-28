import { pool, query } from '../config/db.js';
import learningController from '../controllers/learningController.js';
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
  logger.info('Starting Learning Assistant Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `lrn-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  // Setup User B to test conversation ownership isolation blockages
  const emailB = `lrn-testB-${Date.now()}@devmate.ai`;
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, 'Pw!']);
  const userIdB = userBRes.insertId;

  try {
    // Test 1: Ask Concept explanation (New session)
    logger.info('Test 1: Querying programming concept (generating new conversation thread)...');
    const req1 = {
      body: { prompt: 'What is Recursion?' },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await learningController.askAssistant(req1, res1, (err) => { if (err) throw err; });

    let activeConversationId = null;

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      activeConversationId = data.conversationId;

      if (
        data.explanation &&
        Array.isArray(data.learningPath) &&
        Array.isArray(data.exercises) &&
        data.response &&
        activeConversationId
      ) {
        logger.info(`Test 1 Passed: Successfully generated new lesson thread. ID: ${activeConversationId}`);
      } else {
        throw new Error(`Test 1 Failed: Bad tutor response body keys: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: Verify messages persistence in DB
    logger.info('Test 2: Verifying session message persistence in database...');
    const messageRows = await query(
      'SELECT id, sender, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [activeConversationId]
    );

    if (messageRows && messageRows.length === 2) {
      logger.info('Test 2 Passed: User question and AI response successfully persisted.');
    } else {
      throw new Error(`Test 2 Failed: Expected 2 messages, found: ${messageRows ? messageRows.length : 0}`);
    }

    // Test 3: Follow-up question (Context retention)
    logger.info('Test 3: Sending follow-up query referencing active conversationId...');
    const req3 = {
      body: { prompt: 'Give me a simple python example of it', conversationId: activeConversationId },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await learningController.askAssistant(req3, res3, (err) => { if (err) throw err; });

    if (res3.statusCode === 200 && res3.jsonData.success) {
      const data = res3.jsonData.data;
      if (data.explanation && data.conversationId === activeConversationId) {
        logger.info('Test 3 Passed: Follow-up query executed within correct conversation context.');
      } else {
        throw new Error('Test 3 Failed: Context thread matching parameters failed.');
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.statusCode}`);
    }

    // Test 4: Conversation Ownership Isolation Check (403)
    logger.info('Test 4: Verifying session isolation boundaries (User B accessing User A conversation)...');
    const req4 = {
      body: { prompt: 'Subsequent message', conversationId: activeConversationId },
      user: { id: userIdB }
    };
    const res4 = mockResponse();
    let err4 = null;
    await learningController.askAssistant(req4, res4, (err) => { err4 = err; });

    if (err4 && err4.statusCode === 403) {
      logger.info('Test 4 Passed: Cross-user context access rejected with 403 Forbidden.');
    } else {
      throw new Error(`Test 4 Failed: Expected 403 Forbidden error status, got: ${err4?.statusCode}`);
    }

    // Test 5: Empty Prompt checks (400)
    logger.info('Test 5: Validating parameter validation for empty prompt...');
    const req5 = {
      body: { prompt: '' },
      user: { id: userId }
    };
    const res5 = mockResponse();
    let err5 = null;
    await learningController.askAssistant(req5, res5, (err) => { err5 = err; });

    if (err5 && err5.statusCode === 400) {
      logger.info('Test 5 Passed: Empty prompt rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 5 Failed: Expected 400 error status, got: ${err5?.statusCode}`);
    }

    // Test 6: Verify history log persistence
    logger.info('Test 6: Verifying log records inside MySQL history tables...');
    const historyRows = await query(
      'SELECT id, feature_type, input, output FROM history WHERE user_id = ? AND feature_type = ?',
      [userId, 'learning-assistant']
    );

    if (historyRows && historyRows.length >= 2) {
      logger.info(`Test 6 Passed: Successfully recorded ${historyRows.length} activity history entries.`);
    } else {
      throw new Error(`Test 6 Failed: Expected at least 2 logs, found ${historyRows ? historyRows.length : 0}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    // Delete conversation messages & conversation rows
    const conversations = await query('SELECT id FROM conversations WHERE user_id IN (?, ?)', [userId, userIdB]);
    for (const c of conversations) {
      await query('DELETE FROM messages WHERE conversation_id = ?', [c.id]);
    }
    await query('DELETE FROM conversations WHERE user_id IN (?, ?)', [userId, userIdB]);
    await query('DELETE FROM history WHERE user_id IN (?, ?)', [userId, userIdB]);
    await query('DELETE FROM users WHERE id IN (?, ?)', [userId, userIdB]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Learning Assistant verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Learning Assistant verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
