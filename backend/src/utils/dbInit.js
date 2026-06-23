import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDatabase = async () => {
  logger.info('==================================================');
  logger.info('Starting Database Initialization Runner...');
  logger.info(`Target Host: ${config.db.host}`);
  logger.info(`Target Database: ${config.db.name}`);
  logger.info('==================================================');

  // Step 1: Connect to MySQL server (without database context) to check/create DB
  let tempConnection;
  try {
    tempConnection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password
    });
    
    logger.info(`Verifying or creating database "${config.db.name}"...`);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\``);
    logger.info(`Database "${config.db.name}" is verified and active.`);
  } catch (error) {
    logger.error('Failed to create target database:', error);
    throw error;
  } finally {
    if (tempConnection) {
      await tempConnection.end();
    }
  }

  // Step 2: Connect to specific target database to initialize relational schemas
  let dbConnection;
  try {
    dbConnection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      multipleStatements: true // Enabled to run schema.sql as a single query transaction
    });

    const schemaPath = path.resolve(__dirname, '../config/schema.sql');
    logger.info(`Loading DDL structures from path: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing DDL creation transactions...');
    await dbConnection.query(schemaSql);
    logger.info('Relational tables (users, conversations, messages, history, downloads) initialized successfully.');
  } catch (error) {
    logger.error('Schema initialization failed:', error);
    throw error;
  } finally {
    if (dbConnection) {
      await dbConnection.end();
    }
  }
};

// Execute runner
initDatabase()
  .then(() => {
    logger.info('Database setup completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Database setup runner crashed.', error);
    process.exit(1);
  });
