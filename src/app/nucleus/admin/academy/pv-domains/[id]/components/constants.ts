import {
  Brain, Wrench, BookOpen, Sparkles,
  Target, ClipboardCheck,
  FolderOpen,
  Users, MessageSquare,
} from 'lucide-react';

// Type icons, colors, and labels
export const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  knowledge: { icon: Brain, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900', label: 'Knowledge(s)' },
  skill: { icon: Wrench, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', label: 'Skill(s)' },
  behavior: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900', label: 'Behavior(s)' },
  ai_integration: { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900', label: 'AI Integration(s)' },
};

// Sort options for capability components
export type SortOption = 'section' | 'name-asc' | 'name-desc' | 'level' | 'bloom';
export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'section', label: 'Section' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'level', label: 'Proficiency Level' },
  { value: 'bloom', label: 'Bloom Level' },
];

// Assessment category icons and colors
export const assessmentCategoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  'Assessment Frameworks': { icon: Target, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
  'Portfolio Requirements': { icon: FolderOpen, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  'Interview Framework': { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
  'Assessment Administration': { icon: Users, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900' },
  'default': { icon: ClipboardCheck, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900' },
};

// Map raw assessment types to consolidated categories
export function getAssessmentCategory(assessmentType: string): string {
  const type = assessmentType.toLowerCase();

  if (type.includes('assessment framework') || type.includes('l1-l2') || type.includes('l3-l4') || type.includes('l5+')) {
    return 'Assessment Frameworks';
  }
  if (type.includes('portfolio')) {
    return 'Portfolio Requirements';
  }
  if (type.includes('interview')) {
    return 'Interview Framework';
  }
  if (type.includes('assessor') || type.includes('reliability') || type.includes('feedback')) {
    return 'Assessment Administration';
  }

  return assessmentType; // Fallback to original if no match
}
