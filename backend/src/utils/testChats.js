import { pool, query } from '../config/db.js';
import chatManagementController from '../controllers/chatManagementController.js';
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
  logger.info('Starting Chat Management Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `chat-test-${Date.now()}@devmate.ai`;
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, 'Pw!']);
  const userId = userARes.insertId;

  const emailB = `chat-testB-${Date.now()}@devmate.ai`;
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, 'Pw!']);
  const userIdB = userBRes.insertId;

  // Insert sample conversations for User A (created sequentially with slight time offsets)
  const conv1 = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userId, 'First Python Chat']);
  const c1Id = conv1.insertId;
  await new Promise(r => setTimeout(r, 100)); // slight delay to enforce chronological separation

  const conv2 = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userId, 'Second JS Chat']);
  const c2Id = conv2.insertId;
  await new Promise(r => setTimeout(r, 100));

  const conv3 = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userId, 'Third SQL Chat']);
  const c3Id = conv3.insertId;

  // Add messages for search test
  await query('INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)', [c1Id, 'user', 'recursion examples']);
  await query('INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)', [c2Id, 'ai', 'functional arrays operations']);

  try {
    // Test 1: List Chats (Latest First - default)
    logger.info('Test 1: Listing user conversations sorting by latest first...');
    const req1 = {
      query: { page: 1, limit: 10, sortBy: 'latest' },
      user: { id: userId }
    };
    const res1 = mockResponse();
    await chatManagementController.listChats(req1, res1, (err) => { if (err) throw err; });

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      if (data.conversations.length === 3 && data.conversations[0].id === c3Id) {
        logger.info('Test 1 Passed: Chats list returned chronological latest first order.');
      } else {
        throw new Error(`Test 1 Failed: Bad sorting order: ${JSON.stringify(data.conversations)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: List Chats (Oldest First)
    logger.info('Test 2: Listing user conversations sorting by oldest first...');
    const req2 = {
      query: { page: 1, limit: 10, sortBy: 'oldest' },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await chatManagementController.listChats(req2, res2, (err) => { if (err) throw err; });

    if (res2.statusCode === 200 && res2.jsonData.success) {
      const data = res2.jsonData.data;
      if (data.conversations.length === 3 && data.conversations[0].id === c1Id) {
        logger.info('Test 2 Passed: Chats list returned chronological oldest first order.');
      } else {
        throw new Error('Test 2 Failed: Oldest first sorting failed.');
      }
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.statusCode}`);
    }

    // Test 3: Pagination offsets
    logger.info('Test 3: Checking pagination bounds limits...');
    const req3 = {
      query: { page: 2, limit: 2 },
      user: { id: userId }
    };
    const res3 = mockResponse();
    await chatManagementController.listChats(req3, res3, (err) => { if (err) throw err; });

    if (res3.statusCode === 200 && res3.jsonData.success) {
      const data = res3.jsonData.data;
      // Total 3 chats. Page 2 with limit 2 should return 1 conversation (the oldest)
      if (data.conversations.length === 1 && data.conversations[0].id === c1Id && data.totalPages === 2) {
        logger.info('Test 3 Passed: Pagination offset calculations succeeded.');
      } else {
        throw new Error(`Test 3 Failed: Paging values: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.statusCode}`);
    }

    // Test 4: Rename Chat
    logger.info('Test 4: Renaming conversation title context...');
    const req4 = {
      params: { id: c1Id },
      body: { title: 'Renamed Python Lesson' },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await chatManagementController.renameChat(req4, res4, (err) => { if (err) throw err; });

    if (res4.statusCode === 200 && res4.jsonData.success) {
      const dbCheck = await query('SELECT title FROM conversations WHERE id = ?', [c1Id]);
      if (dbCheck && dbCheck[0].title === 'Renamed Python Lesson') {
        logger.info('Test 4 Passed: Chat renamed successfully.');
      } else {
        throw new Error('Test 4 Failed: Database update failed.');
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.statusCode}`);
    }

    // Test 5: Search Conversations by Title
    logger.info('Test 5: Searching conversations matching title query...');
    const req5 = {
      query: { q: 'SQL' },
      user: { id: userId }
    };
    const res5 = mockResponse();
    await chatManagementController.searchChats(req5, res5, (err) => { if (err) throw err; });

    if (res5.statusCode === 200 && res5.jsonData.success) {
      const data = res5.jsonData.data;
      if (data.length === 1 && data[0].id === c3Id) {
        logger.info('Test 5 Passed: Search matching title succeeded.');
      } else {
        throw new Error(`Test 5 Failed: Expected 1 matched result, got: ${data.length}`);
      }
    } else {
      throw new Error(`Test 5 Failed: Status ${res5.statusCode}`);
    }

    // Test 6: Search Conversations by Message Content
    logger.info('Test 6: Searching conversations matching message body content...');
    const req6 = {
      query: { q: 'recursion' },
      user: { id: userId }
    };
    const res6 = mockResponse();
    await chatManagementController.searchChats(req6, res6, (err) => { if (err) throw err; });

    if (res6.statusCode === 200 && res6.jsonData.success) {
      const data = res6.jsonData.data;
      if (data.length === 1 && data[0].id === c1Id) {
        logger.info('Test 6 Passed: Search matching message content succeeded.');
      } else {
        throw new Error(`Test 6 Failed: Expected 1 matched result, got: ${data.length}`);
      }
    } else {
      throw new Error(`Test 6 Failed: Status ${res6.statusCode}`);
    }

    // Test 7: Ownership Protection checks (403/404)
    logger.info('Test 7: Confirming ownership check boundaries (User B renaming User A chat)...');
    const req7 = {
      params: { id: c2Id },
      body: { title: 'User B Hacked Title' },
      user: { id: userIdB }
    };
    const res7 = mockResponse();
    let err7 = null;
    await chatManagementController.renameChat(req7, res7, (err) => { err7 = err; });

    if (err7 && err7.statusCode === 403) {
      logger.info('Test 7 Passed: Unauthorized access correctly rejected with 403 Forbidden.');
    } else {
      throw new Error(`Test 7 Failed: Expected 403 error status, got: ${err7?.statusCode}`);
    }

    // Test 8: Empty title validations (400)
    logger.info('Test 8: Validating parameter validation for empty rename title...');
    const req8 = {
      params: { id: c1Id },
      body: { title: '   ' },
      user: { id: userId }
    };
    const res8 = mockResponse();
    let err8 = null;
    await chatManagementController.renameChat(req8, res8, (err) => { err8 = err; });

    if (err8 && err8.statusCode === 400) {
      logger.info('Test 8 Passed: Empty title successfully rejected with 400 Bad Request.');
    } else {
      throw new Error(`Test 8 Failed: Expected 400 error status, got: ${err8?.statusCode}`);
    }

    // Test 9: Delete Chat
    logger.info('Test 9: Deleting conversation and message logs references...');
    const req9 = {
      params: { id: c1Id },
      user: { id: userId }
    };
    const res9 = mockResponse();
    await chatManagementController.deleteChat(req9, res9, (err) => { if (err) throw err; });

    if (res9.statusCode === 200 && res9.jsonData.success) {
      const dbCheckConv = await query('SELECT id FROM conversations WHERE id = ?', [c1Id]);
      const dbCheckMsg = await query('SELECT id FROM messages WHERE conversation_id = ?', [c1Id]);
      if (dbCheckConv.length === 0 && dbCheckMsg.length === 0) {
        logger.info('Test 9 Passed: Chat session and messages successfully deleted from DB tables.');
      } else {
        throw new Error('Test 9 Failed: Deletion left orphan records in database.');
      }
    } else {
      throw new Error(`Test 9 Failed: Status ${res9.statusCode}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    const conversations = await query('SELECT id FROM conversations WHERE user_id IN (?, ?)', [userId, userIdB]);
    for (const c of conversations) {
      await query('DELETE FROM messages WHERE conversation_id = ?', [c.id]);
    }
    await query('DELETE FROM conversations WHERE user_id IN (?, ?)', [userId, userIdB]);
    await query('DELETE FROM users WHERE id IN (?, ?)', [userId, userIdB]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Chat Management verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Chat Management verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
