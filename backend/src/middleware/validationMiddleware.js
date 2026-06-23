import { sendError } from '../utils/responseHelper.js';

/**
 * Sprint 1 placeholder validation middleware.
 * Validates existence of body and provides layout for schema checks.
 */
export const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, 'Request body is missing or empty', 400);
    }

    const missingFields = requiredFields.filter(field => !(field in req.body));
    if (missingFields.length > 0) {
      return sendError(
        res, 
        `Missing required fields: ${missingFields.join(', ')}`, 
        400
      );
    }

    return next();
  };
};

export default validateBody;
