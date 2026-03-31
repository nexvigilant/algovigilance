export interface WaitlistEntry {
  id: string;
  email: string;
  joinedAt: Date | null;
  status: 'pending' | 'invited' | 'activated' | 'declined';
  source: string;
  notifications: {
    platformUpdates: boolean;
    newReleases: boolean;
    importantChanges: boolean;
  };
  accessCode: string | null;
  accessCodeGeneratedAt: Date | null;
  notes?: string;
}

export const statusLabels: Record<string, string> = {
  pending: 'Pending',
  invited: 'Invited',
  activated: 'Activated',
  declined: 'Declined',
};
