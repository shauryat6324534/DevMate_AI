import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { query } from '../config/db.js';
import { sendError } from '../utils/responseHelper.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware ensuring endpoints are protected.
 * Verifies JWT signature and extracts the logged-in user context.
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Extract Bearer token from headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      logger.warn('Auth Middleware: Access denied. Missing authorization token.');
      return sendError(res, 'Not authorized, authorization token is missing', 401);
    }

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      logger.warn(`Auth Middleware: JWT verification failed. Error: ${err.message}`);
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Not authorized, session expired', 401);
      }
      return sendError(res, 'Not authorized, invalid token signature', 401);
    }

    // 3. Verify user still exists in the database
    const users = await query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
    if (!users || users.length === 0) {
      logger.warn(`Auth Middleware: User with ID ${decoded.id} no longer exists.`);
      return sendError(res, 'Not authorized, user account no longer exists', 401);
    }

    // 4. Inject verified user context into the request object
    req.user = users[0];
    return next();
  } catch (error) {
    logger.error('Auth Middleware: Unexpected validation failure:', error);
    return next(error);
  }
};

export default protect;
