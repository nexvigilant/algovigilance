/**
 * Organization Constants
 *
 * Pre-defined lists of professional organizations, Greek organizations,
 * career functions, and industries for circle tagging and discovery.
 */

import type { OrganizationType } from '@/types/circle-taxonomy';

/**
 * Organization definition
 */
export interface Organization {
  id: string;
  name: string;
  acronym?: string;
  type: OrganizationType;
  description?: string;
  website?: string;
}

/**
 * Professional associations and organizations
 */
export const PROFESSIONAL_ORGANIZATIONS: Organization[] = [
  // Engineering & Tech
  { id: 'nsbe', name: 'National Society of Black Engineers', acronym: 'NSBE', type: 'professional-association', description: 'Supporting Black engineers in education and career' },
  { id: 'shpe', name: 'Society of Hispanic Professional Engineers', acronym: 'SHPE', type: 'professional-association', description: 'Empowering Hispanic engineers to realize their fullest potential' },
  { id: 'swe', name: 'Society of Women Engineers', acronym: 'SWE', type: 'professional-association', description: 'Empowering women to achieve full potential in engineering' },
  { id: 'ieee', name: 'Institute of Electrical and Electronics Engineers', acronym: 'IEEE', type: 'professional-association', description: 'World\'s largest technical professional organization' },
  { id: 'acm', name: 'Association for Computing Machinery', acronym: 'ACM', type: 'professional-association', description: 'World\'s largest educational and scientific computing society' },

  // Project Management & Business
  { id: 'pmi', name: 'Project Management Institute', acronym: 'PMI', type: 'professional-association', description: 'Global association for project managers' },
  { id: 'ama', name: 'American Management Association', acronym: 'AMA', type: 'professional-association', description: 'Management development organization' },
  { id: 'shrm', name: 'Society for Human Resource Management', acronym: 'SHRM', type: 'professional-association', description: 'HR professionals association' },

  // Healthcare & Life Sciences
  { id: 'ispe', name: 'International Society for Pharmaceutical Engineering', acronym: 'ISPE', type: 'professional-association', description: 'Pharmaceutical manufacturing professionals' },
  { id: 'ashp', name: 'American Society of Health-System Pharmacists', acronym: 'ASHP', type: 'professional-association', description: 'Health-system pharmacy professionals' },
  { id: 'apha', name: 'American Pharmacists Association', acronym: 'APhA', type: 'professional-association', description: 'National professional society of pharmacists' },
  { id: 'dia', name: 'Drug Information Association', acronym: 'DIA', type: 'professional-association', description: 'Global healthcare insights community' },
  { id: 'raps', name: 'Regulatory Affairs Professionals Society', acronym: 'RAPS', type: 'professional-association', description: 'Regulatory professionals in healthcare' },
  { id: 'accp', name: 'American College of Clinical Pharmacology', acronym: 'ACCP', type: 'professional-association', description: 'Clinical pharmacology professionals' },
  { id: 'acrp', name: 'Association of Clinical Research Professionals', acronym: 'ACRP', type: 'professional-association', description: 'Clinical research professionals' },
  { id: 'socra', name: 'Society of Clinical Research Associates', acronym: 'SOCRA', type: 'professional-association', description: 'Clinical research professionals worldwide' },

  // Finance & Accounting
  { id: 'cfa', name: 'CFA Institute', acronym: 'CFA', type: 'certification-body', description: 'Investment professionals' },
  { id: 'aicpa', name: 'American Institute of CPAs', acronym: 'AICPA', type: 'professional-association', description: 'Certified public accountants' },

  // Design & Product
  { id: 'aiga', name: 'AIGA, the Professional Association for Design', acronym: 'AIGA', type: 'professional-association', description: 'Design professionals' },
  { id: 'uxpa', name: 'User Experience Professionals Association', acronym: 'UXPA', type: 'professional-association', description: 'UX professionals worldwide' },
  { id: 'productboard', name: 'Product Management Festival', type: 'industry-group', description: 'Product management community' },

  // Data & Analytics
  { id: 'dama', name: 'Data Management Association', acronym: 'DAMA', type: 'professional-association', description: 'Data management professionals' },
  { id: 'informs', name: 'Institute for Operations Research and Management Sciences', acronym: 'INFORMS', type: 'professional-association', description: 'Analytics and operations research' },
];

/**
 * Greek letter organizations (fraternities and sororities)
 */
export const GREEK_ORGANIZATIONS: Organization[] = [
  // Divine Nine
  { id: 'alpha-phi-alpha', name: 'Alpha Phi Alpha Fraternity, Inc.', type: 'fraternity-sorority', description: 'First intercollegiate Greek-letter fraternity for African Americans' },
  { id: 'alpha-kappa-alpha', name: 'Alpha Kappa Alpha Sorority, Inc.', type: 'fraternity-sorority', description: 'First Greek-letter organization for African American women' },
  { id: 'kappa-alpha-psi', name: 'Kappa Alpha Psi Fraternity, Inc.', type: 'fraternity-sorority', description: 'Founded on achievement in every field of human endeavor' },
  { id: 'omega-psi-phi', name: 'Omega Psi Phi Fraternity, Inc.', type: 'fraternity-sorority', description: 'First international fraternal organization founded at an HBCU' },
  { id: 'delta-sigma-theta', name: 'Delta Sigma Theta Sorority, Inc.', type: 'fraternity-sorority', description: 'Public service sorority' },
  { id: 'phi-beta-sigma', name: 'Phi Beta Sigma Fraternity, Inc.', type: 'fraternity-sorority', description: 'Culture for service, service for humanity' },
  { id: 'zeta-phi-beta', name: 'Zeta Phi Beta Sorority, Inc.', type: 'fraternity-sorority', description: 'Finer womanhood, scholarship, service, and sisterhood' },
  { id: 'sigma-gamma-rho', name: 'Sigma Gamma Rho Sorority, Inc.', type: 'fraternity-sorority', description: 'Greater service, greater progress' },
  { id: 'iota-phi-theta', name: 'Iota Phi Theta Fraternity, Inc.', type: 'fraternity-sorority', description: 'Building a tradition, not resting upon one' },

  // Other notable organizations
  { id: 'lambda-theta-alpha', name: 'Lambda Theta Alpha Latin Sorority, Inc.', type: 'fraternity-sorority', description: 'First Latina sorority' },
  { id: 'lambda-sigma-upsilon', name: 'Lambda Sigma Upsilon Latino Fraternity, Inc.', type: 'fraternity-sorority', description: 'Latino fraternity' },
];

/**
 * Common career functions / job families
 */
export const CAREER_FUNCTIONS = [
  // Tech & Engineering
  { id: 'software-engineering', label: 'Software Engineering', category: 'Technology' },
  { id: 'data-science', label: 'Data Science & Analytics', category: 'Technology' },
  { id: 'product-management', label: 'Product Management', category: 'Technology' },
  { id: 'ux-design', label: 'UX/UI Design', category: 'Technology' },
  { id: 'devops', label: 'DevOps & Infrastructure', category: 'Technology' },
  { id: 'security', label: 'Cybersecurity', category: 'Technology' },
  { id: 'ai-ml', label: 'AI & Machine Learning', category: 'Technology' },
  { id: 'qa-testing', label: 'QA & Testing', category: 'Technology' },

  // Life Sciences & Healthcare
  { id: 'pharmacovigilance', label: 'Pharmacovigilance', category: 'Life Sciences' },
  { id: 'clinical-research', label: 'Clinical Research', category: 'Life Sciences' },
  { id: 'regulatory-affairs', label: 'Regulatory Affairs', category: 'Life Sciences' },
  { id: 'medical-affairs', label: 'Medical Affairs', category: 'Life Sciences' },
  { id: 'drug-safety', label: 'Drug Safety', category: 'Life Sciences' },
  { id: 'clinical-operations', label: 'Clinical Operations', category: 'Life Sciences' },
  { id: 'quality-assurance', label: 'Quality Assurance', category: 'Life Sciences' },
  { id: 'biostatistics', label: 'Biostatistics', category: 'Life Sciences' },
  { id: 'medical-writing', label: 'Medical Writing', category: 'Life Sciences' },

  // Business & Operations
  { id: 'marketing', label: 'Marketing', category: 'Business' },
  { id: 'sales', label: 'Sales', category: 'Business' },
  { id: 'finance', label: 'Finance', category: 'Business' },
  { id: 'operations', label: 'Operations', category: 'Business' },
  { id: 'human-resources', label: 'Human Resources', category: 'Business' },
  { id: 'legal', label: 'Legal', category: 'Business' },
  { id: 'consulting', label: 'Consulting', category: 'Business' },
  { id: 'project-management', label: 'Project Management', category: 'Business' },
  { id: 'strategy', label: 'Strategy', category: 'Business' },
  { id: 'business-development', label: 'Business Development', category: 'Business' },

  // Creative & Communications
  { id: 'content-writing', label: 'Content Writing', category: 'Creative' },
  { id: 'graphic-design', label: 'Graphic Design', category: 'Creative' },
  { id: 'communications', label: 'Communications & PR', category: 'Creative' },
] as const;

/**
 * Industries for circle tagging
 */
export const INDUSTRIES = [
  { id: 'technology', label: 'Technology', description: 'Software, hardware, and tech services' },
  { id: 'pharmaceuticals', label: 'Pharmaceuticals', description: 'Drug development and manufacturing' },
  { id: 'biotechnology', label: 'Biotechnology', description: 'Biotech research and development' },
  { id: 'healthcare', label: 'Healthcare', description: 'Healthcare providers and services' },
  { id: 'medical-devices', label: 'Medical Devices', description: 'Medical equipment and devices' },
  { id: 'finance', label: 'Finance & Banking', description: 'Financial services and banking' },
  { id: 'consulting', label: 'Consulting', description: 'Professional consulting services' },
  { id: 'education', label: 'Education', description: 'Educational institutions and edtech' },
  { id: 'government', label: 'Government', description: 'Public sector and government' },
  { id: 'nonprofit', label: 'Non-Profit', description: 'Non-profit organizations' },
  { id: 'manufacturing', label: 'Manufacturing', description: 'Manufacturing and production' },
  { id: 'retail', label: 'Retail', description: 'Retail and e-commerce' },
  { id: 'media', label: 'Media & Entertainment', description: 'Media, entertainment, and publishing' },
  { id: 'energy', label: 'Energy', description: 'Energy and utilities' },
  { id: 'transportation', label: 'Transportation', description: 'Transportation and logistics' },
  { id: 'real-estate', label: 'Real Estate', description: 'Real estate and construction' },
  { id: 'insurance', label: 'Insurance', description: 'Insurance services' },
  { id: 'telecommunications', label: 'Telecommunications', description: 'Telecom and communications' },
  { id: 'aerospace', label: 'Aerospace & Defense', description: 'Aerospace and defense industries' },
  { id: 'agriculture', label: 'Agriculture', description: 'Agriculture and food production' },
] as const;

/**
 * Common professional skills for tagging
 */
export const PROFESSIONAL_SKILLS = [
  // Technical Skills
  { id: 'python', label: 'Python', category: 'Technical' },
  { id: 'javascript', label: 'JavaScript', category: 'Technical' },
  { id: 'sql', label: 'SQL', category: 'Technical' },
  { id: 'r', label: 'R', category: 'Technical' },
  { id: 'excel', label: 'Excel / Spreadsheets', category: 'Technical' },
  { id: 'tableau', label: 'Tableau / Data Viz', category: 'Technical' },
  { id: 'aws', label: 'AWS', category: 'Technical' },
  { id: 'gcp', label: 'Google Cloud', category: 'Technical' },

  // Life Sciences Skills
  { id: 'gcp-compliance', label: 'GCP Compliance', category: 'Life Sciences' },
  { id: 'ich-guidelines', label: 'ICH Guidelines', category: 'Life Sciences' },
  { id: 'meddra', label: 'MedDRA Coding', category: 'Life Sciences' },
  { id: 'e2b-reporting', label: 'E2B Reporting', category: 'Life Sciences' },
  { id: 'signal-detection', label: 'Signal Detection', category: 'Life Sciences' },
  { id: 'sas', label: 'SAS', category: 'Life Sciences' },
  { id: 'ctms', label: 'CTMS', category: 'Life Sciences' },
  { id: 'edc', label: 'EDC Systems', category: 'Life Sciences' },

  // Soft Skills
  { id: 'leadership', label: 'Leadership', category: 'Soft Skills' },
  { id: 'communication', label: 'Communication', category: 'Soft Skills' },
  { id: 'public-speaking', label: 'Public Speaking', category: 'Soft Skills' },
  { id: 'negotiation', label: 'Negotiation', category: 'Soft Skills' },
  { id: 'project-management', label: 'Project Management', category: 'Soft Skills' },
  { id: 'stakeholder-management', label: 'Stakeholder Management', category: 'Soft Skills' },
  { id: 'team-building', label: 'Team Building', category: 'Soft Skills' },
  { id: 'mentoring', label: 'Mentoring', category: 'Soft Skills' },
] as const;

/**
 * Professional interests for tagging
 */
export const PROFESSIONAL_INTERESTS = [
  { id: 'ai-ethics', label: 'AI Ethics', category: 'Technology' },
  { id: 'remote-work', label: 'Remote Work', category: 'Workplace' },
  { id: 'dei', label: 'Diversity, Equity & Inclusion', category: 'Workplace' },
  { id: 'sustainability', label: 'Sustainability', category: 'Impact' },
  { id: 'digital-health', label: 'Digital Health', category: 'Healthcare' },
  { id: 'precision-medicine', label: 'Precision Medicine', category: 'Healthcare' },
  { id: 'patient-safety', label: 'Patient Safety', category: 'Healthcare' },
  { id: 'startup-culture', label: 'Startup Culture', category: 'Business' },
  { id: 'work-life-balance', label: 'Work-Life Balance', category: 'Workplace' },
  { id: 'continuous-learning', label: 'Continuous Learning', category: 'Personal Development' },
  { id: 'innovation', label: 'Innovation', category: 'Business' },
  { id: 'data-privacy', label: 'Data Privacy', category: 'Technology' },
  { id: 'global-health', label: 'Global Health', category: 'Healthcare' },
  { id: 'career-development', label: 'Career Development', category: 'Personal Development' },
  { id: 'networking', label: 'Professional Networking', category: 'Personal Development' },
] as const;

/**
 * Get all organizations (professional + Greek)
 */
export function getAllOrganizations(): Organization[] {
  return [...PROFESSIONAL_ORGANIZATIONS, ...GREEK_ORGANIZATIONS];
}

/**
 * Search organizations by name or acronym
 */
export function searchOrganizations(query: string): Organization[] {
  const lowerQuery = query.toLowerCase();
  return getAllOrganizations().filter(
    (org) =>
      org.name.toLowerCase().includes(lowerQuery) ||
      (org.acronym && org.acronym.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get organizations by type
 */
export function getOrganizationsByType(type: OrganizationType): Organization[] {
  return getAllOrganizations().filter((org) => org.type === type);
}

/**
 * Get career functions by category
 */
export function getCareerFunctionsByCategory(category: string): typeof CAREER_FUNCTIONS[number][] {
  return CAREER_FUNCTIONS.filter((func) => func.category === category);
}

/**
 * Type for career function IDs
 */
export type CareerFunctionId = typeof CAREER_FUNCTIONS[number]['id'];

/**
 * Type for industry IDs
 */
export type IndustryId = typeof INDUSTRIES[number]['id'];

/**
 * Type for skill IDs
 */
export type SkillId = typeof PROFESSIONAL_SKILLS[number]['id'];

/**
 * Type for interest IDs
 */
export type InterestId = typeof PROFESSIONAL_INTERESTS[number]['id'];
