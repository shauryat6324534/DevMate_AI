import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const authService = {
  /**
   * Register a new user in the database.
   * Checks for duplicates and hashes the password before saving.
   */
  async register(name, email, password) {
    logger.info(`Auth Service: Attempting registration for email: ${email}`);

    // Check if user already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers && existingUsers.length > 0) {
      const error = new Error('Email is already registered');
      error.statusCode = 400;
      throw error;
    }

    // Hash the password (using 12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database
    const insertResult = await query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    const userId = insertResult.insertId;
    logger.info(`Auth Service: User successfully created with ID: ${userId}`);

    // Generate JWT token
    const token = this.generateToken(userId);

    return {
      user: {
        id: userId,
        name,
        email
      },
      token
    };
  },

  /**
   * Log in an existing user.
   * Compares the password using bcrypt.
   */
  async login(email, password) {
    logger.info(`Auth Service: Attempting login for email: ${email}`);

    // Fetch user details
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const user = users[0];

    // Verify password match
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    logger.info(`Auth Service: Password verification passed for user ID: ${user.id}`);

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  },

  /**
   * Generate a JWT token signed with user context.
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId }, 
      config.jwtSecret, 
      { expiresIn: config.jwtExpiresIn }
    );
  }
};

export default authService;
