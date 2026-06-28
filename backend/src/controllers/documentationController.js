import documentationService from '../services/documentationService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const documentationController = {
  /**
   * Generates project README documentation.
   */
  async generateReadme(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await documentationService.generateReadme(userId, code.trim());
      return sendSuccess(res, result, 200, 'README generation completed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generates detailed function documentation.
   */
  async generateFunctionDocs(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await documentationService.generateFunctionDocs(userId, code.trim());
      return sendSuccess(res, result, 200, 'Function documentation generation completed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generates endpoint and request/response API documentation.
   */
  async generateApiDocs(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await documentationService.generateApiDocs(userId, code.trim());
      return sendSuccess(res, result, 200, 'API documentation generation completed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Appends inline commentary comments into source code.
   */
  async generateComments(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error('Not authorized, missing credentials');
        error.statusCode = 401;
        throw error;
      }

      if (!code || typeof code !== 'string' || code.trim() === '') {
        const error = new Error('Code block parameter is required');
        error.statusCode = 400;
        throw error;
      }

      const result = await documentationService.generateComments(userId, code.trim());
      return sendSuccess(res, result, 200, 'Inline comments generation completed');
    } catch (error) {
      next(error);
    }
  }
};

export default documentationController;
