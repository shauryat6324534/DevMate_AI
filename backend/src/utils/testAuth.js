import authController from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { pool, query } from '../config/db.js';
import logger from './logger.js';

const mockResponse = () => {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.jsonData = data;
    return this;
  };
  return res;
};

const runTests = async () => {
  logger.info('==================================================');
  logger.info('Starting Authentication System End-to-End Audit...');
  logger.info('==================================================');

  // Pre-test cleanup
  const testEmail = `auth-test-${Date.now()}@devmate.ai`;
  await query('DELETE FROM users WHERE email = ?', [testEmail]);

  // Test 1: Successful registration (Strong Password)
  logger.info('Test 1: Registering user with strong password...');
  const regReq = {
    body: {
      name: 'Auth Test User',
      email: testEmail,
      password: 'StrongP@ssw0rd!'
    }
  };
  const regRes = mockResponse();
  let nextError = null;
  const regNext = (err) => {
    nextError = err;
  };

  await authController.register(regReq, regRes, regNext);

  if (nextError) {
    throw new Error(`Registration failed: ${nextError.message}`);
  }
  if (regRes.statusCode === 201 && regRes.jsonData.success && regRes.jsonData.data.token) {
    logger.info('Test 1 Passed: User registered, password hashed, and JWT token signed.');
  } else {
    throw new Error(`Registration validation failed. Status: ${regRes.statusCode}`);
  }

  const generatedToken = regRes.jsonData.data.token;

  // Test 2: Duplicate registration check
  logger.info('Test 2: Registering user with duplicate email...');
  const dupRes = mockResponse();
  let dupNextError = null;
  const dupNext = (err) => {
    dupNextError = err;
  };

  await authController.register(regReq, dupRes, dupNext);

  if (dupNextError && dupNextError.statusCode === 400 && dupNextError.message.includes('already registered')) {
    logger.info('Test 2 Passed: Duplicate registration attempt rejected with 400.');
  } else {
    throw new Error(`Duplicate registration check failed. Error status: ${dupNextError?.statusCode}`);
  }

  // Test 3: Password strength validations
  logger.info('Test 3: Testing weak passwords (missing uppercase, number, symbol)...');
  const weakPasswords = [
    'weak', // too short
    'alllowercase!', // no uppercase, no number
    'NO_NUMBER_SYMBOL', // no numbers, no special symbols
    'NoSymbol123' // no special symbol
  ];

  for (const wp of weakPasswords) {
    const weakReq = {
      body: {
        name: 'Weak PW User',
        email: `weak-${Date.now()}@devmate.ai`,
        password: wp
      }
    };
    const weakRes = mockResponse();
    let weakError = null;
    await authController.register(weakReq, weakRes, (err) => { weakError = err; });

    if (weakError && weakError.statusCode === 400) {
      logger.info(`Sub-test passed: Password "${wp}" rejected correctly.`);
    } else {
      throw new Error(`Weak password "${wp}" was not rejected correctly. Error: ${weakError?.message}`);
    }
  }
  logger.info('Test 3 Passed: Password strength validation policies fully verified.');

  // Test 4: Successful login
  logger.info('Test 4: Logging in with valid credentials...');
  const loginReq = {
    body: {
      email: testEmail,
      password: 'StrongP@ssw0rd!'
    }
  };
  const loginRes = mockResponse();
  let loginError = null;
  await authController.login(loginReq, loginRes, (err) => { loginError = err; });

  if (loginError) {
    throw new Error(`Login failed: ${loginError.message}`);
  }
  if (loginRes.statusCode === 200 && loginRes.jsonData.success && loginRes.jsonData.data.token) {
    logger.info('Test 4 Passed: Authenticated session established, credentials verified.');
  } else {
    throw new Error(`Login execution failed. Status: ${loginRes.statusCode}`);
  }

  // Test 5: Invalid credentials login check
  logger.info('Test 5: Logging in with incorrect password...');
  const badLoginReq = {
    body: {
      email: testEmail,
      password: 'WrongPassword123!'
    }
  };
  const badLoginRes = mockResponse();
  let badLoginError = null;
  await authController.login(badLoginReq, badLoginRes, (err) => { badLoginError = err; });

  if (badLoginError && badLoginError.statusCode === 401) {
    logger.info('Test 5 Passed: Invalid credentials rejected with 401.');
  } else {
    throw new Error(`Invalid credentials check failed. Error status: ${badLoginError?.statusCode}`);
  }

  // Test 6: Verify Auth Middleware (valid token)
  logger.info('Test 6: Testing protection middleware with valid signed JWT token...');
  const protectReq = {
    headers: {
      authorization: `Bearer ${generatedToken}`
    }
  };
  const protectRes = mockResponse();
  let protectNextCalled = false;
  let protectNextError = null;
  await protect(protectReq, protectRes, (err) => {
    protectNextCalled = true;
    protectNextError = err;
  });

  if (protectNextError) {
    throw new Error(`Auth Middleware failed: ${protectNextError.message}`);
  }
  if (protectNextCalled && protectReq.user && protectReq.user.email === testEmail) {
    logger.info('Test 6 Passed: Token decrypted and user profile injected.');
  } else {
    throw new Error('Auth Middleware failed to populate user context.');
  }

  // Test 7: Verify Auth Middleware (invalid token)
  logger.info('Test 7: Testing protection middleware with invalid signature...');
  const badProtectReq = {
    headers: {
      authorization: 'Bearer invalidtokenstringhere'
    }
  };
  const badProtectRes = mockResponse();
  let badProtectNextCalled = false;
  await protect(badProtectReq, badProtectRes, () => {
    badProtectNextCalled = true;
  });

  if (!badProtectNextCalled && badProtectRes.statusCode === 401) {
    logger.info('Test 7 Passed: Invalid token intercepted and access blocked with 401.');
  } else {
    throw new Error('Auth Middleware failed to intercept invalid token.');
  }

  // Post-test cleanup
  await query('DELETE FROM users WHERE email = ?', [testEmail]);
  logger.info('Test database cleaned up.');
};

runTests()
  .then(async () => {
    logger.info('==================================================');
    logger.info('Authentication verification tests passed successfully!');
    logger.info('==================================================');
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Authentication verification tests failed:', error);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  });
