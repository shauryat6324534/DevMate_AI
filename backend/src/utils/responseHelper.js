/**
 * Standardized success response formatter.
 */
export const sendSuccess = (res, data, status = 200, message = 'Success') => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Standardized error response formatter.
 */
export const sendError = (res, error, status = 500, details = null) => {
  const payload = {
    success: false,
    error: typeof error === 'string' ? error : error.message || 'Internal Server Error'
  };
  if (details !== null && details !== undefined) {
    payload.details = details;
  }
  return res.status(status).json(payload);
};

export default {
  sendSuccess,
  sendError
};
