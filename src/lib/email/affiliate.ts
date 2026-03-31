/**
 * Affiliate Program Emails
 *
 * Emails for the Ambassador and Advisor affiliate programs.
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

export interface AffiliateApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  programType: "ambassador" | "advisor";
  institutionOrCompany: string;
}

export type AffiliateStatus =
  | "approved"
  | "declined"
  | "interview"
  | "waitlisted";

// ============================================================================
// Affiliate Emails
// ============================================================================

/**
 * Send confirmation email to affiliate applicant upon submission
 */
export async function sendAffiliateApplicationConfirmation(
  data: AffiliateApplicationData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping affiliate confirmation");
    return { success: false, error: "Email service not configured" };
  }

  const programLabel =
    data.programType === "ambassador" ? "Ambassador" : "Advisor";
  const accentColor = "#D4AF37";
  const subject = `Application Received: AlgoVigilance ${programLabel} Program`;

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeLastName = escapeHtml(data.lastName);
  const safeInstitutionOrCompany = escapeHtml(data.institutionOrCompany);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; }
    .badge { display: inline-block; background: ${accentColor}20; color: ${accentColor}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 12px; }
    .content { padding: 40px; }
    .content h1 { color: #1e293b; font-size: 24px; margin: 0 0 20px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .highlight { background: ${accentColor}10; border-left: 4px solid ${accentColor}; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .timeline { margin: 24px 0; }
    .timeline-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .timeline-dot { width: 12px; height: 12px; background: ${accentColor}; border-radius: 50%; margin-right: 16px; margin-top: 4px; flex-shrink: 0; }
    .timeline-content { color: #475569; }
    .timeline-content strong { color: #1e293b; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 13px; margin: 0; }
    .footer a { color: ${accentColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance</div>
        <div class="badge">${programLabel} Program</div>
      </div>
      <div class="content">
        <h1>Thank you for applying, ${safeFirstName}!</h1>
        <p>We've received your application to the <strong>AlgoVigilance ${programLabel} Program</strong> and are excited to review it.</p>

        <div class="highlight">
          <strong>Application Details</strong><br/>
          Name: ${safeFirstName} ${safeLastName}<br/>
          ${data.programType === "ambassador" ? "Institution" : "Company"}: ${safeInstitutionOrCompany}
        </div>

        <p><strong>What happens next?</strong></p>

        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <strong>Application Review</strong><br/>
              Our team will review your application within 5-7 business days
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <strong>Decision Notification</strong><br/>
              You'll receive an email with our decision and next steps
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <strong>Onboarding</strong><br/>
              If approved, we'll send you everything you need to get started
            </div>
          </div>
        </div>

        <p>In the meantime, explore our <a href="https://algovigilance.com/intelligence" style="color: ${accentColor};">Intelligence Hub</a> for insights on safety careers and industry trends.</p>

        <p style="margin-top: 24px;">Best regards,<br/><strong>The AlgoVigilance Team</strong></p>
      </div>
      <div class="footer">
        <p>Questions? Reply to this email or contact us at <a href="mailto:matthew@nexvigilant.com">matthew@nexvigilant.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    log.debug("[email] Affiliate confirmation sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send affiliate confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send status update email to affiliate applicant
 */
export async function sendAffiliateStatusUpdate(
  data: AffiliateApplicationData & { status: AffiliateStatus; notes?: string },
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping status update");
    return { success: false, error: "Email service not configured" };
  }

  const programLabel =
    data.programType === "ambassador" ? "Ambassador" : "Advisor";
  const accentColor = "#D4AF37";

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeNotes = data.notes ? escapeHtml(data.notes) : null;

  const statusConfig: Record<
    AffiliateStatus,
    {
      subject: string;
      heading: string;
      message: string;
      cta?: { text: string; url: string };
    }
  > = {
    approved: {
      subject: `Welcome to the ${programLabel} Program!`,
      heading: `Congratulations, ${safeFirstName}!`,
      message: `We're thrilled to welcome you to the AlgoVigilance ${programLabel} Program. Your application has been approved, and we're excited to have you join our community of safety professionals.`,
      cta: {
        text: "Access Your Dashboard",
        url: "https://algovigilance.com/nucleus",
      },
    },
    declined: {
      subject: `Update on Your ${programLabel} Application`,
      heading: `Thank you for your interest, ${safeFirstName}`,
      message: `After careful review, we've decided not to move forward with your application at this time. This doesn't reflect on your qualifications—we receive many strong applications and have limited capacity. We encourage you to explore our community resources and reapply in the future.`,
      cta: {
        text: "Explore Our Community",
        url: "https://algovigilance.com/community",
      },
    },
    interview: {
      subject: `Interview Invitation: ${programLabel} Program`,
      heading: `Great news, ${safeFirstName}!`,
      message: `Your ${programLabel} Program application has advanced to the interview stage. We'd love to learn more about you and discuss how you can contribute to and benefit from our community.`,
      cta: {
        text: "Schedule Your Interview",
        url: "https://calendly.com/nexvigilant/affiliate-interview",
      },
    },
    waitlisted: {
      subject: `${programLabel} Program - Waitlist Update`,
      heading: `Thank you for your patience, ${safeFirstName}`,
      message: `Your application to the ${programLabel} Program has been placed on our waitlist. We were impressed with your profile and will reach out as soon as a spot becomes available. In the meantime, we encourage you to stay engaged with our community.`,
      cta: {
        text: "Join Our Newsletter",
        url: "https://algovigilance.com/newsletter",
      },
    },
  };

  const config = statusConfig[data.status];
  const subject = config.subject;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; }
    .badge { display: inline-block; background: ${accentColor}20; color: ${accentColor}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 12px; }
    .content { padding: 40px; }
    .content h1 { color: #1e293b; font-size: 24px; margin: 0 0 20px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .cta { display: inline-block; background: ${accentColor}; color: #0a0f1c !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
    .notes { background: #f8fafc; border-left: 4px solid #94a3b8; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; font-style: italic; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 13px; margin: 0; }
    .footer a { color: ${accentColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance</div>
        <div class="badge">${programLabel} Program</div>
      </div>
      <div class="content">
        <h1>${config.heading}</h1>
        <p>${config.message}</p>

        ${safeNotes ? `<div class="notes"><strong>Note from our team:</strong><br/>${safeNotes}</div>` : ""}

        ${config.cta ? `<a href="${config.cta.url}" class="cta">${config.cta.text} →</a>` : ""}

        <p style="margin-top: 32px;">Best regards,<br/><strong>The AlgoVigilance Team</strong></p>
      </div>
      <div class="footer">
        <p>Questions? Reply to this email or contact us at <a href="mailto:matthew@nexvigilant.com">matthew@nexvigilant.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    log.debug("[email] Affiliate status update sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send affiliate status update:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
