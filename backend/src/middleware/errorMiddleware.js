import logger from '../utils/logger.js';
import { sendError } from '../utils/responseHelper.js';
import config from '../config/config.js';

export const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error during request [${req.method}] ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Only expose stacks/details in development
  const details = config.env === 'development' ? err.stack : null;

  return sendError(res, message, statusCode, details);
};

export default globalErrorHandler;
