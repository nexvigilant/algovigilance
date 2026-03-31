// Utility functions for skills tracker

export function getProficiencyBadge(level: string) {
  const colors = {
    beginner: 'bg-yellow-500/20 text-yellow-500',
    intermediate: 'bg-blue-500/20 text-blue-500',
    advanced: 'bg-purple-500/20 text-purple-500',
    expert: 'bg-gold-500/20 text-gold-500',
  };
  return colors[level as keyof typeof colors] || 'bg-gray-500/20 text-gray-500';
}

export function getCategoryColor(category: string) {
  const colors = {
    technical: '#3b82f6',
    regulatory: '#8b5cf6',
    clinical: '#10b981',
    business: '#f59e0b',
    'soft-skill': '#ec4899',
  };
  return colors[category as keyof typeof colors] || '#6b7280';
}
