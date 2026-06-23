import { query, pool } from '../config/db.js';
import logger from './logger.js';

const testDb = async () => {
  logger.info('==================================================');
  logger.info('Starting Database Integration and Cascading Audit...');
  logger.info('==================================================');

  // Test 1: Simple query verification
  logger.info('Test 1: Testing basic arithmetic query...');
  const mathResults = await query('SELECT 1 + 2 AS result');
  if (mathResults && mathResults[0] && mathResults[0].result === 3) {
    logger.info('Test 1 Passed: Query execution and pool thread routing verified.');
  } else {
    throw new Error('Arithmetic query yielded unexpected result or empty rows.');
  }

  // Test 2: Inserting a mock user
  logger.info('Test 2: Inserting mock user into "users" table...');
  const userEmail = `test-${Date.now()}@devmate.ai`;
  const insertUserResult = await query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    ['Test User', userEmail, 'securepassword']
  );
  const userId = insertUserResult.insertId;
  logger.info(`Test 2 Passed: Mock user inserted with ID: ${userId}`);

  // Test 3: Inserting mock conversation linked to user
  logger.info('Test 3: Inserting mock conversation linked to user...');
  const insertConvResult = await query(
    'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
    [userId, 'Test Session Title']
  );
  const convId = insertConvResult.insertId;
  logger.info(`Test 3 Passed: Mock conversation inserted with ID: ${convId}`);

  // Test 4: Inserting mock message linked to conversation
  logger.info('Test 4: Inserting mock message linked to conversation...');
  await query(
    'INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)',
    [convId, 'user', 'Hello DevMate AI! Testing mysql connection pool.']
  );
  logger.info('Test 4 Passed: Mock message inserted successfully.');

  // Test 5: Verify cascading deletion rule
  logger.info('Test 5: Testing Cascade deletion constraint by deleting the parent user...');
  await query('DELETE FROM users WHERE id = ?', [userId]);
  logger.info('Parent user deleted.');

  // Check if conversation was automatically deleted
  const conversations = await query('SELECT * FROM conversations WHERE id = ?', [convId]);
  if (conversations.length === 0) {
    logger.info('Test 5 Passed: Conversation automatically cascaded and deleted.');
  } else {
    throw new Error('Relational constraint failure: Child conversation was not deleted.');
  }
};

testDb()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Database testing completed successfully. Pool operational.');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Database connectivity/relation check failed:', error);
    try {
      await pool.end();
    } catch (e) {
      // Ignored
    }
    process.exit(1);
  });
