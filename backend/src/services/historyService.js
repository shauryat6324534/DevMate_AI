export const historyService = {
  async logActivity(userId, actionType, details = {}) {
    return {
      id: 5001,
      userId,
      actionType,
      details,
      timestamp: new Date().toISOString()
    };
  },

  async getUserHistory(userId) {
    // Return empty logs or placeholder list for user isolation checks
    return [
      { id: 5001, userId, actionType: 'code-gen', timestamp: new Date().toISOString() }
    ];
  }
};

export default historyService;
