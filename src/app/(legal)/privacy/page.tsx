import { Shield } from 'lucide-react';
import { LegalPageHeader } from '@/components/layout/headers';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description:
    'Our commitment to protecting your privacy and handling your personal information with respect and transparency.',
  path: '/privacy',
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalPageHeader
        icon={Shield}
        title="Privacy Policy"
        lastUpdated="December 8, 2025"
      />

      <p>Your privacy is important to us. It is AlgoVigilance, LLC&apos;s policy to respect your privacy regarding any information we may collect from you across our website and services. This policy outlines how we collect, use, and protect your information in a transparent manner aligned with our core values of independence and integrity.</p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide</h3>
      <p>We collect information you provide directly to us when you:</p>
      <ul>
        <li>Create an account (email address, password, display name)</li>
        <li>Update your profile (biographical information, professional details such as job title, employer, and areas of expertise)</li>
        <li>Use our services (capability pathway progress, job applications, community posts)</li>
        <li>Contact us for support (email correspondence, feedback)</li>
        <li>Subscribe to newsletters or marketing communications</li>
        <li>Make purchases or subscribe to paid services</li>
      </ul>

      <h3>1.2 Information We Collect Automatically</h3>
      <p>When you access or use our services, we automatically collect:</p>
      <ul>
        <li><strong>Usage Data</strong>: Pages viewed, features used, time spent on pages, navigation paths</li>
        <li><strong>Device Information</strong>: Browser type, operating system, device type, screen resolution</li>
        <li><strong>Analytics Data</strong>: Interactions with buttons, forms, and other elements (tracked via Vercel Analytics)</li>
        <li><strong>Authentication Data</strong>: Sign-in method (email/password or Google OAuth), sign-in timestamps</li>
        <li><strong>Security Data</strong>: Device and browser characteristics for bot detection (BotID), IP address (anonymized), interaction patterns for fraud prevention</li>
      </ul>

      <h3>1.3 Do Not Track (DNT)</h3>
      <p>We respect browser Do Not Track (DNT) signals. Our analytics systems are designed with privacy-first principles and do not engage in cross-site tracking.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li><strong>Provide Services</strong>: Operate and maintain your account, deliver capability pathways, process applications</li>
        <li><strong>Improve Our Platform</strong>: Analyze usage patterns to enhance user experience and fix issues</li>
        <li><strong>Communicate</strong>: Send service updates, security alerts, and support messages</li>
        <li><strong>Security</strong>: Detect and prevent fraud, abuse, and security incidents</li>
        <li><strong>Compliance</strong>: Meet legal obligations and enforce our terms of service</li>
        <li><strong>AI-Powered Features</strong>: Provide personalized recommendations and intelligent assistance (see Section 3.5)</li>
      </ul>
      <p>We do NOT sell your personal information to third parties. We do NOT share your data with pharmaceutical companies or other industry entities for marketing purposes, in accordance with our founding principles of independence.</p>

      <h3>2.1 Data Minimization</h3>
      <p>We adhere to the principle of data minimization. We only collect personal information that is necessary for the specific purposes described in this policy. We do not collect data &quot;just in case&quot; it might be useful later. When data is no longer needed for its original purpose, we delete or anonymize it in accordance with our retention schedule.</p>

      <h3>2.2 Professional Information Protection</h3>
      <p>We understand that your professional details (job title, employer, credentials, areas of expertise) are provided in trust. We commit to:</p>
      <ul>
        <li>Never sharing your professional information with your employer, regulatory bodies, or third parties without your explicit consent or legal requirement</li>
        <li>Never using your professional data for purposes other than providing and improving our services</li>
        <li>Allowing you to control the visibility of professional information within the community (public, members-only, or private)</li>
      </ul>

      <h3>2.3 How We Obtain Consent</h3>
      <p>Where we rely on consent as a legal basis for processing, we obtain it through clear, affirmative actions:</p>
      <ul>
        <li><strong>Marketing Communications</strong>: Opt-in checkbox during registration or in account settings (unchecked by default)</li>
        <li><strong>Behavior Tracking</strong>: Explicit opt-in via the behavior tracking preference in your account settings</li>
        <li><strong>Community Features</strong>: Accepting community guidelines when joining forums or posting content</li>
      </ul>
      <p>You can withdraw consent at any time through your account settings or by contacting us at <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a>. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal.</p>

      <h2>3. Analytics, Tracking, and AI Features</h2>

      <h3>3.1 Firebase Services</h3>
      <p>We use Google Firebase for authentication and data storage. Firebase may collect device and usage information for service operation and security. Learn more: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">firebase.google.com/support/privacy</a></p>

      <h3>3.2 Vercel Analytics</h3>
      <p>We use Vercel Analytics to monitor site performance and usage. Vercel Analytics collects:</p>
      <ul>
        <li>Page views and unique visitors (anonymized)</li>
        <li>Geographic location (country/region level only)</li>
        <li>Referral sources</li>
        <li>Device type and browser information</li>
      </ul>
      <p>Vercel Analytics is privacy-friendly and GDPR compliant:</p>
      <ul>
        <li>✓ No cookies or persistent identifiers</li>
        <li>✓ All data is anonymous and aggregated</li>
        <li>✓ No cross-site tracking</li>
        <li>✓ Data stored in accordance with privacy regulations</li>
      </ul>
      <p>Learn more: <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Vercel Analytics Privacy Policy</a></p>

      <h3>3.3 Vercel Speed Insights</h3>
      <p>We use Vercel Speed Insights to monitor and improve site performance. Speed Insights collects:</p>
      <ul>
        <li>Page load times and performance metrics</li>
        <li>Core Web Vitals scores</li>
        <li>Browser and device performance data</li>
      </ul>
      <p>Speed Insights data is anonymized and used solely for performance optimization. No personal information is collected.</p>

      <h3>3.4 Bot Detection and Security (BotID)</h3>
      <p>We use Vercel BotID to protect our services from automated abuse, spam, and fraudulent activity. BotID works by:</p>
      <ul>
        <li>Running JavaScript challenges on your browser to verify you are a real person</li>
        <li>Analyzing device and browser characteristics (fingerprinting) for security purposes</li>
        <li>Monitoring interaction patterns to detect automated behavior</li>
      </ul>
      <p><strong>What BotID protects:</strong></p>
      <ul>
        <li>Account creation and sign-in (prevents fake accounts)</li>
        <li>Form submissions (prevents spam on contact and waitlist forms)</li>
        <li>Payment processing (prevents fraud and abuse of trials)</li>
        <li>Content access (prevents scraping and unauthorized access)</li>
      </ul>
      <p><strong>Privacy safeguards:</strong></p>
      <ul>
        <li>✓ Bot detection runs transparently - no CAPTCHA challenges for legitimate users</li>
        <li>✓ Data is used only for security purposes, not for tracking or marketing</li>
        <li>✓ Results are processed in real-time and not permanently stored</li>
        <li>✓ No personal information is collected beyond what is necessary for bot detection</li>
      </ul>
      <p>BotID is essential for maintaining platform integrity and protecting all users from abuse. Learn more: <a href="https://vercel.com/docs/security/vercel-firewall" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Vercel Security Documentation</a></p>

      <h3>3.5 Artificial Intelligence Features</h3>
      <p>We use Google&apos;s Gemini AI (via Firebase Genkit) to power certain features of our platform, including:</p>
      <ul>
        <li>Personalized learning recommendations</li>
        <li>Content summarization and explanations</li>
        <li>Intelligent search and discovery</li>
        <li>Assessment feedback and guidance</li>
      </ul>
      <p><strong>How AI processes your data:</strong></p>
      <ul>
        <li>When you use AI-powered features, relevant context (such as your question or the content you&apos;re viewing) is sent to Google Cloud AI services for processing</li>
        <li>We do NOT use your personal data to train AI models</li>
        <li>AI responses are generated in real-time and not stored by Google for model improvement</li>
        <li>Your interactions with AI features are subject to our standard data retention policies</li>
      </ul>
      <p>AI processing is covered by Google Cloud&apos;s Data Processing Terms. Learn more: <a href="https://cloud.google.com/terms/data-processing-addendum" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Google Cloud Data Processing Addendum</a></p>

      <h2>4. Legal Basis for Processing (EEA/UK Users)</h2>
      <p>If you are located in the European Economic Area (EEA) or United Kingdom, we process your personal data based on the following legal grounds under GDPR:</p>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border border-slate-dim">
          <thead>
            <tr className="bg-nex-surface">
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Processing Activity</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Account creation and service delivery</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Contract Performance</strong> - Necessary to provide our services to you</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Payment processing</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Contract Performance</strong> - Necessary to fulfill subscription agreements</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Analytics and platform improvement</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Legitimate Interests</strong> - Improving our services and user experience</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Security and fraud prevention</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Legitimate Interests</strong> - Protecting our platform and users from abuse</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">AI-powered features</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Legitimate Interests</strong> - Providing enhanced functionality and personalization</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Marketing emails</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Consent</strong> - Only sent with your explicit opt-in permission</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Service-related communications</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Contract Performance</strong> - Necessary for service operation</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Legal compliance and tax records</td>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Legal Obligation</strong> - Required by applicable laws</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Where we rely on legitimate interests, we have conducted balancing tests to ensure your rights and freedoms are not overridden. You may object to processing based on legitimate interests by contacting us at <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a>.</p>

      <h2>5. Data Storage and Security</h2>
      <p>We store your data using industry-standard security measures:</p>
      <ul>
        <li><strong>Encryption</strong>: Data is encrypted in transit (HTTPS/TLS 1.3) and at rest (AES-256)</li>
        <li><strong>Access Controls</strong>: Only authorized personnel can access user data, with role-based permissions</li>
        <li><strong>Authentication</strong>: Firebase Authentication with secure password hashing (bcrypt)</li>
        <li><strong>Firestore Security</strong>: Database rules prevent unauthorized access with user-level granularity</li>
        <li><strong>Infrastructure</strong>: Hosted on Google Cloud Platform and Vercel with SOC 2 Type II compliance</li>
      </ul>
      <p>While we implement strong security measures, no internet transmission is 100% secure. We cannot guarantee absolute security but commit to promptly notifying affected users and relevant authorities of any data breaches within 72 hours as required by GDPR.</p>

      <h3>5.1 Security Certifications and Audits</h3>
      <p>We rely on infrastructure providers with recognized security certifications:</p>
      <ul>
        <li><strong>Google Cloud Platform</strong>: SOC 1/2/3, ISO 27001, ISO 27017, ISO 27018, PCI DSS</li>
        <li><strong>Vercel</strong>: SOC 2 Type II certified</li>
        <li><strong>Stripe</strong>: PCI DSS Level 1 (highest level for payment processors)</li>
      </ul>
      <p>We conduct regular security reviews of our application code and access controls. We are committed to achieving independent security certifications as we scale, and will update this policy accordingly.</p>

      <h2>6. Data Retention</h2>
      <p>We retain your information for specific periods based on the type of data and our legal obligations:</p>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border border-slate-dim">
          <thead>
            <tr className="bg-nex-surface">
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Data Type</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Retention Period</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Account data (profile, preferences)</td>
              <td className="px-4 py-2 border-b border-slate-dim">Duration of account + 30 days</td>
              <td className="px-4 py-2 border-b border-slate-dim">Service provision and account recovery</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Capability pathway progress</td>
              <td className="px-4 py-2 border-b border-slate-dim">Duration of account + 1 year</td>
              <td className="px-4 py-2 border-b border-slate-dim">Certificate verification and records</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Community posts and content</td>
              <td className="px-4 py-2 border-b border-slate-dim">Duration of account + 30 days</td>
              <td className="px-4 py-2 border-b border-slate-dim">Content integrity; may be anonymized rather than deleted</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Analytics data (Vercel)</td>
              <td className="px-4 py-2 border-b border-slate-dim">26 months</td>
              <td className="px-4 py-2 border-b border-slate-dim">Platform improvement (anonymized)</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Security and audit logs</td>
              <td className="px-4 py-2 border-b border-slate-dim">12 months</td>
              <td className="px-4 py-2 border-b border-slate-dim">Security monitoring and incident response</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Payment and transaction records</td>
              <td className="px-4 py-2 border-b border-slate-dim">7 years</td>
              <td className="px-4 py-2 border-b border-slate-dim">Legal requirement (tax and financial regulations)</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Support correspondence</td>
              <td className="px-4 py-2 border-b border-slate-dim">3 years</td>
              <td className="px-4 py-2 border-b border-slate-dim">Service quality and dispute resolution</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim">Marketing consent records</td>
              <td className="px-4 py-2 border-b border-slate-dim">Duration of consent + 3 years</td>
              <td className="px-4 py-2 border-b border-slate-dim">Proof of consent for compliance</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>When you delete your account, we will delete or anonymize your personal information within 30 days, except where longer retention is required by law (such as payment records).</p>
      <p><strong>Data in Backups:</strong> Deleted data may persist in encrypted backups for up to 30 additional days before being automatically purged. Backup data is not actively processed and is protected by the same security measures as primary data.</p>

      <h2>7. Cookies and Local Storage</h2>
      <p>We use cookies and browser local storage for:</p>
      <ul>
        <li><strong>Essential/Authentication</strong>: Keeping you signed in securely</li>
        <li><strong>Preferences</strong>: Remembering your settings and choices</li>
        <li><strong>Security</strong>: Fraud prevention and bot detection</li>
      </ul>

      <h3>7.1 Cookies</h3>
      <p>We use the following cookies:</p>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border border-slate-dim">
          <thead>
            <tr className="bg-nex-surface">
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Cookie</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Type</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Purpose</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">__session</td>
              <td className="px-4 py-2 border-b border-slate-dim">Essential (1st party)</td>
              <td className="px-4 py-2 border-b border-slate-dim">Firebase authentication session</td>
              <td className="px-4 py-2 border-b border-slate-dim">Session / 14 days</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">__stripe_mid</td>
              <td className="px-4 py-2 border-b border-slate-dim">Essential (3rd party)</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stripe fraud prevention</td>
              <td className="px-4 py-2 border-b border-slate-dim">1 year</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">__stripe_sid</td>
              <td className="px-4 py-2 border-b border-slate-dim">Essential (3rd party)</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stripe session identifier</td>
              <td className="px-4 py-2 border-b border-slate-dim">Session</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-dim">Note: Vercel Analytics does not use cookies. We do not use advertising or tracking cookies.</p>

      <h3>7.2 Local Storage Keys</h3>
      <p>We store the following data in your browser&apos;s localStorage:</p>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border border-slate-dim">
          <thead>
            <tr className="bg-nex-surface">
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Key</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Purpose</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_behavior_metrics</td>
              <td className="px-4 py-2 border-b border-slate-dim">Tracks page visits and feature usage for UX improvement</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_behavior_tracking_enabled</td>
              <td className="px-4 py-2 border-b border-slate-dim">Your opt-in preference for behavior tracking</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_lesson_progress</td>
              <td className="px-4 py-2 border-b border-slate-dim">Saves your pathway progress and completed lessons</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nex_discovery_quiz</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stores your career discovery quiz responses</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">emailVerificationBannerDismissed</td>
              <td className="px-4 py-2 border-b border-slate-dim">Remembers if you dismissed the email verification banner</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nex_discovery_quiz_preview</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stores preview quiz responses (public page)</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nex_enhanced_quiz_progress</td>
              <td className="px-4 py-2 border-b border-slate-dim">Saves in-progress enhanced discovery quiz answers</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nex_enhanced_discovery_quiz</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stores completed enhanced discovery quiz results</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_cookie_consent</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stores your cookie preferences (essential, analytics, functional)</td>
              <td className="px-4 py-2 border-b border-slate-dim">1 year</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_marketing_consent</td>
              <td className="px-4 py-2 border-b border-slate-dim">Stores your marketing email preferences</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant_skip_onboarding</td>
              <td className="px-4 py-2 border-b border-slate-dim">Remembers if you bypassed onboarding flow</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant-seen-version</td>
              <td className="px-4 py-2 border-b border-slate-dim">Tracks which release version you&apos;ve seen</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant-release-dismissed</td>
              <td className="px-4 py-2 border-b border-slate-dim">Remembers if you dismissed a release notification</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant-whats-new-seen</td>
              <td className="px-4 py-2 border-b border-slate-dim">Tracks if you&apos;ve viewed the &quot;What&apos;s New&quot; modal</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant-tour-completed-&#123;tourId&#125;</td>
              <td className="px-4 py-2 border-b border-slate-dim">Remembers which guided tours you&apos;ve completed</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">lesson-&#123;lessonId&#125;-objective-&#123;index&#125;-completed</td>
              <td className="px-4 py-2 border-b border-slate-dim">Tracks which learning objectives you&apos;ve completed</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">quiz-&#123;userId&#125;-&#123;enrollmentId&#125;-&#123;lessonId&#125;</td>
              <td className="px-4 py-2 border-b border-slate-dim">Saves your quiz answers and progress within lessons</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs border-b border-slate-dim">nexvigilant-assessment-&#123;assessmentId&#125;</td>
              <td className="px-4 py-2 border-b border-slate-dim">Saves your assessment progress and responses</td>
              <td className="px-4 py-2 border-b border-slate-dim">Until cleared</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-dim">You can clear this data at any time through your browser settings (Settings → Privacy → Clear browsing data → Cookies and site data).</p>

      <p>You can control cookies through your browser settings. Disabling essential cookies may prevent you from signing in or using certain features.</p>

      <h2>8. Third-Party Services and Subprocessors</h2>
      <p>We use the following third-party services to operate our platform. These entities process data on our behalf under data processing agreements:</p>

      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border border-slate-dim">
          <thead>
            <tr className="bg-nex-surface">
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Service</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Purpose</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Location</th>
              <th className="px-4 py-2 text-left text-cyan border-b border-slate-dim">Privacy Policy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Google Firebase</strong></td>
              <td className="px-4 py-2 border-b border-slate-dim">Authentication, database, hosting</td>
              <td className="px-4 py-2 border-b border-slate-dim">USA</td>
              <td className="px-4 py-2 border-b border-slate-dim"><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Link</a></td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Google Cloud AI (Gemini)</strong></td>
              <td className="px-4 py-2 border-b border-slate-dim">AI-powered features</td>
              <td className="px-4 py-2 border-b border-slate-dim">USA</td>
              <td className="px-4 py-2 border-b border-slate-dim"><a href="https://cloud.google.com/terms/cloud-privacy-notice" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Link</a></td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Vercel</strong></td>
              <td className="px-4 py-2 border-b border-slate-dim">Hosting, analytics, security</td>
              <td className="px-4 py-2 border-b border-slate-dim">USA</td>
              <td className="px-4 py-2 border-b border-slate-dim"><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Link</a></td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Stripe</strong></td>
              <td className="px-4 py-2 border-b border-slate-dim">Payment processing</td>
              <td className="px-4 py-2 border-b border-slate-dim">USA</td>
              <td className="px-4 py-2 border-b border-slate-dim"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Link</a></td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b border-slate-dim"><strong>Resend</strong></td>
              <td className="px-4 py-2 border-b border-slate-dim">Transactional email delivery</td>
              <td className="px-4 py-2 border-b border-slate-dim">USA</td>
              <td className="px-4 py-2 border-b border-slate-dim"><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Link</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>8.1 Payment Processing (Stripe)</h3>
      <p>When you make a payment, Stripe processes your transaction. Stripe collects:</p>
      <ul>
        <li>Payment card details (we never see or store your full card number)</li>
        <li>Billing name and address</li>
        <li>Transaction history and amount</li>
        <li>Device information for fraud prevention</li>
      </ul>
      <p>Stripe is PCI DSS Level 1 compliant (the highest level of certification). For fraud prevention purposes, Stripe acts as an independent data controller. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Stripe&apos;s Privacy Policy</a> for details.</p>

      <h2>9. Your Rights and Choices</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong>: Request a copy of your personal data in a portable format</li>
        <li><strong>Correction</strong>: Update or correct inaccurate information</li>
        <li><strong>Deletion</strong>: Request deletion of your account and data</li>
        <li><strong>Portability</strong>: Export your data in a machine-readable format (JSON)</li>
        <li><strong>Restriction</strong>: Request we limit processing of your data</li>
        <li><strong>Objection</strong>: Object to processing based on legitimate interests</li>
        <li><strong>Opt-Out</strong>: Enable Do Not Track (DNT) in your browser to prevent analytics tracking</li>
        <li><strong>Withdraw Consent</strong>: Where processing is based on consent, withdraw it at any time</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a>. We will verify your identity before fulfilling requests and respond within 30 days (or sooner where required by law). Some requests may be limited where we must retain data for legal, security, or compliance reasons.</p>

      <h2>10. International Data Transfers</h2>
      <p>Your information is processed primarily in the United States, where our service providers are located. If you are located outside the United States, your data will be transferred internationally.</p>
      <p>For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we ensure appropriate safeguards for international transfers through:</p>
      <ul>
        <li><strong>Standard Contractual Clauses (SCCs)</strong>: EU Commission-approved contractual terms with our processors</li>
        <li><strong>Data Privacy Framework</strong>: Our key providers (Google, Stripe, Vercel) are certified under the EU-U.S. Data Privacy Framework</li>
        <li><strong>Supplementary Measures</strong>: Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
      </ul>
      <p>You may request a copy of the SCCs by contacting <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a>.</p>

      <h2>11. Children&apos;s Privacy</h2>
      <p>Our services are designed for professionals and are not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete such information.</p>

      <h2>12. Changes to This Policy</h2>
      <p>We may update this privacy policy from time to time. We will notify you of material changes by:</p>
      <ul>
        <li>Posting a prominent notice on our website</li>
        <li>Sending you an email (for registered users)</li>
        <li>Updating the &quot;Last updated&quot; date at the top of this policy</li>
      </ul>
      <p>Your continued use of our services after changes constitutes acceptance of the updated policy. We encourage you to review this policy periodically.</p>

      <h2>13. California Privacy Rights (CCPA/CPRA)</h2>
      <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>

      <h3>13.1 Categories of Personal Information Collected</h3>
      <p>In the past 12 months, we have collected the following categories:</p>
      <ul>
        <li><strong>Identifiers</strong>: Name, email address, account name</li>
        <li><strong>Professional Information</strong>: Job title, employer, professional credentials</li>
        <li><strong>Internet Activity</strong>: Browsing history, search history, interaction with our services</li>
        <li><strong>Geolocation</strong>: Country/region level only (not precise location)</li>
        <li><strong>Inferences</strong>: Preferences and characteristics derived from your activity</li>
      </ul>

      <h3>13.2 Your California Rights</h3>
      <ul>
        <li><strong>Right to Know</strong>: Request disclosure of personal information collected, sources, purposes, and third parties shared with</li>
        <li><strong>Right to Delete</strong>: Request deletion of your personal information</li>
        <li><strong>Right to Correct</strong>: Request correction of inaccurate personal information</li>
        <li><strong>Right to Opt-Out of Sale/Sharing</strong>: We do NOT sell your personal information or share it for cross-context behavioral advertising</li>
        <li><strong>Right to Limit Use of Sensitive Information</strong>: We do not collect sensitive personal information as defined by CPRA</li>
        <li><strong>Right to Non-Discrimination</strong>: We will not discriminate against you for exercising your rights</li>
      </ul>

      <h3>13.3 How to Exercise Your Rights</h3>
      <p>Submit requests to <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a> or call us at the number below. We will verify your identity and respond within 45 days.</p>
      <p><strong>Do Not Sell or Share My Personal Information:</strong> We do not sell or share personal information. No opt-out action is required.</p>

      <h2>14. European Privacy Rights (GDPR)</h2>
      <p>If you are in the European Economic Area (EEA) or United Kingdom, you have rights under the General Data Protection Regulation (GDPR) and UK GDPR:</p>
      <ul>
        <li>Right of access to your personal data</li>
        <li>Right to rectification of inaccurate data</li>
        <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
        <li>Right to restrict processing</li>
        <li>Right to data portability</li>
        <li>Right to object to processing</li>
        <li>Right not to be subject to automated decision-making (we do not make solely automated decisions with legal effects)</li>
      </ul>

      <h3>14.1 Right to Lodge a Complaint</h3>
      <p>If you believe we have violated your privacy rights, you have the right to lodge a complaint with a supervisory authority. For EEA residents, you can find your local authority at: <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">European Data Protection Board Members</a>. For UK residents, contact the <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Information Commissioner&apos;s Office (ICO)</a>.</p>
      <p>We encourage you to contact us first at <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a> so we can address your concerns directly.</p>

      <h2>Contact Us</h2>
      <p>If you have any questions about this privacy policy or how we handle your data, please contact us:</p>
      <ul className="list-none">
        <li><strong>Email</strong>: <a href="mailto:privacy@nexvigilant.com" className="text-cyan hover:underline">privacy@nexvigilant.com</a></li>
        <li><strong>Mail</strong>: AlgoVigilance, LLC<br />Attn: Privacy Team<br />95 Spring Street<br />Swansea, MA 02777<br />United States</li>
      </ul>
      <p className="text-sm text-slate-dim mt-2">For privacy inquiries, we aim to respond within 5 business days. For formal data rights requests, we will respond within 30 days (or the timeframe required by applicable law).</p>

      <div className="mt-8 p-4 border-l-4 border-cyan bg-nex-surface rounded">
        <p className="font-semibold mb-2">Our Commitment to Privacy</p>
        <p className="text-sm">As stated in our founding principles, AlgoVigilance is committed to independence and transparency. We will never accept pharmaceutical company funding that could compromise our objectivity, and we extend that same principle to your data: we will never sell your information or use it in ways that conflict with your interests as a healthcare professional.</p>
      </div>
    </>
  );
}
