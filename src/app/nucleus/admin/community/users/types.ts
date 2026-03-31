export interface CommunityUser {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  isBanned?: boolean;
  verifiedPractitioner?: boolean;
  trustStatus?: 'revoked';
  createdAt?: { seconds: number };
}
