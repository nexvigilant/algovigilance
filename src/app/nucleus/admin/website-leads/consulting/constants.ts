export interface ConsultingInquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  companyName: string;
  companyType: string;
  companySize: string;
  consultingCategory: string;
  budgetRange: string;
  timeline: string;
  challengeDescription: string;
  submittedAt: Date | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed-won' | 'closed-lost';
  read: boolean;
  leadScore: number;
  notes?: string;
  source?: string;
}

// Human-readable labels for display
export const companyTypeLabels: Record<string, string> = {
  pharmaceutical: 'Pharmaceutical',
  biotech: 'Biotechnology',
  cro: 'CRO',
  healthcare: 'Healthcare',
  'medical-device': 'Medical Device',
  consulting: 'Consulting',
  other: 'Other',
};

export const companySizeLabels: Record<string, string> = {
  '1-50': '1-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '501-1000': '501-1,000',
  '1001-5000': '1,001-5,000',
  '5000+': '5,000+',
};

export const categoryLabels: Record<string, string> = {
  strategic: 'Strategic',
  innovation: 'Innovation',
  'talent': 'Capability-Elevating',
  tactical: 'Tactical',
  multiple: 'Multiple',
};

export const budgetLabels: Record<string, string> = {
  'under-25k': '<$25K',
  '25k-50k': '$25-50K',
  '50k-100k': '$50-100K',
  '100k-250k': '$100-250K',
  '250k-500k': '$250-500K',
  'over-500k': '>$500K',
  'not-sure': 'TBD',
};

export const timelineLabels: Record<string, string> = {
  immediate: 'Immediate',
  '1-3-months': '1-3 mo',
  '3-6-months': '3-6 mo',
  '6-plus-months': '6+ mo',
  exploratory: 'Exploratory',
};

export const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  'closed-won': 'Won',
  'closed-lost': 'Lost',
};
