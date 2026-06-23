export const downloadService = {
  async prepareDownload(content, format = 'markdown') {
    const ext = format === 'markdown' ? 'md' : 'txt';
    const filename = `devmate-export-${Date.now()}.${ext}`;

    return {
      filename,
      content,
      mimeType: format === 'markdown' ? 'text/markdown' : 'text/plain'
    };
  }
};

export default downloadService;
