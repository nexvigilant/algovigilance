/**
 * Customer Acknowledgment Emails
 *
 * Auto-response emails sent to users after they submit forms.
 */

import {
  resend,
  log,
  EMAIL_CONFIG,
  escapeHtml,
  type EmailResult,
} from "./client";

// ============================================================================
// Acknowledgment Emails
// ============================================================================

/**
 * Send acknowledgment email to consulting lead
 */
export async function sendConsultingLeadAcknowledgment(data: {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
}): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping acknowledgment");
    return { success: false, error: "Email service not configured" };
  }

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeCompanyName = escapeHtml(data.companyName);

  const subject = `Thank you for your inquiry, ${data.firstName}`;

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
    .tagline { color: #94a3b8; font-size: 14px; }
    .content { padding: 40px; }
    .content h1 { color: #1e293b; font-size: 24px; margin: 0 0 20px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .highlight { background: #f0fdfa; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .highlight strong { color: #0d9488; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .step-num { background: #D4AF37; color: #0a0f1c; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; margin-right: 12px; }
    .step-text { color: #475569; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 13px; margin: 0; }
    .footer a { color: #D4AF37; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance</div>
        <div class="tagline">Empowerment Through Vigilance</div>
      </div>
      <div class="content">
        <h1>Thank you, ${safeFirstName}!</h1>
        <p>We've received your consulting inquiry for <strong>${safeCompanyName}</strong> and appreciate your interest in AlgoVigilance's services.</p>

        <div class="highlight">
          <strong>A specialist will contact you within 24 hours</strong> to discuss your specific needs and how we can help.
        </div>

        <p>Here's what happens next:</p>

        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Our team reviews your inquiry and assigns the most qualified specialist</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">You'll receive a personalized response with initial recommendations</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">We'll schedule a discovery call to understand your challenges in depth</div>
          </div>
        </div>

        <p>In the meantime, feel free to explore our <a href="https://algovigilance.com/intelligence" style="color: #D4AF37;">Intelligence Hub</a> for insights on pharmacovigilance and regulatory strategy.</p>

        <p style="margin-top: 24px;">Best regards,<br/><strong>The AlgoVigilance Team</strong></p>
      </div>
      <div class="footer">
        <p>Need immediate assistance? Reply to this email or contact us at <a href="mailto:matthew@nexvigilant.com">matthew@nexvigilant.com</a></p>
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

    log.debug("[email] Lead acknowledgment sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send lead acknowledgment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send acknowledgment email for contact form submission
 */
export async function sendContactFormAcknowledgment(data: {
  firstName: string;
  email: string;
  subject: string;
}): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping acknowledgment");
    return { success: false, error: "Email service not configured" };
  }

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeSubject = escapeHtml(data.subject);

  const emailSubject = `We received your message: "${data.subject}"`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: #1a1a2e; padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: white; }
    .content { padding: 32px; }
    .content h1 { color: #1e293b; font-size: 22px; margin: 0 0 16px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">AlgoVigilance</div>
      </div>
      <div class="content">
        <h1>Thank you, ${safeFirstName}!</h1>
        <p>We've received your message regarding "<strong>${safeSubject}</strong>" and will get back to you within 24-48 hours.</p>
        <p>Best regards,<br/><strong>The AlgoVigilance Team</strong></p>
      </div>
      <div class="footer">
        <p>AlgoVigilance · Empowerment Through Vigilance</p>
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
      subject: emailSubject,
      html,
    });

    log.debug("[email] Contact acknowledgment sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send contact acknowledgment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
