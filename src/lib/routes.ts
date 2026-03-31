/**
 * Application Route Constants — Single Source of Truth
 *
 * All hardcoded route paths should reference these constants.
 * Static routes are string literals. Dynamic routes are builder functions.
 *
 * Organization mirrors the app/ directory hierarchy.
 * Use these instead of hardcoded path strings throughout the codebase.
 */

// ============================================================================
// Auth Routes
// ============================================================================

export const AUTH_ROUTES = {
  SIGNIN: "/auth/signin",
  SIGNUP: "/auth/signup",
  RESET_PASSWORD: "/auth/reset-password",
  /** Build signin URL with redirect param */
  signinWithRedirect: (redirect: string) =>
    `/auth/signin?redirect=${encodeURIComponent(redirect)}`,
  /** Build signup URL with returnUrl param */
  signupWithReturn: (returnUrl: string) =>
    `/auth/signup?returnUrl=${returnUrl}`,
} as const;

// ============================================================================
// Public Routes
// ============================================================================

export const PUBLIC_ROUTES = {
  HOME: "/",
  ACADEMY: "/academy",
  MEMBERSHIP: "/membership",
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: "/checkout/success",
  TRIAL_START: "/trial/start",
  VERIFY: "/verify",
  /** Build verification URL for a specific credential */
  verify: (verificationId: string) => `/verify/${verificationId}`,
} as const;

// ============================================================================
// Nucleus — Core Protected Routes
// ============================================================================

export const NUCLEUS = {
  ROOT: "/nucleus",
  ONBOARDING: "/nucleus/onboarding",
  INSIGHTS: "/nucleus/insights",
} as const;

// ============================================================================
// Profile Routes
// ============================================================================

export const PROFILE_ROUTES = {
  ROOT: "/nucleus/profile",
  SUBSCRIPTION: "/nucleus/profile/subscription",
  STUDENT_VERIFICATION: "/nucleus/profile/student-verification",
} as const;

// ============================================================================
// Academy Routes (Student-Facing)
// ============================================================================

export const ACADEMY_ROUTES = {
  ROOT: "/nucleus/academy",
  BUILD: "/nucleus/academy/build",
  /** Build activity page */
  build: (id: string) => `/nucleus/academy/build/${id}`,
  /** Build EPA page */
  buildEpa: (epaId: string) => `/nucleus/academy/build/epa/${epaId}`,
  PATHWAYS: "/nucleus/academy/pathways",
  /** Pathway detail page */
  pathway: (epaId: string) => `/nucleus/academy/pathways/${epaId}`,
  VERIFICATIONS: "/nucleus/academy/verifications",
  DASHBOARD: "/nucleus/academy/dashboard",
  REVIEW: "/nucleus/academy/review",
  PORTFOLIO: "/nucleus/academy/portfolio",
  PROGRESS: "/nucleus/academy/progress",
  BOOKMARKS: "/nucleus/academy/bookmarks",
  /** KSB learning detail page */
  ksb: (ksbId: string) => `/nucleus/academy/ksb/${ksbId}`,
  /** Pathway preview page */
  preview: (id: string) => `/nucleus/academy/preview/${id}`,
  // GVP module pages
  GVP_MODULES: "/nucleus/academy/gvp-modules",
  GVP_ASSESSMENTS: "/nucleus/academy/gvp-assessments",
  GVP_PROGRESS: "/nucleus/academy/gvp-progress",
  GVP_CURRICULUM: "/nucleus/academy/gvp-curriculum",
  // Interactive
  SPARSE_CODING: "/nucleus/academy/interactive/sparse-coding",
  // PDC
  PDC: "/nucleus/academy/pdc",
} as const;

// ============================================================================
// Community Routes (Student-Facing)
// ============================================================================

export const COMMUNITY_ROUTES = {
  ROOT: "/nucleus/community",
  CIRCLES: "/nucleus/community/circles",
  /** Circle detail / workspace page */
  circle: (slug: string) => `/nucleus/community/circles/${slug}`,
  /** Circle projects list */
  circleProjects: (slug: string) =>
    `/nucleus/community/circles/${slug}/projects`,
  /** Project workspace */
  circleProject: (slug: string, projectId: string) =>
    `/nucleus/community/circles/${slug}/projects/${projectId}`,
  CREATE_CIRCLE: "/nucleus/community/circles/create",
  CREATE_POST: "/nucleus/community/circles/create-post",
  /** Post detail page */
  post: (postId: string) => `/nucleus/community/circles/post/${postId}`,
  /** Published research feed */
  PUBLICATIONS: "/nucleus/community/publications",
  MESSAGES: "/nucleus/community/messages",
  /** Conversation page */
  message: (conversationId: string) =>
    `/nucleus/community/messages/${conversationId}`,
  NOTIFICATIONS: "/nucleus/community/notifications",
  MEMBERS: "/nucleus/community/members",
  /** Member profile page */
  member: (userId: string) => `/nucleus/community/members/${userId}`,
  ONBOARDING: "/nucleus/community/onboarding",
  FOR_YOU: "/nucleus/community/for-you",
  SETTINGS_PROFILE: "/nucleus/community/settings/profile",
  // Discovery flow
  DISCOVER: "/nucleus/community/discover",
  DISCOVER_RESULTS: "/nucleus/community/discover/results",
  DISCOVER_MATCHES: "/nucleus/community/discover/matches",
  ANALYTICS: "/nucleus/community/analytics",
  SEARCH: "/nucleus/community/search",
  ADMIN_GOVERNANCE: "/nucleus/community/admin/governance",
  FIND_YOUR_HOME: "/nucleus/community/find-your-home",
  BENCHMARKS: "/nucleus/community/benchmarks",
  CASE_STUDIES: "/nucleus/community/case-studies",
  MARKETPLACE: "/nucleus/community/marketplace",
  /** Publication detail page */
  publication: (id: string) => `/nucleus/community/publications/${id}`,
  /** Create project in a circle */
  circleProjectCreate: (slug: string) =>
    `/nucleus/community/circles/${slug}/projects/create`,
} as const;

// ============================================================================
// Careers Routes
// ============================================================================

export const CAREERS_ROUTES = {
  ROOT: "/nucleus/careers",
  SKILLS: "/nucleus/careers/skills",
  ASSESSMENTS: "/nucleus/careers/assessments",
  ADVISORY_READINESS: "/nucleus/careers/assessments/advisory-readiness",
  VALUE_PROPOSITION: "/nucleus/careers/assessments/value-proposition-builder",
  HIDDEN_JOB_MARKET: "/nucleus/careers/assessments/hidden-job-market",
  INTERVIEW_PREP: "/nucleus/careers/assessments/interview-preparation",
} as const;

// ============================================================================
// Other Nucleus Sections
// ============================================================================

export const GUARDIAN_ROUTES = {
  ROOT: "/nucleus/guardian",
} as const;

export const VIGILANCE_ROUTES = {
  ROOT: "/nucleus/vigilance",
  // ─── PV Tool Pages (For AlgoVigilances wizards) ─────────────────────────
  // Ported to nucleus/vigilance (wizard + professional mode toggle):
  NARANJO_CAUSALITY: "/nucleus/vigilance/causality",
  PRR_SIGNAL_DETECTION: "/nucleus/vigilance/signals",
  CASE_SERIOUSNESS: "/nucleus/vigilance/seriousness",
  // Remaining in (authenticated)/ — port in follow-up:
  CASE_TRIAGE: "/case-triage",
  WHO_UMC_CAUSALITY: "/who-umc-causality",
  RUCAM_CAUSALITY: "/rucam-causality",
  BENEFIT_RISK: "/benefit-risk",
  EXPECTEDNESS_CHECK: "/expectedness-check",
  HARM_CLASSIFICATION: "/harm-classification",
  SEVERITY_GRADING: "/severity-grading",
  ICSR_PROCESSING: "/icsr-processing",
  REPORTING_DEADLINES: "/reporting-deadlines",
  DRUG_COMPARISON: "/drug-comparison",
  RISK_SCORING: "/risk-scoring",
  IRREVERSIBILITY: "/irreversibility",
  SAFETY_MARGIN: "/safety-margin",
  PBRER_ASSESSMENT: "/pbrer-assessment",
  PMR_COMPLIANCE: "/pmr-compliance",
  PORTFOLIO_RISK: "/portfolio-risk",
  SURVEILLANCE: "/surveillance",
  WORKFLOW_ROUTER: "/workflow-router",
  DOSSIER_COMPLETENESS: "/dossier-completeness",
  SIGNAL_TRENDING: "/signal-trending",
  // ─── Foundational Theory (paywalled) ─────────────────────────────────
  THEORY_OF_VIGILANCE: "/nucleus/vigilance/theory-of-vigilance",
  COMPUTATIONAL_PV: "/nucleus/vigilance/computational-pv",
  INTERVENTION_VIGILANCE: "/nucleus/vigilance/intervention-vigilance",
} as const;

export const TERMINAL_ROUTES = {
  ROOT: "/nucleus/terminal",
} as const;

export const TOOLS_ROUTES = {
  ROOT: "/nucleus/tools",
  DECISION_TREE: "/nucleus/tools/decision-tree",
  TEXT_OPTIMIZER: "/nucleus/tools/text-optimizer",
  FUZZY_MATCHER: "/nucleus/tools/fuzzy-matcher",
  AI_DETECTOR: "/nucleus/tools/ai-detector",
} as const;

export const OBSERVATORY_ROUTES = {
  ROOT: "/observatory",
  CHEMISTRY: "/observatory/chemistry",
  LEARNING: "/observatory/learning",
  ATLAS: "/observatory/atlas",
  MATH: "/observatory/math",
  CAUSALITY: "/observatory/causality",
  TIMELINE: "/observatory/timeline",
  MOLECULE: "/observatory/molecule",
  REGULATORY: "/observatory/regulatory",
  STATE: "/observatory/state",
  EPIDEMIOLOGY: "/observatory/epidemiology",
  GRAPH: "/observatory/graph",
  CAREERS: "/observatory/careers",
} as const;

export const ORGANIZATION_ROUTES = {
  ROOT: "/nucleus/organization",
  ANALYTICS: "/nucleus/organization/analytics",
  SETTINGS: "/nucleus/organization/settings",
  /** Program detail page */
  program: (id: string) => `/nucleus/organization/programs/${id}`,
} as const;

export const REGULATORY_ROUTES = {
  ROOT: "/nucleus/regulatory",
} as const;

export const VENTURES_ROUTES = {
  ROOT: "/nucleus/ventures",
} as const;

export const SOLUTIONS_ROUTES = {
  ROOT: "/nucleus/solutions",
} as const;

// ============================================================================
// Admin Routes
// ============================================================================

export const ADMIN_ROUTES = {
  ROOT: "/nucleus/admin",
  SETTINGS: "/nucleus/admin/settings",
  CONTENT_VALIDATION: "/nucleus/admin/content-validation",
  CONTENT_FRESHNESS: "/nucleus/admin/content-freshness",
  WEBSITE_LEADS: "/nucleus/admin/website-leads",
  WEBSITE_LEADS_CONSULTING: "/nucleus/admin/website-leads/consulting",
  WEBSITE_LEADS_CONTACT: "/nucleus/admin/website-leads/contact",
  WEBSITE_LEADS_QUIZ: "/nucleus/admin/website-leads/quiz-sessions",
  NEURAL_VIZ: "/nucleus/admin/neural-visualization",
  SEED: "/nucleus/admin/seed",
  CONSULTING_LEADS: "/nucleus/admin/consulting-leads",
  CONTACT_SUBMISSIONS: "/nucleus/admin/contact-submissions",
  AFFILIATE_APPLICATIONS: "/nucleus/admin/affiliate-applications",
} as const;

export const ADMIN_ACADEMY_ROUTES = {
  ROOT: "/nucleus/admin/academy",
  COURSES_NEW: "/nucleus/admin/academy/courses/new",
  COURSES_GENERATE: "/nucleus/admin/academy/courses/generate",
  /** Course edit page */
  courseEdit: (id: string) => `/nucleus/admin/academy/courses/${id}/edit`,
  /** Course preview page */
  coursePreview: (id: string) => `/nucleus/admin/academy/courses/${id}/preview`,
  RESOURCES: "/nucleus/admin/academy/resources",
  CERTIFICATES: "/nucleus/admin/academy/certificates",
  FRAMEWORK: "/nucleus/admin/academy/framework",
  PV_DOMAINS: "/nucleus/admin/academy/pv-domains",
  KSB_BUILDER: "/nucleus/admin/academy/ksb-builder",
  KSB_BUILDER_REVIEW: "/nucleus/admin/academy/ksb-builder/review",
  KSB_MANAGEMENT: "/nucleus/admin/academy/ksb-management",
  KSB_PV: "/nucleus/admin/academy/ksb-management/pharmacovigilance",
  PIPELINE: "/nucleus/admin/academy/pipeline",
  CONTENT_PIPELINE: "/nucleus/admin/academy/content-pipeline",
  MY_WORK: "/nucleus/admin/academy/my-work",
  LEARNERS: "/nucleus/admin/academy/learners",
  /** Learner profile page */
  learner: (userId: string) => `/nucleus/admin/academy/learners/${userId}`,
  // PDC subsection
  PDC: "/nucleus/admin/academy/pdc",
  PDC_CPAS: "/nucleus/admin/academy/pdc/cpas",
  PDC_CPAS_NEW: "/nucleus/admin/academy/pdc/cpas/new",
  /** CPA detail page */
  pdcCpa: (cpaId: string) => `/nucleus/admin/academy/pdc/cpas/${cpaId}`,
  PDC_HIERARCHY: "/nucleus/admin/academy/pdc/hierarchy",
  PDC_IMPORT: "/nucleus/admin/academy/pdc/import",
  PDC_QUALITY: "/nucleus/admin/academy/pdc/quality",
} as const;

export const ADMIN_COMMUNITY_ROUTES = {
  ROOT: "/nucleus/admin/community",
  POSTS: "/nucleus/admin/community/posts",
  CIRCLES: "/nucleus/admin/community/circles",
  /** Circle edit page */
  circleEdit: (circleId: string) =>
    `/nucleus/admin/community/circles/${circleId}/edit`,
  BADGES: "/nucleus/admin/community/badges",
  MODERATION: "/nucleus/admin/community/moderation",
  NOTIFICATIONS: "/nucleus/admin/community/notifications",
  SETTINGS: "/nucleus/admin/community/settings",
  DISCOVERY: "/nucleus/admin/community/discovery",
  USERS: "/nucleus/admin/community/users",
  MESSAGES: "/nucleus/admin/community/messages",
  ANALYTICS: "/nucleus/admin/community/analytics",
  CREATE_POST: "/nucleus/admin/community/circles/create-post",
} as const;

export const ADMIN_INTELLIGENCE_ROUTES = {
  ROOT: "/nucleus/admin/intelligence",
  /** Intelligence detail page */
  detail: (id: string) => `/nucleus/admin/intelligence/${id}`,
} as const;

// ============================================================================
// Unified ROUTES object (re-exports all sections for convenience)
// ============================================================================

/**
 * Unified route constants object.
 * Import individual section objects for tree-shaking,
 * or use this unified object for convenience.
 *
 * Usage:
 *   import { ROUTES } from '@/lib/routes';
 *   <Link href={ROUTES.NUCLEUS.ACADEMY.ROOT}>
 *   router.push(ROUTES.AUTH.SIGNIN);
 *   redirect(ROUTES.NUCLEUS.ROOT);
 *   revalidatePath(ROUTES.ADMIN.COMMUNITY.POSTS);
 */
export const ROUTES = {
  ...PUBLIC_ROUTES,
  AUTH: AUTH_ROUTES,
  NUCLEUS: {
    ...NUCLEUS,
    PROFILE: PROFILE_ROUTES,
    ACADEMY: ACADEMY_ROUTES,
    COMMUNITY: COMMUNITY_ROUTES,
    CAREERS: CAREERS_ROUTES,
    GUARDIAN: GUARDIAN_ROUTES,
    VIGILANCE: VIGILANCE_ROUTES,
    TERMINAL: TERMINAL_ROUTES,
    TOOLS: TOOLS_ROUTES,
    OBSERVATORY: OBSERVATORY_ROUTES,
    ORGANIZATION: ORGANIZATION_ROUTES,
    REGULATORY: REGULATORY_ROUTES,
    VENTURES: VENTURES_ROUTES,
    SOLUTIONS: SOLUTIONS_ROUTES,
  },
  ADMIN: {
    ...ADMIN_ROUTES,
    ACADEMY: ADMIN_ACADEMY_ROUTES,
    COMMUNITY: ADMIN_COMMUNITY_ROUTES,
    INTELLIGENCE: ADMIN_INTELLIGENCE_ROUTES,
  },
} as const;
