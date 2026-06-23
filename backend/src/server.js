import app from './app.js';
import config from './config/config.js';
import logger from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`==================================================`);
  logger.info(`DevMate AI backend server listening on port: ${config.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Allowed CORS origin: ${config.corsOrigin}`);
  logger.info(`==================================================`);
});

// Graceful error interceptors for stability
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection detected! Shutting down server safely...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown! Shutting down immediately...', err);
  process.exit(1);
});
