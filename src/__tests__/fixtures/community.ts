/**
 * Community Test Fixtures
 *
 * Provides pre-configured community data for testing (posts, reactions, messages, etc).
 */

// ============================================================================
// Post Fixtures
// ============================================================================

export const testPosts = {
  /**
   * Basic text post
   */
  basic: {
    id: 'post-basic',
    userId: 'user-professional',
    content: 'This is a basic test post',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    likes: 10,
    comments: 5,
    tags: ['test', 'basic'],
  },

  /**
   * Post with rich content
   */
  rich: {
    id: 'post-rich',
    userId: 'user-professional',
    content: '# My Experience\n\nThis is a **rich** post with *markdown*.',
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-01-16').toISOString(),
    likes: 25,
    comments: 12,
    tags: ['experience', 'pharma'],
    images: ['https://example.com/image.jpg'],
  },

  /**
   * Highly engaged post
   */
  trending: {
    id: 'post-trending',
    userId: 'user-moderator',
    content: 'Check out this amazing insight about AI in pharma!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 150,
    comments: 45,
    shares: 20,
    tags: ['ai', 'trending', 'insights'],
    isPinned: true,
  },

  /**
   * Post by admin
   */
  announcement: {
    id: 'post-announcement',
    userId: 'user-admin',
    content: 'Important platform announcement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 50,
    comments: 10,
    tags: ['announcement', 'admin'],
    isPinned: true,
    isAnnouncement: true,
  },
};

// ============================================================================
// Comment/Reply Fixtures
// ============================================================================

export const testComments = {
  /**
   * Basic comment
   */
  basic: {
    id: 'comment-basic',
    postId: 'post-basic',
    userId: 'user-practitioner',
    content: 'Great post!',
    createdAt: new Date('2024-01-16').toISOString(),
    likes: 2,
  },

  /**
   * Detailed reply
   */
  detailed: {
    id: 'comment-detailed',
    postId: 'post-rich',
    userId: 'user-professional',
    content: 'This is very insightful. I had a similar experience...',
    createdAt: new Date('2024-01-17').toISOString(),
    likes: 8,
  },

  /**
   * Nested reply
   */
  nested: {
    id: 'comment-nested',
    postId: 'post-basic',
    parentId: 'comment-basic',
    userId: 'user-moderator',
    content: 'I agree with this comment!',
    createdAt: new Date('2024-01-18').toISOString(),
    likes: 1,
  },
};

// ============================================================================
// Reaction Fixtures
// ============================================================================

export const testReactions = {
  like: {
    id: 'reaction-like',
    userId: 'user-practitioner',
    targetType: 'post' as const,
    targetId: 'post-basic',
    reactionType: 'like' as const,
    createdAt: new Date().toISOString(),
  },

  love: {
    id: 'reaction-love',
    userId: 'user-professional',
    targetType: 'post' as const,
    targetId: 'post-rich',
    reactionType: 'love' as const,
    createdAt: new Date().toISOString(),
  },

  insightful: {
    id: 'reaction-insightful',
    userId: 'user-moderator',
    targetType: 'post' as const,
    targetId: 'post-trending',
    reactionType: 'insightful' as const,
    createdAt: new Date().toISOString(),
  },

  helpful: {
    id: 'reaction-helpful',
    userId: 'user-admin',
    targetType: 'comment' as const,
    targetId: 'comment-detailed',
    reactionType: 'helpful' as const,
    createdAt: new Date().toISOString(),
  },
};

// ============================================================================
// Conversation/Message Fixtures
// ============================================================================

export const testConversations = {
  /**
   * Active conversation
   */
  active: {
    id: 'conv-active',
    participants: ['user-practitioner', 'user-professional'],
    createdAt: new Date('2024-01-10').toISOString(),
    lastMessageAt: new Date().toISOString(),
    lastMessage: 'Thanks for the help!',
  },

  /**
   * Archived conversation
   */
  archived: {
    id: 'conv-archived',
    participants: ['user-moderator', 'user-admin'],
    createdAt: new Date('2024-01-01').toISOString(),
    lastMessageAt: new Date('2024-01-05').toISOString(),
    lastMessage: 'Issue resolved',
    isArchived: true,
  },
};

export const testMessages = {
  /**
   * First message in conversation
   */
  first: {
    id: 'msg-first',
    conversationId: 'conv-active',
    senderId: 'user-practitioner',
    content: 'Hi, I have a question about the course',
    createdAt: new Date('2024-01-10T10:00:00').toISOString(),
    isRead: true,
  },

  /**
   * Reply message
   */
  reply: {
    id: 'msg-reply',
    conversationId: 'conv-active',
    senderId: 'user-professional',
    content: 'Sure, happy to help! What\'s your question?',
    createdAt: new Date('2024-01-10T10:05:00').toISOString(),
    isRead: true,
  },

  /**
   * Unread message
   */
  unread: {
    id: 'msg-unread',
    conversationId: 'conv-active',
    senderId: 'user-practitioner',
    content: 'Thanks for the help!',
    createdAt: new Date().toISOString(),
    isRead: false,
  },
};

// ============================================================================
// Forum Topic Fixtures
// ============================================================================

export const testTopics = {
  /**
   * Active topic
   */
  active: {
    id: 'topic-active',
    name: 'Career Advice',
    description: 'Discuss career transitions and opportunities',
    slug: 'career-advice',
    icon: '💼',
    postCount: 150,
    followerCount: 200,
    createdAt: new Date('2024-01-01').toISOString(),
  },

  /**
   * Technical topic
   */
  technical: {
    id: 'topic-technical',
    name: 'AI & Technology',
    description: 'Discussions about AI, ML, and safety technology',
    slug: 'ai-technology',
    icon: '🤖',
    postCount: 95,
    followerCount: 150,
    createdAt: new Date('2024-01-01').toISOString(),
  },

  /**
   * General discussion
   */
  general: {
    id: 'topic-general',
    name: 'General Discussion',
    description: 'General topics and community chat',
    slug: 'general',
    icon: '💬',
    postCount: 300,
    followerCount: 400,
    createdAt: new Date('2024-01-01').toISOString(),
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a custom test post
 */
export function createTestPost(overrides: Partial<typeof testPosts.basic> = {}) {
  return {
    ...testPosts.basic,
    ...overrides,
    id: overrides.id || `post-${Date.now()}`,
  };
}

/**
 * Creates a custom test comment
 */
export function createTestComment(overrides: Partial<typeof testComments.basic> = {}) {
  return {
    ...testComments.basic,
    ...overrides,
    id: overrides.id || `comment-${Date.now()}`,
  };
}

/**
 * Creates a custom test reaction
 */
export function createTestReaction(overrides: Partial<typeof testReactions.like> = {}) {
  return {
    ...testReactions.like,
    ...overrides,
    id: overrides.id || `reaction-${Date.now()}`,
  };
}

/**
 * Creates a custom test message
 */
export function createTestMessage(overrides: Partial<typeof testMessages.first> = {}) {
  return {
    ...testMessages.first,
    ...overrides,
    id: overrides.id || `msg-${Date.now()}`,
  };
}
