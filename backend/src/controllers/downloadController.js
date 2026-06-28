import downloadService from '../services/downloadService.js';

/**
 * Controller helper to standardize download query validations and response streams.
 */
const processDownloadRequest = async (req, res, next, expectedFeatureTypes) => {
  try {
    const userId = req.user?.id;
    const { id, format } = req.query;

    if (!userId) {
      const error = new Error('Not authorized, missing credentials');
      error.statusCode = 401;
      throw error;
    }

    if (!id || isNaN(parseInt(id, 10))) {
      const error = new Error('Query parameter "id" must be a valid positive integer');
      error.statusCode = 400;
      throw error;
    }

    const cleanFormat = format ? format.toLowerCase().trim() : 'txt';
    if (cleanFormat !== 'txt' && cleanFormat !== 'md') {
      const error = new Error('Query parameter "format" must be either "txt" or "md"');
      error.statusCode = 400;
      throw error;
    }

    const result = await downloadService.exportToFile(
      userId,
      parseInt(id, 10),
      cleanFormat,
      expectedFeatureTypes
    );

    res.setHeader('Content-Type', `${result.mimeType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  } catch (error) {
    next(error);
  }
};

export const downloadController = {
  /**
   * GET /api/download/code
   */
  async downloadCode(req, res, next) {
    await processDownloadRequest(req, res, next, ['code-gen']);
  },

  /**
   * GET /api/download/explanation
   */
  async downloadExplanation(req, res, next) {
    await processDownloadRequest(req, res, next, ['explanation']);
  },

  /**
   * GET /api/download/documentation
   */
  async downloadDocumentation(req, res, next) {
    await processDownloadRequest(req, res, next, ['readme', 'function-docs', 'api-docs', 'comments']);
  },

  /**
   * GET /api/download/review
   */
  async downloadReview(req, res, next) {
    await processDownloadRequest(req, res, next, ['review']);
  },

  /**
   * GET /api/download/learning
   */
  async downloadLearning(req, res, next) {
    await processDownloadRequest(req, res, next, ['learning-assistant']);
  }
};

export default downloadController;
