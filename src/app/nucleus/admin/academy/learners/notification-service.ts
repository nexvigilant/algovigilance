'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { logger } from '@/lib/logger';
const log = logger.scope('learners/notification-service');

/**
 * Email templates for moderation notifications
 */
const EMAIL_TEMPLATES = {
  warning: {
    subject: 'Important Notice: Community Guidelines Warning',
    getHtml: (data: {
      userName: string;
      warningLevel: string;
      reason: string;
      expiresAt?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Community Guidelines Warning</h2>
        <p>Hello ${data.userName},</p>
        <p>We're writing to inform you that your account has received a <strong>${data.warningLevel}</strong> warning due to a violation of our community guidelines.</p>
        <div style="background-color: #fef3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
          ${data.expiresAt ? `<p style="margin: 8px 0 0 0;"><strong>Expires:</strong> ${data.expiresAt}</p>` : ''}
        </div>
        <p>Please review our <a href="https://algovigilance.net/community-guidelines">Community Guidelines</a> to ensure future compliance.</p>
        <p>If you believe this warning was issued in error, you can submit an appeal through your account settings.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },

  suspension: {
    subject: 'Account Suspended',
    getHtml: (data: {
      userName: string;
      reason: string;
      duration: string;
      endsAt?: string;
      canAppeal: boolean;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Account Suspended</h2>
        <p>Hello ${data.userName},</p>
        <p>Your AlgoVigilance account has been suspended due to violations of our Terms of Service or Community Guidelines.</p>
        <div style="background-color: #f8d7da; border: 1px solid #dc3545; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
          <p style="margin: 8px 0 0 0;"><strong>Duration:</strong> ${data.duration}</p>
          ${data.endsAt ? `<p style="margin: 8px 0 0 0;"><strong>Ends:</strong> ${data.endsAt}</p>` : ''}
        </div>
        <p>During this suspension period, you will not be able to:</p>
        <ul>
          <li>Post in the community</li>
          <li>Send messages</li>
          <li>Comment on posts</li>
          <li>Access certain features</li>
        </ul>
        ${
          data.canAppeal
            ? `<p>If you believe this suspension was issued in error, you may submit an appeal through your account settings once you can log in again, or by emailing <a href="mailto:appeals@nexvigilant.com">appeals@nexvigilant.com</a>.</p>`
            : ''
        }
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },

  appealApproved: {
    subject: 'Appeal Approved - Account Restored',
    getHtml: (data: {
      userName: string;
      originalAction: string;
      reviewerNotes?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Appeal Approved</h2>
        <p>Hello ${data.userName},</p>
        <p>Great news! Your appeal regarding the <strong>${data.originalAction}</strong> has been reviewed and <strong>approved</strong>.</p>
        ${
          data.reviewerNotes
            ? `
        <div style="background-color: #d4edda; border: 1px solid #28a745; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Reviewer Notes:</strong> ${data.reviewerNotes}</p>
        </div>
        `
            : ''
        }
        <p>Your account has been fully restored and you can resume normal activity on the platform.</p>
        <p>Thank you for your patience during the review process.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },

  appealDenied: {
    subject: 'Appeal Decision - Not Approved',
    getHtml: (data: {
      userName: string;
      originalAction: string;
      reviewerNotes?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6c757d;">Appeal Decision</h2>
        <p>Hello ${data.userName},</p>
        <p>After careful review, your appeal regarding the <strong>${data.originalAction}</strong> has <strong>not been approved</strong>.</p>
        ${
          data.reviewerNotes
            ? `
        <div style="background-color: #f5f5f5; border: 1px solid #6c757d; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Reviewer Notes:</strong> ${data.reviewerNotes}</p>
        </div>
        `
            : ''
        }
        <p>The original action will remain in effect. If you have additional information that wasn't included in your original appeal, you may submit a new appeal in 30 days.</p>
        <p>If you have questions about this decision, please contact <a href="mailto:support@nexvigilant.com">support@nexvigilant.com</a>.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },

  contentRemoved: {
    subject: 'Content Removed - Community Guidelines Violation',
    getHtml: (data: {
      userName: string;
      contentType: string;
      violationCategory: string;
      contentSnippet: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Content Removed</h2>
        <p>Hello ${data.userName},</p>
        <p>Your ${data.contentType} has been removed because it violated our community guidelines.</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Violation:</strong> ${data.violationCategory}</p>
          <p style="margin: 8px 0 0 0;"><strong>Content:</strong> "${data.contentSnippet}..."</p>
        </div>
        <p>Please review our <a href="https://algovigilance.net/community-guidelines">Community Guidelines</a> before posting again.</p>
        <p>Repeated violations may result in warnings or account suspension.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },

  reactivation: {
    subject: 'Account Reactivated',
    getHtml: (data: { userName: string; reason?: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Account Reactivated</h2>
        <p>Hello ${data.userName},</p>
        <p>Your AlgoVigilance account has been reactivated and you can now resume normal activity on the platform.</p>
        ${
          data.reason
            ? `
        <div style="background-color: #d4edda; border: 1px solid #28a745; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Note:</strong> ${data.reason}</p>
        </div>
        `
            : ''
        }
        <p>Please continue to follow our <a href="https://algovigilance.net/community-guidelines">Community Guidelines</a> to maintain good standing.</p>
        <p>Welcome back!</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AlgoVigilance. Please do not reply to this email.
        </p>
      </div>
    `,
  },
};

/**
 * Get user email from Firestore
 */
async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    if (!userData) return null;
    return {
      email: userData.email,
      name: userData.name || userData.displayName || 'Member',
    };
  } catch (error) {
    log.error('Error getting user email:', error);
    return null;
  }
}

/**
 * Send email via Firebase Email Extension
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await adminDb.collection('mail').add({
      to,
      message: {
        subject,
        html,
      },
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    log.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send warning notification email
 */
export async function sendWarningNotification(
  userId: string,
  warningLevel: string,
  reason: string,
  expiresAt?: Date
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.warning;
  const html = template.getHtml({
    userName: user.name,
    warningLevel,
    reason,
    expiresAt: expiresAt?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  });

  return sendEmail(user.email, template.subject, html);
}

/**
 * Send suspension notification email
 */
export async function sendSuspensionNotification(
  userId: string,
  reason: string,
  duration: string,
  endsAt?: Date,
  canAppeal: boolean = true
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.suspension;
  const html = template.getHtml({
    userName: user.name,
    reason,
    duration,
    endsAt: endsAt?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    canAppeal,
  });

  return sendEmail(user.email, template.subject, html);
}

/**
 * Send appeal approved notification email
 */
export async function sendAppealApprovedNotification(
  userId: string,
  originalAction: string,
  reviewerNotes?: string
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.appealApproved;
  const html = template.getHtml({
    userName: user.name,
    originalAction,
    reviewerNotes,
  });

  return sendEmail(user.email, template.subject, html);
}

/**
 * Send appeal denied notification email
 */
export async function sendAppealDeniedNotification(
  userId: string,
  originalAction: string,
  reviewerNotes?: string
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.appealDenied;
  const html = template.getHtml({
    userName: user.name,
    originalAction,
    reviewerNotes,
  });

  return sendEmail(user.email, template.subject, html);
}

/**
 * Send content removed notification email
 */
export async function sendContentRemovedNotification(
  userId: string,
  contentType: string,
  violationCategory: string,
  contentSnippet: string
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.contentRemoved;
  const html = template.getHtml({
    userName: user.name,
    contentType,
    violationCategory,
    contentSnippet: contentSnippet.substring(0, 100),
  });

  return sendEmail(user.email, template.subject, html);
}

/**
 * Send reactivation notification email
 */
export async function sendReactivationNotification(
  userId: string,
  reason?: string
): Promise<boolean> {
  const user = await getUserEmail(userId);
  if (!user) return false;

  const template = EMAIL_TEMPLATES.reactivation;
  const html = template.getHtml({
    userName: user.name,
    reason,
  });

  return sendEmail(user.email, template.subject, html);
}
