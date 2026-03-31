import {
  Sparkles,
  Users,
  UserSearch,
  Compass,
  Briefcase,
  BarChart3,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface CommunitySection {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  hoverBorder: string;
}

export const COMMUNITY_SECTIONS: CommunitySection[] = [
  {
    title: 'For You',
    description: 'Your personalized feed of posts and activity from circles you follow',
    href: '/nucleus/community/for-you',
    icon: Sparkles,
    color: 'text-cyan',
    hoverBorder: 'hover:border-cyan/50',
  },
  {
    title: 'Circles',
    description: 'Browse, filter, and join professional communities by topic or interest',
    href: '/nucleus/community/circles',
    icon: Users,
    color: 'text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/50',
  },
  {
    title: 'Members',
    description: 'Connect with AlgoVigilances and vigilance professionals worldwide',
    href: '/nucleus/community/members',
    icon: UserSearch,
    color: 'text-gold-300',
    hoverBorder: 'hover:border-gold-400/50',
  },
  {
    title: 'Discover',
    description: 'Take a quick quiz to find circles perfectly matched to your goals',
    href: '/nucleus/community/discover',
    icon: Compass,
    color: 'text-gold',
    hoverBorder: 'hover:border-gold/50',
  },
  {
    title: 'Expert Marketplace',
    description: 'Find and engage verified AlgoVigilance experts for consulting and advisory',
    href: '/nucleus/community/marketplace',
    icon: Briefcase,
    color: 'text-copper',
    hoverBorder: 'hover:border-copper/50',
  },
  {
    title: 'Peer Benchmarks',
    description: 'Compare your vigilance performance against anonymized platform-wide metrics',
    href: '/nucleus/community/benchmarks',
    icon: BarChart3,
    color: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/50',
  },
  {
    title: 'Case Studies',
    description: 'Browse and share anonymized vigilance case studies for collective intelligence',
    href: '/nucleus/community/case-studies',
    icon: FileText,
    color: 'text-gold-300',
    hoverBorder: 'hover:border-gold-400/50',
  },
];
