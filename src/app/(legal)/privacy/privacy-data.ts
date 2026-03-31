export interface LegalTableColumn {
  header: string;
  mono?: boolean;
}

export interface LegalTableData {
  columns: LegalTableColumn[];
  rows: string[][];
}

// Section 4: Legal Basis for Processing (EEA/UK Users)
export const legalBasisTable: LegalTableData = {
  columns: [
    { header: 'Processing Activity' },
    { header: 'Legal Basis' },
  ],
  rows: [
    [
      'Account creation and service delivery',
      'Contract Performance - Necessary to provide our services to you',
    ],
    [
      'Payment processing',
      'Contract Performance - Necessary to fulfill subscription agreements',
    ],
    [
      'Analytics and platform improvement',
      'Legitimate Interests - Improving our services and user experience',
    ],
    [
      'Security and fraud prevention',
      'Legitimate Interests - Protecting our platform and users from abuse',
    ],
    [
      'AI-powered features',
      'Legitimate Interests - Providing enhanced functionality and personalization',
    ],
    [
      'Marketing emails',
      'Consent - Only sent with your explicit opt-in permission',
    ],
    [
      'Service-related communications',
      'Contract Performance - Necessary for service operation',
    ],
    [
      'Legal compliance and tax records',
      'Legal Obligation - Required by applicable laws',
    ],
  ],
};

// Section 6: Data Retention
export const dataRetentionTable: LegalTableData = {
  columns: [
    { header: 'Data Type' },
    { header: 'Retention Period' },
    { header: 'Reason' },
  ],
  rows: [
    [
      'Account data (profile, preferences)',
      'Duration of account + 30 days',
      'Service provision and account recovery',
    ],
    [
      'Capability pathway progress',
      'Duration of account + 1 year',
      'Certificate verification and records',
    ],
    [
      'Community posts and content',
      'Duration of account + 30 days',
      'Content integrity; may be anonymized rather than deleted',
    ],
    [
      'Analytics data (Vercel)',
      '26 months',
      'Platform improvement (anonymized)',
    ],
    [
      'Security and audit logs',
      '12 months',
      'Security monitoring and incident response',
    ],
    [
      'Payment and transaction records',
      '7 years',
      'Legal requirement (tax and financial regulations)',
    ],
    [
      'Support correspondence',
      '3 years',
      'Service quality and dispute resolution',
    ],
    [
      'Marketing consent records',
      'Duration of consent + 3 years',
      'Proof of consent for compliance',
    ],
  ],
};

// Section 7.1: Cookies
export const cookiesTable: LegalTableData = {
  columns: [
    { header: 'Cookie', mono: true },
    { header: 'Type' },
    { header: 'Purpose' },
    { header: 'Duration' },
  ],
  rows: [
    [
      '__session',
      'Essential (1st party)',
      'Firebase authentication session',
      'Session / 14 days',
    ],
    [
      '__stripe_mid',
      'Essential (3rd party)',
      'Stripe fraud prevention',
      '1 year',
    ],
    [
      '__stripe_sid',
      'Essential (3rd party)',
      'Stripe session identifier',
      'Session',
    ],
  ],
};

// Section 7.2: Local Storage Keys
export const localStorageTable: LegalTableData = {
  columns: [
    { header: 'Key', mono: true },
    { header: 'Purpose' },
    { header: 'Retention' },
  ],
  rows: [
    [
      'nexvigilant_behavior_metrics',
      'Tracks page visits and feature usage for UX improvement',
      'Until cleared',
    ],
    [
      'nexvigilant_behavior_tracking_enabled',
      'Your opt-in preference for behavior tracking',
      'Until cleared',
    ],
    [
      'nexvigilant_lesson_progress',
      'Saves your pathway progress and completed lessons',
      'Until cleared',
    ],
    [
      'nex_discovery_quiz',
      'Stores your career discovery quiz responses',
      'Until cleared',
    ],
    [
      'emailVerificationBannerDismissed',
      'Remembers if you dismissed the email verification banner',
      'Until cleared',
    ],
    [
      'nex_discovery_quiz_preview',
      'Stores preview quiz responses (public page)',
      'Until cleared',
    ],
    [
      'nex_enhanced_quiz_progress',
      'Saves in-progress enhanced discovery quiz answers',
      'Until cleared',
    ],
    [
      'nex_enhanced_discovery_quiz',
      'Stores completed enhanced discovery quiz results',
      'Until cleared',
    ],
    [
      'nexvigilant_cookie_consent',
      'Stores your cookie preferences (essential, analytics, functional)',
      '1 year',
    ],
    [
      'nexvigilant_marketing_consent',
      'Stores your marketing email preferences',
      'Until cleared',
    ],
    [
      'nexvigilant_skip_onboarding',
      'Remembers if you bypassed onboarding flow',
      'Until cleared',
    ],
    [
      'nexvigilant-seen-version',
      "Tracks which release version you've seen",
      'Until cleared',
    ],
    [
      'nexvigilant-release-dismissed',
      'Remembers if you dismissed a release notification',
      'Until cleared',
    ],
    [
      'nexvigilant-whats-new-seen',
      "Tracks if you've viewed the \"What's New\" modal",
      'Until cleared',
    ],
    [
      'nexvigilant-tour-completed-{tourId}',
      "Remembers which guided tours you've completed",
      'Until cleared',
    ],
    [
      'lesson-{lessonId}-objective-{index}-completed',
      "Tracks which learning objectives you've completed",
      'Until cleared',
    ],
    [
      'quiz-{userId}-{enrollmentId}-{lessonId}',
      'Saves your quiz answers and progress within lessons',
      'Until cleared',
    ],
    [
      'nexvigilant-assessment-{assessmentId}',
      'Saves your assessment progress and responses',
      'Until cleared',
    ],
  ],
};

// Section 8: Third-Party Services and Subprocessors
export const thirdPartyTable: LegalTableData = {
  columns: [
    { header: 'Service' },
    { header: 'Purpose' },
    { header: 'Location' },
    { header: 'Privacy Policy' },
  ],
  rows: [
    [
      'Google Firebase',
      'Authentication, database, hosting',
      'USA',
      'https://firebase.google.com/support/privacy',
    ],
    [
      'Google Cloud AI (Gemini)',
      'AI-powered features',
      'USA',
      'https://cloud.google.com/terms/cloud-privacy-notice',
    ],
    [
      'Vercel',
      'Hosting, analytics, security',
      'USA',
      'https://vercel.com/legal/privacy-policy',
    ],
    [
      'Stripe',
      'Payment processing',
      'USA',
      'https://stripe.com/privacy',
    ],
    [
      'Resend',
      'Transactional email delivery',
      'USA',
      'https://resend.com/legal/privacy-policy',
    ],
  ],
};
