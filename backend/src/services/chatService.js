export const chatService = {
  async createConversation(userId, title = 'New Conversation') {
    return {
      id: 101,
      title,
      userId,
      createdAt: new Date().toISOString()
    };
  },

  async getConversations(userId) {
    return [
      { id: 101, title: 'Sample Conversation 1', userId, createdAt: new Date().toISOString() }
    ];
  },

  async addMessage(conversationId, role, content) {
    return {
      id: 201,
      conversationId,
      role,
      content,
      createdAt: new Date().toISOString()
    };
  }
};

export default chatService;
