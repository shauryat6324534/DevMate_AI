import downloadService from '../services/downloadService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const downloadController = {
  async prepareDownload(req, res, next) {
    try {
      const { content, format } = req.body;

      if (!content) {
        const error = new Error('Content property is required for file preparation');
        error.statusCode = 400;
        throw error;
      }

      const result = await downloadService.prepareDownload(content, format);
      return sendSuccess(res, result, 200, 'Download configuration prepared successfully');
    } catch (error) {
      next(error);
    }
  }
};

export default downloadController;
