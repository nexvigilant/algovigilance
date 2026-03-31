/**
 * Site Navigation Registry — Single Source of Truth
 *
 * Governs navigation structure for both surfaces:
 *   - Marketing (nexvigilant.com): public pages
 *   - Platform (Nucleus): authenticated app sections
 *
 * Shared vocabulary enforced via TypeScript union types:
 *   'learn', 'work', 'grow' mean the same thing on both surfaces.
 *
 * @module config/site-navigation
 */

// ============================================================================
// Type System
// ============================================================================

/** Sections shared across both surfaces — same ID = same meaning */
type SharedSectionId = "learn" | "work" | "grow";

/** Marketing-only sections (must not collide with platform-only) */
export type MarketingSectionId = SharedSectionId | "company";

/** Platform-only sections (must not collide with marketing-only) */
export type PlatformSectionId = SharedSectionId | "monitor" | "manage";

export type Persona = "ACQUIRE" | "ORIENT" | "OPERATE" | "GOVERN" | "REFERENCE";

export type NavPage = {
  /** Route path (absolute, starting with /) */
  path: string;
  /** Display title */
  title: string;
  /** One sentence — used in SEO meta and tooltips */
  description: string;
  /** User intent category */
  persona: Persona;
};

export type NavSection<Id extends string = string> = {
  /** Canonical section identifier — shared vocabulary enforced */
  id: Id;
  /** Display label for navigation */
  label: string;
  /** Pages within this section */
  pages: NavPage[];
};

// ============================================================================
// Marketing Surface — nexvigilant.com
// ============================================================================

export const marketingSections: NavSection<MarketingSectionId>[] = [
  {
    id: "learn",
    label: "Learn",
    pages: [
      {
        path: "/library",
        title: "Library",
        description:
          "Your open-source pharmacovigilant — signal detection, causality, benefit-risk, and more.",
        persona: "REFERENCE",
      },
      {
        path: "/academy",
        title: "Academy",
        description:
          "Build real-world pharmacovigilance skills through guided courses.",
        persona: "ACQUIRE",
      },
      {
        path: "/drugs",
        title: "Drug Safety",
        description:
          "Live adverse event profiles sourced from FDA and global databases.",
        persona: "OPERATE",
      },
      {
        path: "/glass",
        title: "Glass Labs",
        description:
          "Practice PV with real data — signal detection, causality, and benefit-risk labs.",
        persona: "OPERATE",
      },
      {
        path: "/intelligence",
        title: "Research",
        description:
          "Published safety intelligence and signal investigation reports.",
        persona: "REFERENCE",
      },
      {
        path: "/open-source",
        title: "Open Source",
        description: "NexCore crate catalog and open-source contributions.",
        persona: "REFERENCE",
      },
    ],
  },
  {
    id: "work",
    label: "Work",
    pages: [
      {
        path: "/station",
        title: "Station",
        description:
          "MCP tool platform for AI-powered pharmacovigilance agents.",
        persona: "ACQUIRE",
      },
      {
        path: "/station/connect",
        title: "Connect Your AI",
        description:
          "Add 1,900+ PV tools to Claude in 60 seconds. Free, no API key.",
        persona: "ACQUIRE",
      },
      {
        path: "/consulting",
        title: "Consulting",
        description:
          "Enterprise pharmacovigilance advisory and assessment services.",
        persona: "ACQUIRE",
      },
      {
        path: "/services",
        title: "Services",
        description:
          "Diagnostic assessment of your pharmacovigilance operations.",
        persona: "ACQUIRE",
      },
      {
        path: "/reports",
        title: "Reports",
        description:
          "Generate professional PV documents — signal evaluations, causality assessments, benefit-risk reports.",
        persona: "OPERATE",
      },
      {
        path: "/skills",
        title: "Skills",
        description:
          "Catalog of AI agent skills for pharmacovigilance workflows.",
        persona: "REFERENCE",
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    pages: [
      {
        path: "/community",
        title: "Community",
        description: "Connect with pharmacovigilance peers and mentors.",
        persona: "ACQUIRE",
      },
      {
        path: "/careers",
        title: "Careers",
        description: "Navigate your pharmacovigilance career path.",
        persona: "ACQUIRE",
      },
      {
        path: "/grow",
        title: "Growth Pathway",
        description:
          "Personalized growth track based on your PV experience level.",
        persona: "ORIENT",
      },
    ],
  },
  {
    id: "company",
    label: "Company",
    pages: [
      {
        path: "/about",
        title: "About Us",
        description:
          "AlgoVigilance mission, team, and pharmacovigilance philosophy.",
        persona: "ACQUIRE",
      },
      {
        path: "/doctrine",
        title: "Our Principles",
        description:
          "The operational principles that guide AlgoVigilance decisions.",
        persona: "REFERENCE",
      },
      {
        path: "/changelog",
        title: "Changelog",
        description: "Latest platform updates, features, and improvements.",
        persona: "REFERENCE",
      },
      {
        path: "/contact",
        title: "Contact",
        description:
          "Reach the AlgoVigilance team for questions or partnerships.",
        persona: "ACQUIRE",
      },
      {
        path: "/pricing",
        title: "Pricing",
        description: "Station, Professional, and Enterprise plans — all free during open beta.",
        persona: "ACQUIRE",
      },
      {
        path: "/status",
        title: "Status",
        description: "Live system health and service availability dashboard.",
        persona: "REFERENCE",
      },
    ],
  },
];

// ============================================================================
// Platform Surface — Nucleus (/nucleus/*)
// ============================================================================

export const platformSections: NavSection<PlatformSectionId>[] = [
  {
    id: "learn",
    label: "Learn",
    pages: [
      {
        path: "/nucleus/academy",
        title: "Academy",
        description:
          "PV courses with spaced repetition and competency tracking.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/glass",
        title: "Glass Labs",
        description:
          "Hands-on signal detection, causality, and benefit-risk labs powered by live Station data.",
        persona: "OPERATE",
      },
      {
        path: "/observatory",
        title: "Observatory",
        description:
          "3D visualizations of pharmacovigilance data and relationships.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/regulatory",
        title: "Regulatory",
        description:
          "ICH guidelines, compliance tracking, and regulatory timelines.",
        persona: "OPERATE",
      },
    ],
  },
  {
    id: "work",
    label: "Work",
    pages: [
      {
        path: "/nucleus/dashboards",
        title: "PV Dashboards",
        description:
          "Run complete PV workflows with live data and download professional reports.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/vigilance",
        title: "Vigilance",
        description:
          "Signal detection, causality assessment, and safety surveillance tools.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/tools",
        title: "Tools",
        description:
          "Utility tools for PV analysis, publishing, and data exploration.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/forge",
        title: "Forge",
        description:
          "Development sandbox for building and testing PV capabilities.",
        persona: "OPERATE",
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    pages: [
      {
        path: "/nucleus/community",
        title: "Community",
        description:
          "Circles, messaging, publications, and peer collaboration.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/careers",
        title: "Careers",
        description:
          "Career assessments, pathways, and professional development tools.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/marketplace",
        title: "Marketplace",
        description:
          "Extensions and integrations for the AlgoVigilance platform.",
        persona: "OPERATE",
      },
    ],
  },
  {
    id: "monitor",
    label: "Monitor",
    pages: [
      {
        path: "/nucleus/vitals",
        title: "NexWatch",
        description:
          "Real-time Galaxy Watch biometric monitoring — heart rate, HRV, stress.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/alerts",
        title: "Alerts",
        description:
          "Adverse event, compliance, and vendor risk alert monitoring.",
        persona: "OPERATE",
      },
      {
        path: "/nucleus/guardian",
        title: "Guardian",
        description: "System health monitoring and brain session management.",
        persona: "GOVERN",
      },
      {
        path: "/nucleus/live-feed",
        title: "Live Feed",
        description: "Real-time stream of platform events and safety signals.",
        persona: "OPERATE",
      },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    pages: [
      {
        path: "/nucleus/organization",
        title: "Organization",
        description:
          "Organization settings, analytics, and program management.",
        persona: "GOVERN",
      },
      {
        path: "/nucleus/billing",
        title: "Billing",
        description:
          "Subscription plans, Station API keys, and payment management.",
        persona: "GOVERN",
      },
      {
        path: "/nucleus/admin",
        title: "Admin",
        description:
          "Platform administration for academy, community, and content.",
        persona: "GOVERN",
      },
    ],
  },
];

// ============================================================================
// Non-Nav Routes (not in primary navigation, separate exports)
// ============================================================================

export const authRoutes: NavPage[] = [
  {
    path: "/auth/signin",
    title: "Sign In",
    description: "Sign in to your AlgoVigilance account.",
    persona: "ORIENT",
  },
  {
    path: "/auth/signup",
    title: "Sign Up",
    description: "Create a new AlgoVigilance account.",
    persona: "ORIENT",
  },
  {
    path: "/auth/reset-password",
    title: "Reset Password",
    description: "Reset your AlgoVigilance account password.",
    persona: "ORIENT",
  },
  {
    path: "/trial/start",
    title: "Start Trial",
    description: "Begin your free trial of AlgoVigilance.",
    persona: "ACQUIRE",
  },
];

export const legalRoutes: NavPage[] = [
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "How AlgoVigilance collects, uses, and protects your data.",
    persona: "REFERENCE",
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description: "Terms governing use of the AlgoVigilance platform.",
    persona: "REFERENCE",
  },
];

export const unlistedRoutes: NavPage[] = [
  {
    path: "/invest",
    title: "Investors",
    description: "Investment information for AlgoVigilance LLC.",
    persona: "ACQUIRE",
  },
  {
    path: "/waitlist",
    title: "Waitlist",
    description: "Join the AlgoVigilance platform waitlist.",
    persona: "ACQUIRE",
  },
  {
    path: "/appe-tester",
    title: "APPE Tester",
    description: "Pharmacy experiential education assessment tool.",
    persona: "OPERATE",
  },
  {
    path: "/agents",
    title: "AI Agents",
    description: "AlgoVigilance AI agent capabilities and integrations.",
    persona: "ACQUIRE",
  },
  {
    path: "/transparency",
    title: "Transparency",
    description: "AlgoVigilance operational transparency and disclosures.",
    persona: "REFERENCE",
  },
  {
    path: "/crystalbook",
    title: "Crystalbook",
    description: "The 8 Laws of AlgoVigilance operational philosophy.",
    persona: "REFERENCE",
  },
  {
    path: "/crystalbook/diagnostic",
    title: "Crystalbook Diagnostic",
    description: "Diagnose decisions against the 8 Laws framework.",
    persona: "OPERATE",
  },
  {
    path: "/tools",
    title: "Public Tools",
    description: "Free interactive tools for pharmacovigilance professionals.",
    persona: "OPERATE",
  },
  {
    path: "/tools/epub-publisher",
    title: "EPUB Publisher",
    description: "Convert manuscripts to publication-ready EPUB format.",
    persona: "OPERATE",
  },
  {
    path: "/tools/epub-reader",
    title: "EPUB Reader",
    description: "Read EPUB books directly in the browser.",
    persona: "OPERATE",
  },
  {
    path: "/ventures",
    title: "Ventures",
    description: "Innovation pipeline and healthcare entrepreneurship.",
    persona: "ACQUIRE",
  },
];

export const platformUtilityRoutes: NavPage[] = [
  {
    path: "/nucleus",
    title: "Nucleus Home",
    description: "Central hub for all AlgoVigilance platform sections.",
    persona: "ORIENT",
  },
  {
    path: "/nucleus/profile",
    title: "Profile",
    description: "Your account profile and settings.",
    persona: "OPERATE",
  },
  {
    path: "/nucleus/profile/subscription",
    title: "Subscription",
    description: "Manage your AlgoVigilance subscription plan.",
    persona: "OPERATE",
  },
  {
    path: "/nucleus/onboarding",
    title: "Onboarding",
    description: "New user orientation and first-use wizard.",
    persona: "ORIENT",
  },
];

// ============================================================================
// Redirect Map — Deprecated Routes → Canonical Destinations
// ============================================================================

/** 301 redirect map: source path → canonical destination */
export const redirectMap: Record<string, string> = {
  // Platform merges (Phase 1 dispositions)
  "/nucleus/compliance": "/nucleus/regulatory",
  "/nucleus/research": "/nucleus/vigilance",
  "/nucleus/solutions": "/nucleus/organization",
  "/nucleus/ml": "/nucleus/tools",
  "/nucleus/os": "/nucleus/tools",
  "/nucleus/terminal": "/nucleus/tools",
  "/nucleus/insights": "/nucleus/vigilance/analytics",
  "/nucleus/ventures": "/nucleus/marketplace",
  // Marketing redirects (Phase 1 dispositions)
  "/live-feed": "/nucleus/live-feed",
  "/capabilities": "/station",
  "/schedule": "/contact",
  "/guardian": "/station",
  "/guardian/docs/quickstart": "/station",
  "/membership": "/auth/signup",
};

// ============================================================================
// Utility Functions
// ============================================================================

/** All pages flattened — computed once, reused by lookups */
const ALL_PAGES: NavPage[] = [
  ...marketingSections.flatMap((s) => s.pages),
  ...platformSections.flatMap((s) => s.pages),
  ...authRoutes,
  ...legalRoutes,
  ...unlistedRoutes,
  ...platformUtilityRoutes,
];

/** Lookup a page by its exact path across all registries */
export function getPageByPath(path: string): NavPage | undefined {
  return ALL_PAGES.find((p) => p.path === path);
}

/** Get all pages for a specific marketing section */
export function getMarketingSection(
  id: MarketingSectionId,
): NavSection<MarketingSectionId> | undefined {
  return marketingSections.find((s) => s.id === id);
}

/** Get all pages for a specific platform section */
export function getPlatformSection(
  id: PlatformSectionId,
): NavSection<PlatformSectionId> | undefined {
  return platformSections.find((s) => s.id === id);
}

/** Check if a path has a redirect and return the destination */
export function getRedirect(path: string): string | undefined {
  return redirectMap[path];
}
