/**
 * Wizard Brochure Email
 *
 * Personalized service recommendations from the consulting wizard.
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

export interface WizardBrochureData {
  firstName: string;
  email: string;
  companyName?: string;
  situationSummary: string;
  branch: "challenge" | "opportunity" | "exploration";
  primary: {
    title: string;
    tagline: string;
    outcomes: string[];
    deliverables: string[];
    detailUrl: string;
  };
  secondary: Array<{
    title: string;
    tagline: string;
    outcomes: string[];
    detailUrl: string;
  }>;
}

// ============================================================================
// Brochure Email
// ============================================================================

/**
 * Send personalized wizard recommendations as an informal proposal
 */
export async function sendWizardBrochure(
  data: WizardBrochureData,
): Promise<EmailResult> {
  if (!resend) {
    log.warn("[email] Resend not configured - skipping wizard brochure");
    return { success: false, error: "Email service not configured" };
  }

  const branchLabel = {
    challenge: "challenge",
    opportunity: "opportunity",
    exploration: "exploration",
  }[data.branch];

  const subject = `Your AlgoVigilance Consulting Recommendations — Next Steps`;
  const baseUrl = "https://algovigilance.com";

  // Escape user-provided content to prevent XSS
  const safeFirstName = escapeHtml(data.firstName);
  const safeSituationSummary = escapeHtml(data.situationSummary);
  const safePrimaryTitle = escapeHtml(data.primary.title);
  const safePrimaryTagline = escapeHtml(data.primary.tagline);
  const safePrimaryOutcomes = data.primary.outcomes.map((o) => escapeHtml(o));
  const safePrimaryDeliverables = data.primary.deliverables.map((d) =>
    escapeHtml(d),
  );
  const safeSecondary = data.secondary.map((s) => ({
    title: escapeHtml(s.title),
    tagline: escapeHtml(s.tagline),
    outcomes: s.outcomes.map((o) => escapeHtml(o)),
    detailUrl: s.detailUrl, // URLs are not user-provided, they come from our config
  }));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; }
    .tagline { color: #94a3b8; font-size: 14px; }
    .content { padding: 40px; }
    .content h1 { color: #1e293b; font-size: 24px; margin: 0 0 16px 0; }
    .content p { color: #475569; margin: 0 0 16px 0; }
    .situation { background: #f0fdfa; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; color: #0d9488; font-style: italic; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #D4AF37; font-weight: 600; letter-spacing: 1px; margin-bottom: 16px; }
    .primary-card { background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); border-radius: 12px; padding: 24px; margin: 24px 0; }
    .primary-title { color: white; font-size: 22px; font-weight: bold; margin: 0 0 8px 0; }
    .primary-tagline { color: #D4AF37; font-size: 14px; margin: 0 0 20px 0; }
    .outcomes-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
    .outcome { color: white; padding: 8px 0; display: flex; align-items: flex-start; }
    .check { color: #D4AF37; margin-right: 10px; font-size: 16px; }
    .deliverables { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .deliverable-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
    .deliverable-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .deliverable { background: rgba(212, 175, 55, 0.1); color: #D4AF37; padding: 6px 12px; border-radius: 20px; font-size: 13px; }
    .learn-more { display: inline-block; color: #D4AF37; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .secondary-section { margin: 32px 0; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .secondary-title { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 16px; }
    .secondary-card { background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
    .secondary-name { color: #1e293b; font-weight: 600; margin: 0 0 4px 0; }
    .secondary-tagline { color: #64748b; font-size: 14px; margin: 0 0 12px 0; }
    .secondary-outcome { color: #475569; font-size: 14px; padding: 4px 0; }
    .secondary-link { color: #D4AF37; text-decoration: none; font-size: 14px; font-weight: 500; }
    .value-prop { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 32px 0; text-align: center; }
    .value-text { color: #475569; margin: 0; }
    .value-text strong { color: #1e293b; }
    .cta { display: inline-block; background: #D4AF37; color: #0a0f1c !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 13px; margin: 0 0 8px 0; }
    .footer a { color: #D4AF37; text-decoration: none; }
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
        <h1>Hi ${safeFirstName},</h1>
        <p>Based on what you shared about your ${branchLabel}, here's what we recommend:</p>

        <div class="situation">
          "${safeSituationSummary}"
        </div>

        <div class="section-title">Recommended for You</div>

        <div class="primary-card">
          <h2 class="primary-title">${safePrimaryTitle}</h2>
          <p class="primary-tagline">${safePrimaryTagline}</p>

          <div class="outcomes-title">What You'll Achieve</div>
          ${safePrimaryOutcomes
            .map(
              (outcome) => `
            <div class="outcome">
              <span class="check">✓</span>
              <span>${outcome}</span>
            </div>
          `,
            )
            .join("")}

          <div class="deliverables">
            <div class="deliverable-title">Key Deliverables</div>
            <div class="deliverable-list">
              ${safePrimaryDeliverables.map((d) => `<span class="deliverable">${d}</span>`).join("")}
            </div>
          </div>

          ${
            data.primary.detailUrl
              ? `
            <a href="${baseUrl}${data.primary.detailUrl}" class="learn-more">Learn more about ${safePrimaryTitle} →</a>
          `
              : ""
          }
        </div>

        ${
          safeSecondary.length > 0
            ? `
          <div class="secondary-section">
            <div class="secondary-title">Also Relevant to Your Situation</div>
            ${safeSecondary
              .map(
                (s) => `
              <div class="secondary-card">
                <h3 class="secondary-name">${s.title}</h3>
                <p class="secondary-tagline">${s.tagline}</p>
                ${s.outcomes
                  .slice(0, 2)
                  .map(
                    (o) => `
                  <div class="secondary-outcome">✓ ${o}</div>
                `,
                  )
                  .join("")}
                ${
                  s.detailUrl
                    ? `
                  <a href="${baseUrl}${s.detailUrl}" class="secondary-link">Learn more →</a>
                `
                    : ""
                }
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }

        <div class="value-prop">
          <p class="value-text">
            Every engagement is tailored to your budget and scale—from early-stage startups to global enterprises.
            <strong>We deliver outcomes at investments structured around your success.</strong>
          </p>
        </div>

        <div style="background: linear-gradient(135deg, #0a0f1c 0%, #1a1a2e 100%); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">📄 Consulting Capabilities</p>
          <p style="color: white; margin: 0 0 16px 0; font-size: 14px;">Download our complete consulting brochure for detailed service information.</p>
          <a href="${baseUrl}/brochures/AlgoVigilance-Consulting-Brochure.pdf" style="display: inline-block; background: rgba(212, 175, 55, 0.15); color: #D4AF37 !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; border: 1px solid rgba(212, 175, 55, 0.3);">Download Brochure (PDF) →</a>
        </div>

        <p style="text-align: center;">Ready to discuss how we can help?</p>

        <div style="text-align: center;">
          <a href="${baseUrl}/services" class="cta">Schedule Your Discovery Call →</a>
        </div>

        <p style="margin-top: 32px;">Best regards,<br/><strong>The AlgoVigilance Team</strong></p>
      </div>
      <div class="footer">
        <p>Questions? Reply to this email or contact us at <a href="mailto:matthew@nexvigilant.com">matthew@nexvigilant.com</a></p>
        <p><a href="${baseUrl}/privacy">Privacy Policy</a> · <a href="${baseUrl}">nexvigilant.com</a></p>
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

    log.debug("[email] Wizard brochure sent:", result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    log.error("[email] Failed to send wizard brochure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
