/**
 * Email Module
 *
 * Centralized email service using Resend.
 * Re-exports all email functions and types from sub-modules.
 */

// Client and shared utilities
export {
  resend,
  log,
  EMAIL_CONFIG,
  escapeHtml,
  formatBudget,
  formatCompanyType,
  formatCompanySize,
  formatConsultingCategory,
  formatTimeline,
  formatLabel,
  type EmailResult,
} from "./client";

// Admin notifications
export {
  sendConsultingLeadNotification,
  sendContactFormNotification,
  sendWaitlistNotification,
  type ConsultingLeadNotificationData,
  type ContactFormNotificationData,
} from "./admin";

// Customer acknowledgments
export {
  sendConsultingLeadAcknowledgment,
  sendContactFormAcknowledgment,
} from "./acknowledgments";

// Affiliate program emails
export {
  sendAffiliateApplicationConfirmation,
  sendAffiliateStatusUpdate,
  type AffiliateApplicationData,
  type AffiliateStatus,
} from "./affiliate";

// Community notifications
export {
  sendCommunityReplyNotification,
  sendCommunityMentionNotification,
  sendCommunityMessageNotification,
  type CommunityReplyNotificationData,
  type CommunityMentionNotificationData,
  type CommunityMessageNotificationData,
} from "./community";

// Wizard brochure
export { sendWizardBrochure, type WizardBrochureData } from "./brochure";
