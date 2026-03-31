import { FileText } from 'lucide-react';
import { LegalPageHeader } from '@/components/layout/headers';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Terms of Service',
  description: 'Terms and conditions for using AlgoVigilance services and platform.',
  path: '/terms',
});

export default function TermsOfServicePage() {
  return (
    <>
      <LegalPageHeader
        icon={FileText}
        title="Terms of Service"
        lastUpdated="December 3, 2025"
      />

      <div className="mb-8 p-4 border-l-4 border-cyan bg-nex-surface rounded">
        <p className="font-semibold mb-2">Agreement to Terms</p>
        <p className="text-sm">By accessing or using AlgoVigilance services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</p>
      </div>

      <h2>1. Definitions</h2>
      <ul>
        <li><strong>&quot;Services&quot;</strong> refers to all AlgoVigilance platforms including Nucleus (member portal), Academy (learning management system), Community (forums and discussions), and any future services.</li>
        <li><strong>&quot;Content&quot;</strong> includes all text, images, videos, courses, quizzes, forum posts, messages, and other materials available through our Services.</li>
        <li><strong>&quot;User Content&quot;</strong> means any content you submit, post, or transmit through our Services.</li>
        <li><strong>&quot;We,&quot; &quot;Us,&quot; or &quot;Our&quot;</strong> refers to AlgoVigilance, LLC.</li>
        <li><strong>&quot;You&quot;</strong> or <strong>&quot;Your&quot;</strong> refers to the individual or entity using our Services.</li>
      </ul>

      <h2>2. Eligibility and Account Registration</h2>

      <h3>2.1 Age Requirement</h3>
      <p>You must be at least 18 years old to use our Services. By creating an account, you represent that you are of legal age to form a binding contract.</p>

      <h3>2.2 Account Creation</h3>
      <p>To access certain features, you must create an account by providing:</p>
      <ul>
        <li>A valid email address</li>
        <li>A secure password</li>
        <li>Your full name and professional information</li>
        <li>Acceptance of these Terms and our Privacy Policy</li>
      </ul>

      <h3>2.3 Professional Identity</h3>
      <p>AlgoVigilance is a professional community for healthcare workers. You agree to:</p>
      <ul>
        <li>Provide accurate professional information</li>
        <li>Not impersonate others or create fake accounts</li>
        <li>Maintain one primary account (multiple accounts are prohibited)</li>
        <li>Update your information to keep it current and accurate</li>
      </ul>

      <h3>2.4 Practitioner Verification</h3>
      <p>Practitioner membership pricing requires verification of current enrollment status. We reserve the right to request documentation and revoke practitioner pricing if verification fails.</p>

      <h3>2.5 Account Security</h3>
      <p>You are responsible for:</p>
      <ul>
        <li>Maintaining the confidentiality of your password</li>
        <li>All activities that occur under your account</li>
        <li>Notifying us immediately of any unauthorized access</li>
        <li>Not sharing your account credentials with others</li>
      </ul>

      <h2>3. Membership and Payment Terms</h2>

      <h3>3.1 Membership Tiers</h3>
      <p>AlgoVigilance offers three membership tiers:</p>
      <ul>
        <li><strong>Founding Member</strong>: $29/month or $290/year (first 250 members, lifetime rate lock)</li>
        <li><strong>Professional Member</strong>: $49/month or $490/year (licensed healthcare professionals)</li>
        <li><strong>Practitioner Member</strong>: $14/month or $140/year (currently enrolled students with verification)</li>
      </ul>

      <h3>3.2 Billing and Automatic Renewal</h3>
      <ul>
        <li>Monthly subscriptions renew automatically on the same day each month</li>
        <li>Annual subscriptions renew automatically after 12 months</li>
        <li>You will be charged using your payment method on file</li>
        <li>You can cancel at any time from your account settings</li>
        <li>Cancellations take effect at the end of the current billing period</li>
      </ul>

      <h3>3.3 Founding Member Lifetime Rate Lock</h3>
      <p>The first 250 Founding Members receive a lifetime rate lock guarantee: your subscription price will never increase as long as your membership remains active. This guarantee is voided if you cancel and later rejoin.</p>

      <div className="mt-4 mb-6 p-4 border-l-4 border-gold bg-nex-surface/50 rounded">
        <p className="font-semibold mb-2">Important Clarification</p>
        <p className="text-sm">Founding Member status includes lifetime access to our platform at locked-in pricing, priority support, and early access to new features. Membership is a subscription—it does not include equity, voting rights, or governance participation in AlgoVigilance, LLC.</p>
      </div>

      <h3>3.4 Refund Policy</h3>
      <p>We offer a 30-day no-questions-asked refund policy:</p>
      <ul>
        <li>Request a refund within 30 days of your initial payment</li>
        <li>Contact us at support@nexvigilant.com</li>
        <li>Refunds are processed within 5-7 business days</li>
        <li>After 30 days, refunds are evaluated on a case-by-case basis</li>
        <li>Annual memberships canceled mid-term may receive prorated refunds at our discretion</li>
      </ul>

      <h3>3.5 Employer Reimbursement</h3>
      <p>We provide receipts and invoices for employer reimbursement. Request documentation from your account settings or contact support.</p>

      <h3>3.6 Price Changes</h3>
      <p>We reserve the right to change pricing for new members. Existing members will be notified 30 days before any price increase (except Founding Members with lifetime rate locks).</p>

      <h2>4. Academy Services</h2>

      <h3>4.1 Course Access</h3>
      <ul>
        <li>Active members have unlimited access to all Academy courses</li>
        <li>Course content includes videos, readings, quizzes, and assessments</li>
        <li>Courses are for personal, non-commercial use only</li>
        <li>You may not download, redistribute, or share course materials</li>
      </ul>

      <h3>4.2 Capabilities</h3>
      <p>Upon successful pathway completion, your capability repository includes:</p>
      <ul>
        <li>Unique verification number (format: NVA-YYYY-XXXXX)</li>
        <li>Public verification at nexvigilant.com/verify/[capability-number]</li>
        <li>Permanent record in our system</li>
      </ul>

      <h3>4.3 Capability Revocation</h3>
      <p>We reserve the right to revoke capabilities if:</p>
      <ul>
        <li>You violated academic integrity (cheating, answer sharing)</li>
        <li>Your account is terminated for Terms violations</li>
        <li>Course content was accessed fraudulently</li>
      </ul>

      <h3>4.4 Academic Integrity</h3>
      <p>You agree to:</p>
      <ul>
        <li>Complete all assessments independently</li>
        <li>Not share quiz answers or assessment materials</li>
        <li>Not use unauthorized aids during assessments</li>
        <li>Report any academic integrity violations you observe</li>
      </ul>
      <p>Our quiz system uses server-side validation to prevent score manipulation. Attempts to bypass these protections will result in immediate account termination.</p>

      <h3>4.5 Educational Disclaimers</h3>
      <ul>
        <li>Academy courses are for professional development, not formal accreditation</li>
        <li>Capabilities do not replace required licenses or certifications</li>
        <li>We do not guarantee course completion or certification</li>
        <li>Course content is educational and does not constitute professional advice</li>
      </ul>

      <h2>5. Community Services</h2>

      <h3>5.1 Forums and Discussions</h3>
      <p>Community features include:</p>
      <ul>
        <li>Public and private forums</li>
        <li>Discussion threads and replies</li>
        <li>Direct messaging between members</li>
        <li>Reactions and engagement features</li>
        <li>Reputation system with points, levels, and badges</li>
      </ul>

      <h3>5.2 Community Guidelines</h3>
      <p>You agree to maintain professional standards by:</p>
      <ul>
        <li>Treating all members with respect and courtesy</li>
        <li>Not posting spam, advertisements, or promotional content</li>
        <li>Not harassing, threatening, or bullying others</li>
        <li>Not sharing false, misleading, or harmful information</li>
        <li>Respecting patient privacy and confidentiality (HIPAA compliance)</li>
        <li>Not disclosing proprietary or confidential employer information</li>
        <li>Following healthcare professional ethics standards</li>
      </ul>

      <h3>5.3 Prohibited Content</h3>
      <p>You may not post content that:</p>
      <ul>
        <li>Violates laws or regulations</li>
        <li>Infringes intellectual property rights</li>
        <li>Contains viruses, malware, or malicious code</li>
        <li>Is sexually explicit, violent, or discriminatory</li>
        <li>Promotes pharmaceutical products without disclosure of conflicts of interest</li>
        <li>Contains patient-identifiable information</li>
        <li>Impersonates others or misrepresents affiliations</li>
      </ul>

      <h3>5.4 Automated Access and Bot Prohibition</h3>
      <p>To protect platform integrity and prevent abuse, you agree that:</p>
      <ul>
        <li><strong>No Bots or Automation</strong>: You may not use bots, scrapers, crawlers, or any automated means to access our services, create accounts, submit forms, or interact with content</li>
        <li><strong>No Mass Operations</strong>: You may not perform automated bulk account creation, mass form submissions, or automated content posting</li>
        <li><strong>No Circumvention</strong>: You may not attempt to bypass, disable, or interfere with our security measures, including bot detection systems (BotID)</li>
        <li><strong>No Scraping</strong>: You may not scrape, harvest, or collect user data, course content, or other information without explicit written permission</li>
        <li><strong>Rate Limiting</strong>: You agree to respect rate limits and not make excessive requests that could impair service performance</li>
      </ul>
      <p><strong>Security Measures</strong>: We employ bot detection technology (Vercel BotID) that analyzes browser and device characteristics to distinguish legitimate users from automated bots. This runs transparently in the background and does not affect normal usage.</p>
      <p><strong>Permitted Automation</strong>: Authorized bots for search engine indexing, accessibility tools, and approved integrations are permitted. Contact us for API access if you have legitimate automation needs.</p>
      <p><strong>Violations</strong>: Automated access violations will result in immediate account termination, IP blocking, and may be reported to relevant authorities if illegal activity is detected.</p>

      <h3>5.5 Pharmaceutical Industry Independence</h3>
      <p>In accordance with our founding principles of independence:</p>
      <ul>
        <li>Pharmaceutical company promotional content disguised as education is prohibited</li>
        <li>You must disclose any pharmaceutical industry employment or consulting relationships when discussing products</li>
        <li>AlgoVigilance does not accept pharmaceutical company funding for educational content</li>
      </ul>

      <h3>5.6 Moderation</h3>
      <p>We reserve the right to:</p>
      <ul>
        <li>Monitor, review, and remove any User Content</li>
        <li>Suspend or terminate accounts for violations</li>
        <li>Lock, hide, or delete threads and posts</li>
        <li>Issue warnings or temporary suspensions</li>
      </ul>
      <p>Moderation decisions are final and not subject to appeal, though you may contact us to discuss concerns.</p>

      <h2>6. User Content and Intellectual Property</h2>

      <h3>6.1 Your Content Ownership</h3>
      <p>You retain ownership of User Content you post. By posting, you grant us:</p>
      <ul>
        <li>A worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your User Content</li>
        <li>The right to use your content for platform operation, improvement, and promotion</li>
        <li>The right to sublicense to third-party service providers (hosting, analytics)</li>
      </ul>

      <h3>6.2 Content Representations</h3>
      <p>By posting User Content, you represent that:</p>
      <ul>
        <li>You own or have rights to the content</li>
        <li>The content does not violate any laws or third-party rights</li>
        <li>The content is accurate and not misleading</li>
      </ul>

      <h3>6.3 AlgoVigilance&apos;s Intellectual Property</h3>
      <p>All AlgoVigilance Content (courses, frameworks, branding, software) is owned by AlgoVigilance, LLC and protected by copyright, trademark, and other intellectual property laws. You may not:</p>
      <ul>
        <li>Copy, reproduce, or redistribute our Content</li>
        <li>Modify or create derivative works</li>
        <li>Remove copyright or proprietary notices</li>
        <li>Use our trademarks without permission</li>
        <li>Reverse engineer or decompile our software</li>
      </ul>

      <h3>6.4 DMCA Copyright Policy</h3>
      <p>If you believe content infringes your copyright, contact us at dmca@nexvigilant.com with:</p>
      <ul>
        <li>Description of the copyrighted work</li>
        <li>Location of the infringing material</li>
        <li>Your contact information</li>
        <li>A statement of good faith belief</li>
        <li>Your electronic signature</li>
      </ul>

      <h2>7. AI-Powered Features</h2>
      <p>AlgoVigilance uses AI (Google Gemini) for:</p>
      <ul>
        <li>Personalized content recommendations</li>
        <li>Interest profiling and community matching</li>
        <li>Content discovery and search</li>
      </ul>
      <p>AI-generated recommendations are suggestions only. You maintain full control over your content consumption and interactions.</p>

      <h2>8. Privacy and Data Protection</h2>
      <p>Your use of our Services is also governed by our <a href="/privacy" className="text-cyan hover:underline">Privacy Policy</a>, which explains how we collect, use, and protect your personal information.</p>

      <h3>8.1 Public Information</h3>
      <p>Certain information is publicly visible:</p>
      <ul>
        <li>Your name, professional title, and profile photo</li>
        <li>Forum posts and replies in public forums</li>
        <li>Reputation points, levels, and badges</li>
        <li>Capability repository (via verification portal)</li>
      </ul>

      <h3>8.2 Profile Visibility Settings</h3>
      <p>You can control visibility of certain profile information through your account settings.</p>

      <h2>9. Third-Party Services</h2>
      <p>Our Services integrate with third-party providers:</p>
      <ul>
        <li><strong>Video Hosting</strong>: Vimeo, YouTube, Cloudflare, Bunny CDN</li>
        <li><strong>Authentication</strong>: Firebase Authentication, Google OAuth</li>
        <li><strong>Analytics</strong>: Vercel Analytics (privacy-first, no cookies; aggregated metrics)</li>
        <li><strong>AI Services</strong>: Google Gemini (via Firebase Genkit)</li>
      </ul>
      <p>These services have their own terms and privacy policies. We are not responsible for third-party service operations or policies.</p>

      <h2>10. Disclaimers and Limitations of Liability</h2>

      <h3>10.1 No Professional Advice</h3>
      <p>AlgoVigilance provides educational content and peer community discussion. Our Services do not constitute:</p>
      <ul>
        <li>Medical, pharmaceutical, or healthcare advice</li>
        <li>Legal or regulatory guidance</li>
        <li>Professional counseling or career placement services</li>
        <li>Investment or financial advice</li>
      </ul>
      <p>Always consult qualified professionals for specific advice.</p>

      <h3>10.2 No Guarantees</h3>
      <p>We do not guarantee:</p>
      <ul>
        <li>Employment or career advancement from using our Services</li>
        <li>Specific learning outcomes or skill acquisition</li>
        <li>Accuracy or completeness of User Content</li>
        <li>Uninterrupted or error-free service operation</li>
      </ul>

      <h3>10.3 Service &quot;As Is&quot;</h3>
      <p>Services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

      <h3>10.4 Limitation of Liability</h3>
      <p>To the maximum extent permitted by law, AlgoVigilance, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not to loss of profits, data, use, or other intangible losses, resulting from:</p>
      <ul>
        <li>Your use or inability to use our Services</li>
        <li>User Content or conduct of other users</li>
        <li>Unauthorized access to your data</li>
        <li>Service interruptions or errors</li>
      </ul>
      <p>Our total liability for any claim arising from these Terms or your use of our Services shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

      <h2>11. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless AlgoVigilance, LLC, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:</p>
      <ul>
        <li>Your violation of these Terms</li>
        <li>Your User Content</li>
        <li>Your violation of any third-party rights</li>
        <li>Your use of our Services</li>
      </ul>

      <h2>12. Account Termination</h2>

      <h3>12.1 Termination by You</h3>
      <p>You may cancel your account at any time through account settings or by contacting support. Cancellation takes effect at the end of your current billing period.</p>

      <h3>12.2 Termination by Us</h3>
      <p>We may suspend or terminate your account immediately if you:</p>
      <ul>
        <li>Violate these Terms or community guidelines</li>
        <li>Engage in fraudulent activity</li>
        <li>Compromise platform security or integrity</li>
        <li>Fail to pay subscription fees</li>
        <li>Request account deletion</li>
      </ul>

      <h3>12.3 Effects of Termination</h3>
      <ul>
        <li>You lose access to all Services immediately</li>
        <li>Your User Content may be deleted</li>
        <li>Course progress and capability records remain in our system</li>
        <li>Capability verification remains publicly accessible</li>
        <li>Outstanding fees remain due</li>
        <li>We may retain certain data as required by law</li>
      </ul>

      <h2>13. Changes to Terms</h2>
      <p>We may update these Terms from time to time. We will notify you of material changes by:</p>
      <ul>
        <li>Posting a notice on our website</li>
        <li>Sending an email to your registered address</li>
        <li>Requiring acceptance upon next login (for significant changes)</li>
      </ul>
      <p>Your continued use of Services after changes constitutes acceptance of updated Terms.</p>

      <h2>14. Future Services</h2>
      <p>AlgoVigilance plans to launch additional services:</p>
      <ul>
        <li><strong>Guardian</strong> (Q3-Q4 2026): Independent pharmaceutical safety surveillance</li>
        <li><strong>Careers</strong> (Q3-Q4 2026): Job board and career development platform</li>
        <li><strong>Ventures</strong> (2027+): Healthcare innovation and venture studio</li>
      </ul>
      <p>New services may have additional terms. We will notify you when new services launch and provide opportunity to review updated Terms.</p>

      <h2>15. Dispute Resolution and Governing Law</h2>

      <h3>15.1 Governing Law</h3>
      <p>These Terms are governed by the laws of the Commonwealth of Massachusetts, United States, without regard to conflict of law principles.</p>

      <h3>15.2 Informal Resolution</h3>
      <p>Before filing a claim, you agree to contact us at legal@nexvigilant.com to attempt informal resolution. We will work in good faith to resolve disputes within 30 days.</p>

      <h3>15.3 Arbitration Agreement</h3>
      <p>For disputes that cannot be resolved informally, you and AlgoVigilance agree to binding arbitration under the American Arbitration Association (AAA) rules, rather than in court, except you may assert claims in small claims court if they qualify.</p>

      <h3>15.4 Class Action Waiver</h3>
      <p>You and AlgoVigilance agree that disputes will be resolved individually, not as a class action, class arbitration, or representative action.</p>

      <h3>15.5 Exceptions to Arbitration</h3>
      <p>Either party may seek injunctive relief in court for intellectual property infringement or misappropriation of trade secrets.</p>

      <h2>16. General Provisions</h2>

      <h3>16.1 Entire Agreement</h3>
      <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and AlgoVigilance regarding our Services.</p>

      <h3>16.2 Severability</h3>
      <p>If any provision of these Terms is found unenforceable, the remaining provisions will remain in full effect.</p>

      <h3>16.3 Waiver</h3>
      <p>Our failure to enforce any right or provision does not constitute a waiver of that right or provision.</p>

      <h3>16.4 Assignment</h3>
      <p>You may not assign or transfer these Terms without our written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.</p>

      <h3>16.5 Force Majeure</h3>
      <p>We are not liable for delays or failures in performance due to causes beyond our reasonable control, including natural disasters, war, terrorism, pandemic, or infrastructure failures.</p>

      <h2>Contact Information</h2>
      <p>Questions about these Terms? Contact us:</p>
      <ul className="list-none">
        <li><strong>Email</strong>: <a href="mailto:legal@nexvigilant.com" className="text-cyan hover:underline">legal@nexvigilant.com</a></li>
        <li><strong>Support</strong>: <a href="mailto:support@nexvigilant.com" className="text-cyan hover:underline">support@nexvigilant.com</a></li>
        <li><strong>DMCA</strong>: <a href="mailto:dmca@nexvigilant.com" className="text-cyan hover:underline">dmca@nexvigilant.com</a></li>
      </ul>

      <div className="mt-8 p-4 border-l-4 border-cyan bg-nex-surface rounded">
        <p className="font-semibold mb-2">Our Commitment</p>
        <p className="text-sm">AlgoVigilance is committed to independence, transparency, and putting healthcare professionals first. These Terms reflect our founding principles: we do not accept pharmaceutical company funding that could compromise our objectivity, we provide transparent education without conflicts of interest, and we believe professional development should be accessible to all who seek to advance their capabilities.</p>
      </div>
    </>
  );
}
