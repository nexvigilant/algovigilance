/**
 * Community Email Notifications
 *
 * Notifications for community activity: replies, mentions, and direct messages.
 */

import {
  resend,
  log,
  EMAIL_CONFIG,
  escapeHtml,
  type EmailResult,
} from "./client";

// ============================================================================
// Types
// ============================================================================

export interface CommunityReplyNotificationData {
  recipientEmail: string;
  recipientName: string;
  authorName: string;
  postTitle: string;
  replyPreview: string;
  postUrl: string;
}

export interface CommunityMentionNotificationData {
  recipientEmail: string;
  recipientName: string;
  authorName: string;
  contentType: "post" | "reply";
  postTitle: string;
  contentPreview: string;
  postUrl: string;
}

export interface CommunityMessageNotificationData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}

// ============================================================================
// Community Notifications
// ============================================================================

/**
 * Send email notification when someone replies to a user's post
 */
export async function sendCommunityReplyNotification(
  data: CommunityReplyNotificationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn(
      "[email] Resend not configured - skipping community reply notification",
    );
    return { success: false, error: "Email service not configured" };
  }

  const subject = `${data.authorName} replied to your post`;

  // Escape user-provided content to prevent XSS
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeAuthorName = escapeHtml(data.authorName);
  const safePostTitle = escapeHtml(data.postTitle);
  const safeReplyPreview = escapeHtml(data.replyPreview.substring(0, 200));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: white; }
    .content { padding: 32px; }
    .content h1 { color: #1e293b; font-size: 22px; margin: 0 0 16px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .reply-box { background: #f8fafc; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .reply-author { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .reply-content { color: #475569; font-style: italic; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 12px; margin: 0; }
    .footer a { color: #D4AF37; text-decoration: none; }
    .unsubscribe { color: #94a3b8; font-size: 11px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance Community</div>
      </div>
      <div class="content">
        <h1>New reply to your post</h1>
        <p>Hi ${safeRecipientName},</p>
        <p><strong>${safeAuthorName}</strong> replied to your post "<strong>${safePostTitle}</strong>":</p>

        <div class="reply-box">
          <div class="reply-author">${safeAuthorName} wrote:</div>
          <div class="reply-content">"${safeReplyPreview}${data.replyPreview.length > 200 ? "..." : ""}"</div>
        </div>

        <a href="${data.postUrl}" class="cta">View Full Discussion →</a>
      </div>
      <div class="footer">
        <p>AlgoVigilance Community</p>
        <p class="unsubscribe">You're receiving this because you have a post in the community. <a href="https://algovigilance.com/nucleus/settings/notifications">Manage notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    log.debug("[email] Community reply notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send community reply notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification when someone @mentions a user
 */
export async function sendCommunityMentionNotification(
  data: CommunityMentionNotificationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn(
      "[email] Resend not configured - skipping community mention notification",
    );
    return { success: false, error: "Email service not configured" };
  }

  const subject = `${data.authorName} mentioned you in a ${data.contentType}`;

  // Escape user-provided content to prevent XSS
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeAuthorName = escapeHtml(data.authorName);
  const safePostTitle = escapeHtml(data.postTitle);
  const safeContentPreview = escapeHtml(data.contentPreview.substring(0, 200));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: white; }
    .badge { display: inline-block; background: #D4AF3720; color: #D4AF37; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .content { padding: 32px; }
    .content h1 { color: #1e293b; font-size: 22px; margin: 0 0 16px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .mention-highlight { background: #D4AF3720; color: #B8962D; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .content-box { background: #f8fafc; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .content-meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }
    .content-preview { color: #475569; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 12px; margin: 0; }
    .footer a { color: #D4AF37; text-decoration: none; }
    .unsubscribe { color: #94a3b8; font-size: 11px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance Community</div>
        <div class="badge">@mention</div>
      </div>
      <div class="content">
        <h1>You were mentioned!</h1>
        <p>Hi ${safeRecipientName},</p>
        <p><strong>${safeAuthorName}</strong> mentioned you in a ${data.contentType}${data.contentType === "reply" ? " on" : " titled"} "<strong>${safePostTitle}</strong>":</p>

        <div class="content-box">
          <div class="content-meta">${safeAuthorName} · ${data.contentType}</div>
          <div class="content-preview">"${safeContentPreview}${data.contentPreview.length > 200 ? "..." : ""}"</div>
        </div>

        <a href="${data.postUrl}" class="cta">View ${data.contentType === "post" ? "Post" : "Discussion"} →</a>
      </div>
      <div class="footer">
        <p>AlgoVigilance Community</p>
        <p class="unsubscribe">You're receiving this because you were @mentioned. <a href="https://algovigilance.com/nucleus/settings/notifications">Manage notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    log.debug("[email] Community mention notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send community mention notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification when someone sends a direct message
 */
export async function sendCommunityMessageNotification(
  data: CommunityMessageNotificationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn(
      "[email] Resend not configured - skipping community message notification",
    );
    return { success: false, error: "Email service not configured" };
  }

  const subject = `New message from ${data.senderName}`;

  // Escape user-provided content to prevent XSS
  const safeRecipientName = escapeHtml(data.recipientName);
  const safeSenderName = escapeHtml(data.senderName);
  const safeMessagePreview = escapeHtml(data.messagePreview.substring(0, 150));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: white; }
    .message-icon { font-size: 32px; margin-top: 8px; }
    .content { padding: 32px; }
    .content h1 { color: #1e293b; font-size: 22px; margin: 0 0 16px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .message-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .message-sender { font-weight: 600; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .message-sender-dot { width: 8px; height: 8px; background: #D4AF37; border-radius: 50%; }
    .message-content { color: #475569; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 12px; margin: 0; }
    .footer a { color: #D4AF37; text-decoration: none; }
    .unsubscribe { color: #94a3b8; font-size: 11px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance Community</div>
        <div class="message-icon">💬</div>
      </div>
      <div class="content">
        <h1>New message</h1>
        <p>Hi ${safeRecipientName},</p>
        <p><strong>${safeSenderName}</strong> sent you a message:</p>

        <div class="message-box">
          <div class="message-sender">
            <span class="message-sender-dot"></span>
            ${safeSenderName}
          </div>
          <div class="message-content">"${safeMessagePreview}${data.messagePreview.length > 150 ? "..." : ""}"</div>
        </div>

        <a href="${data.conversationUrl}" class="cta">Reply to Message →</a>
      </div>
      <div class="footer">
        <p>AlgoVigilance Community</p>
        <p class="unsubscribe">You're receiving this because someone messaged you. <a href="https://algovigilance.com/nucleus/settings/notifications">Manage notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    log.debug("[email] Community message notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send community message notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
