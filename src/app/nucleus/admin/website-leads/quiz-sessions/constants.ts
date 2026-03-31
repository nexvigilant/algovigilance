export interface QuizSession {
  id: string;
  // Contact info (from email capture)
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  // Quiz data
  answers: Record<string, string>;
  scores: {
    strategic: number;
    innovation: number;
    tactical: number;
    talent: number;
    technology: number;
  };
  tags: string[];
  branch: 'challenge' | 'opportunity' | 'exploration' | null;
  // Recommendations
  primaryRecommendation: string | null;
  secondaryRecommendations: string[];
  // Status
  status: 'completed' | 'incomplete' | 'contacted';
  read: boolean;
  // Timestamps
  startedAt: Date | null;
  completedAt: Date | null;
  // Source tracking
  source: string | null;
  utmCampaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
}

// Labels for display
export const branchLabels: Record<string, string> = {
  challenge: 'Challenge',
  opportunity: 'Opportunity',
  exploration: 'Exploration',
};

export const categoryLabels: Record<string, string> = {
  strategic: 'Strategic',
  innovation: 'Innovation',
  tactical: 'Tactical',
  talent: 'Capability-Elevating',
  technology: 'Technology',
};

export const statusLabels: Record<string, string> = {
  completed: 'Completed',
  incomplete: 'Incomplete',
  contacted: 'Contacted',
};
