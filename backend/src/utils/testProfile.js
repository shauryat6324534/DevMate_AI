import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';
import profileController from '../controllers/profileController.js';
import authService from '../services/authService.js';
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
  logger.info('Starting Profile Management Integration Audit...');
  logger.info('==================================================');

  // Pre-test setup
  const emailA = `prof-test-${Date.now()}@devmate.ai`;
  const emailB = `prof-testB-${Date.now()}@devmate.ai`;

  // Create User A
  const hashedPw = await bcrypt.hash('OldPw123!', 12);
  const userARes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User A', emailA, hashedPw]);
  const userId = userARes.insertId;

  // Create User B to test duplicate email constraints
  const userBRes = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ['User B', emailB, hashedPw]);
  const userIdB = userBRes.insertId;

  try {
    // Test 1: Profile Retrieval
    logger.info('Test 1: Retrieving profile info details...');
    const req1 = {
      user: { id: userId }
    };
    const res1 = mockResponse();
    await profileController.getProfile(req1, res1, (err) => { if (err) throw err; });

    if (res1.statusCode === 200 && res1.jsonData.success) {
      const data = res1.jsonData.data;
      if (data.id === userId && data.name === 'User A' && data.email === emailA) {
        logger.info('Test 1 Passed: Profile retrieved successfully.');
      } else {
        throw new Error(`Test 1 Failed: Bad response content: ${JSON.stringify(data)}`);
      }
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.statusCode}`);
    }

    // Test 2: Profile Update
    logger.info('Test 2: Updating name and email values...');
    const updatedEmail = `new-${emailA}`;
    const req2 = {
      body: { name: 'User A Modified', email: updatedEmail },
      user: { id: userId }
    };
    const res2 = mockResponse();
    await profileController.updateProfile(req2, res2, (err) => { if (err) throw err; });

    if (res2.statusCode === 200 && res2.jsonData.success) {
      const dbCheck = await query('SELECT name, email FROM users WHERE id = ?', [userId]);
      if (dbCheck && dbCheck[0].name === 'User A Modified' && dbCheck[0].email === updatedEmail) {
        logger.info('Test 2 Passed: Profile details successfully updated.');
      } else {
        throw new Error('Test 2 Failed: Database updates not matches parameters.');
      }
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.statusCode}`);
    }

    // Test 3: Duplicate Email Validation (400)
    logger.info('Test 3: Checking duplicate email conflict protection bounds (400)...');
    const req3 = {
      body: { name: 'User A Modified', email: emailB }, // Email B is already owned by User B
      user: { id: userId }
    };
    const res3 = mockResponse();
    let err3 = null;
    await profileController.updateProfile(req3, res3, (err) => { err3 = err; });

    if (err3 && err3.statusCode === 400) {
      logger.info('Test 3 Passed: Duplicate email edit successfully rejected with 400.');
    } else {
      throw new Error(`Test 3 Failed: Expected 400 status code, got: ${err3?.statusCode}`);
    }

    // Test 4: Password Change Flow (Successful Case)
    logger.info('Test 4: Requesting secure password change and hashing update...');
    const req4 = {
      body: { currentPassword: 'OldPw123!', newPassword: 'NewPassword999!' },
      user: { id: userId }
    };
    const res4 = mockResponse();
    await profileController.changePassword(req4, res4, (err) => { if (err) throw err; });

    if (res4.statusCode === 200 && res4.jsonData.success) {
      // Verify login works with the updated credentials
      const loginResult = await authService.login(updatedEmail, 'NewPassword999!');
      if (loginResult && loginResult.user.id === userId) {
        logger.info('Test 4 Passed: Password updated, rehashed and authenticated successfully.');
      } else {
        throw new Error('Test 4 Failed: Could not login with the newly updated password.');
      }
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.statusCode}`);
    }

    // Test 5: Wrong Current Password Validation (400)
    logger.info('Test 5: Requesting password change with incorrect current password credentials...');
    const req5 = {
      body: { currentPassword: 'BadPassword!', newPassword: 'ThirdPassword!' },
      user: { id: userId }
    };
    const res5 = mockResponse();
    let err5 = null;
    await profileController.changePassword(req5, res5, (err) => { err5 = err; });

    if (err5 && err5.statusCode === 400) {
      logger.info('Test 5 Passed: Incorrect current password successfully rejected with 400.');
    } else {
      throw new Error(`Test 5 Failed: Expected 400 status, got: ${err5?.statusCode}`);
    }

    // Test 6: Unauthorized Access Checks (401)
    logger.info('Test 6: Fetching profile without auth token context...');
    const req6 = {
      user: null
    };
    const res6 = mockResponse();
    let err6 = null;
    await profileController.getProfile(req6, res6, (err) => { err6 = err; });

    if (err6 && err6.statusCode === 401) {
      logger.info('Test 6 Passed: Access without user credentials blocked with 401.');
    } else {
      throw new Error(`Test 6 Failed: Expected 401, got: ${err6?.statusCode}`);
    }

  } finally {
    // Teardown
    logger.info('Cleaning up database test records...');
    await query('DELETE FROM users WHERE id IN (?, ?)', [userId, userIdB]);
    logger.info('Teardown complete.');
  }
}

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Profile Management verification tests completed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Profile Management verification tests encountered errors:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
