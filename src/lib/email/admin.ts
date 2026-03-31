/**
 * Admin Email Notifications
 *
 * Notifications sent to administrators for new leads and contact submissions.
 */

import {
  resend,
  log,
  EMAIL_CONFIG,
  escapeHtml,
  formatBudget,
  formatLabel,
  type EmailResult,
} from "./client";

// ============================================================================
// Types
// ============================================================================

export interface ConsultingLeadNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  companyName: string;
  companyType: string;
  companySize: string;
  consultingCategory: string;
  functionalArea?: string | null;
  budgetRange?: string | null;
  timeline: string;
  challengeDescription: string;
  leadScore: number;
  source?: string;
}

export interface ContactFormNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string | null;
  companyType?: string | null;
  serviceInterest?: string | null;
  timeline?: string | null;
  subject: string;
  message: string;
  source?: string;
}

// ============================================================================
// Admin Notifications
// ============================================================================

/**
 * Send notification to admin about new consulting lead
 */
export async function sendConsultingLeadNotification(
  data: ConsultingLeadNotificationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping notification");
    return { success: false, error: "Email service not configured" };
  }

  const priorityLabel =
    data.leadScore >= 100
      ? "🔥 HIGH PRIORITY"
      : data.leadScore >= 60
        ? "⚡ PRIORITY"
        : "";
  const subject =
    `${priorityLabel} New Consulting Lead: ${data.companyName} (Score: ${data.leadScore})`.trim();

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeLastName = escapeHtml(data.lastName);
  const safeEmail = escapeHtml(data.email);
  const safeJobTitle = data.jobTitle ? escapeHtml(data.jobTitle) : null;
  const safeCompanyName = escapeHtml(data.companyName);
  const safeChallengeDescription = escapeHtml(data.challengeDescription);
  const safeSource = data.source ? escapeHtml(data.source) : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; color: #D4AF37; font-size: 24px; }
    .header .score { font-size: 48px; font-weight: bold; color: ${data.leadScore >= 100 ? "#fbbf24" : data.leadScore >= 60 ? "#D4AF37" : "#94a3b8"}; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
    .value { font-size: 16px; color: #1e293b; margin-top: 4px; }
    .challenge { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 20px 0; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Consulting Lead</h1>
      <div class="score">${data.leadScore}</div>
      <div style="color: #94a3b8; font-size: 14px;">Lead Score</div>
    </div>
    <div class="content">
      <div class="grid">
        <div class="field">
          <div class="label">Contact</div>
          <div class="value"><strong>${safeFirstName} ${safeLastName}</strong></div>
          <div class="value">${safeJobTitle || "Not specified"}</div>
          <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
        </div>
        <div class="field">
          <div class="label">Company</div>
          <div class="value"><strong>${safeCompanyName}</strong></div>
          <div class="value">${formatLabel(data.companyType)} · ${data.companySize} employees</div>
        </div>
      </div>

      <div class="grid" style="margin-top: 20px;">
        <div class="field">
          <div class="label">Category</div>
          <div class="value">${formatLabel(data.consultingCategory)}</div>
        </div>
        <div class="field">
          <div class="label">Budget Range</div>
          <div class="value">${data.budgetRange ? formatBudget(data.budgetRange) : "To be discussed"}</div>
        </div>
        <div class="field">
          <div class="label">Timeline</div>
          <div class="value">${formatLabel(data.timeline)}</div>
        </div>
        <div class="field">
          <div class="label">Source</div>
          <div class="value">${safeSource || "Direct"}</div>
        </div>
      </div>

      <div class="challenge">
        <div class="label">Challenge Description</div>
        <div class="value" style="margin-top: 8px;">${safeChallengeDescription}</div>
      </div>

      <a href="https://algovigilance.com/nucleus/admin/consulting-leads" class="cta">
        View in Dashboard →
      </a>
    </div>
    <div class="footer">
      AlgoVigilance Consulting Lead Notification<br/>
      <a href="https://algovigilance.com/nucleus/admin/consulting-leads">Manage Leads</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      replyTo: data.email,
      subject,
      html,
    });

    log.debug("[email] Admin notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send admin notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification to admin about new contact form submission
 */
export async function sendContactFormNotification(
  data: ContactFormNotificationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping notification");
    return { success: false, error: "Email service not configured" };
  }

  const subject = `New Contact: ${data.subject} - ${data.firstName} ${data.lastName}`;

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeLastName = escapeHtml(data.lastName);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message);
  const safeCompanyName = data.companyName
    ? escapeHtml(data.companyName)
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; color: #D4AF37; font-size: 20px; }
    .header .brand { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .content { background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; }
    .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .value { font-size: 15px; color: #1e293b; margin-top: 2px; }
    .message { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 16px 0; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
      <div class="brand">AlgoVigilance Admin Notification</div>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From</div>
        <div class="value"><strong>${safeFirstName} ${safeLastName}</strong> &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;</div>
      </div>
      ${
        safeCompanyName
          ? `
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${safeCompanyName}${data.companyType ? ` (${formatLabel(data.companyType)})` : ""}</div>
      </div>
      `
          : ""
      }
      ${
        data.serviceInterest
          ? `
      <div class="field">
        <div class="label">Interest</div>
        <div class="value">${formatLabel(data.serviceInterest)}</div>
      </div>
      `
          : ""
      }
      <div class="field">
        <div class="label">Subject</div>
        <div class="value"><strong>${safeSubject}</strong></div>
      </div>
      <div class="message">
        <div class="label">Message</div>
        <div class="value" style="margin-top: 8px; white-space: pre-wrap;">${safeMessage}</div>
      </div>
      <a href="https://algovigilance.com/nucleus/admin/contact-submissions" class="cta">
        View in Dashboard →
      </a>
    </div>
    <div class="footer">
      AlgoVigilance Contact Form Notification
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      replyTo: data.email,
      subject,
      html,
    });

    log.debug("[email] Contact notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send contact notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification to admin about new waitlist signup
 */
export async function sendWaitlistNotification(
  email: string,
  source: string,
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping waitlist notification");
    return { success: false, error: "Email service not configured" };
  }

  const safeEmail = escapeHtml(email);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; color: #fbbf24; font-size: 20px; }
    .header .brand { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .content { background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; }
    .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .value { font-size: 15px; color: #1e293b; margin-top: 2px; }
    .cta { display: inline-block; background: #fbbf24; color: #0a0f1c !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Waitlist Signup</h1>
      <div class="brand">AlgoVigilance Founding Members</div>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
      </div>
      <div class="field">
        <div class="label">Source</div>
        <div class="value">${escapeHtml(source)}</div>
      </div>
      <a href="https://algovigilance.com/nucleus/admin/waitlist" class="cta">
        View Waitlist →
      </a>
    </div>
    <div class="footer">AlgoVigilance Waitlist Notification</div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      replyTo: email,
      subject: `New Waitlist Signup: ${email}`,
      html,
    });

    log.debug("[email] Waitlist notification sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send waitlist notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
