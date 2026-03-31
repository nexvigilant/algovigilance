/**
 * Community Components
 *
 * Barrel export for all community-specific components.
 * Components are organized by domain for maintainability.
 */

// Posts
export * from './posts/post-editor';
export * from './posts/post-search';
export * from './posts/post-header';
export * from './posts/post-list';
export * from './posts/post-actions-menu';
export * from './posts/post-attachment-display';
export * from './posts/post-attachments';
export * from './posts/post-template-selector';
export * from './posts/edit-post-dialog';
export * from './posts/reply-card';
export * from './posts/reply-form';

// Circles
export * from './circles/enhanced-circle-card';
export * from './circles/join-request-dialog';
export * from './circles/join-requests-panel';
export * from './circles/category-cards';
export * from './circles/trending-forums';
export * from './circles/trending-topics';
export * from './circles/tag-cloud';

// Members
export * from './members/member-card';
export * from './members/member-filters';
export * from './members/follow-button';
export * from './members/profile-edit-form';
export * from './members/edit-profile-button';
export * from './members/avatar-uploader';
export * from './members/reputation-card';
export * from './members/badge-progress';
export * from './members/badges-display';

// Messaging
export * from './messaging/message-thread';
export * from './messaging/message-user-button';
export * from './messaging/conversations-list';
export * from './messaging/notification-bell';
export * from './messaging/notification-center';

// Navigation
export * from './navigation/community-sidebar';
export * from './navigation/community-breadcrumbs';
export * from './navigation/pathway-mini-map';

// Shared
export * from './shared/reaction-picker';
export * from './shared/reaction-picker-wrapper';
export * from './shared/onboarding-gate';
export * from './shared/community-tracker';
export * from './shared/community-vitality';
export * from './shared/fast-actions';
export * from './shared/first-post-nudge';

// Config
export * from './community-hub-config';
