/**
 * Global Configuration Constants and Thresholds
 */

export const MODERATION_THRESHOLDS = {
  autoApprove: 0.15,
  autoAction: 0.92,
  highRisk: 0.8,
  moderateRisk: 0.5,
};

export const PIPELINE_CONFIG = {
  defaultBatchSize: 50,
  maxRetries: 3,
  parallelWorkers: 3,
};

export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerPost: 5,
};

export const UI_THRESHOLDS = {
  infiniteScroll: 0.8,
  engagementMinConfidence: 0.3,
  badgeProgressPrecision: 1,
  GESTURE_DEFAULT: 50,
};

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};
