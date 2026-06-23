import mysql from 'mysql2/promise';
import config from './config.js';
import logger from '../utils/logger.js';

logger.info('Initializing MySQL connection pool...');

const dbConfig = {
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  connectionLimit: config.db.connectionLimit,
  waitForConnections: true,
  queueLimit: 0
};

// Create the connection pool
export const pool = mysql.createPool(dbConfig);

logger.info(`MySQL connection pool configured for database "${config.db.name}" on ${config.db.host}:${dbConfig.port || 3306}`);

/**
 * Execute a parameterized database query.
 * Handles automatic acquiring and releasing of pool connections.
 * 
 * @param {string} sql - SQL query template
 * @param {Array} [params] - Query parameter bindings
 * @returns {Promise<any>} - Query result rows
 */
export const query = async (sql, params = []) => {
  const start = Date.now();
  try {
    logger.debug(`Executing query: ${sql.trim().replace(/\s+/g, ' ')} | Params: ${JSON.stringify(params)}`);
    const [results] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed successfully in ${duration}ms`);
    return results;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Database query failed in ${duration}ms: ${sql.trim()}`, error);
    throw error;
  }
};

export default {
  pool,
  query
};
