/**
 * Discovery Module Actions
 * 
 * Performance-optimized community discovery, matching, and search.
 * 
 * @module actions/discovery
 */

export {
  getPersonalizedCommunities,
  getCommunityStats,
  type CommunityPreview,
  type DiscoveryQuizData,
} from './core';

export {
  getNeuralCircleMatches,
  generateUserEmbedding,
} from './embeddings';

export {
  getCircleMatches,
  type CircleMatch,
  type QuizData,
} from './matching';

export {
  getForumRecommendations,
  getPostRecommendations,
  performSemanticSearch,
  getFindYourHomeAnalysis,
} from './recommendations';

export {
  searchPostsWithFilters,
} from './search';

export {
  getDiscoveryDataFromStorage,
  saveDiscoveryDataToStorage,
  clearDiscoveryDataFromStorage,
} from './storage';