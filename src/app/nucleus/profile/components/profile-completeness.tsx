'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface ProfileCompletenessProps {
  profile: UserProfile | null;
}

/**
 * Calculate profile completeness based on weighted field values
 * Returns percentage (0-100) and breakdown of completed sections
 */
function calculateCompleteness(profile: UserProfile | null) {
  if (!profile) return { percentage: 0, sections: [] };

  const weights = {
    name: 5,                    // Required
    professionalTitle: 3,
    bio: 2,
    currentEmployer: 2,
    location: 2,
    yearsOfExperience: 2,
    linkedInProfile: 1,
    education: 5,               // At least 1 entry
    credentials: 5,             // At least 1 entry
    organizationAffiliations: 2,
    specializations: 3,
  };

  let totalPoints = 0;
  const maxPoints = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const sections = [
    {
      name: 'Basic Information',
      fields: ['name', 'location'],
      completed: 0,
      total: 2,
      suggestions: [] as string[],
    },
    {
      name: 'Professional Profile',
      fields: ['professionalTitle', 'bio', 'currentEmployer', 'yearsOfExperience', 'linkedInProfile', 'specializations'],
      completed: 0,
      total: 6,
      suggestions: [] as string[],
    },
    {
      name: 'Education',
      fields: ['education'],
      completed: 0,
      total: 1,
      suggestions: [] as string[],
    },
    {
      name: 'Credentials',
      fields: ['credentials'],
      completed: 0,
      total: 1,
      suggestions: [] as string[],
    },
    {
      name: 'Affiliations',
      fields: ['organizationAffiliations'],
      completed: 0,
      total: 1,
      suggestions: [] as string[],
    },
  ];

  // Calculate points for each field
  if (profile.name) {
    totalPoints += weights.name;
    sections[0].completed++;
  }

  if (profile.location) {
    totalPoints += weights.location;
    sections[0].completed++;
  } else {
    sections[0].suggestions.push('Add your location');
  }

  if (profile.professionalTitle) {
    totalPoints += weights.professionalTitle;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Add your professional title');
  }

  if (profile.bio) {
    totalPoints += weights.bio;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Write a professional bio');
  }

  if (profile.currentEmployer) {
    totalPoints += weights.currentEmployer;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Add your current employer');
  }

  if (profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null) {
    totalPoints += weights.yearsOfExperience;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Add years of experience');
  }

  if (profile.linkedInProfile) {
    totalPoints += weights.linkedInProfile;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Connect your LinkedIn profile');
  }

  if (profile.specializations && profile.specializations.length > 0) {
    totalPoints += weights.specializations;
    sections[1].completed++;
  } else {
    sections[1].suggestions.push('Add your specializations');
  }

  if (profile.education && profile.education.length > 0) {
    totalPoints += weights.education;
    sections[2].completed++;
  } else {
    sections[2].suggestions.push('Add your education history');
  }

  if (profile.credentials && profile.credentials.length > 0) {
    totalPoints += weights.credentials;
    sections[3].completed++;
  } else {
    sections[3].suggestions.push('Add professional credentials');
  }

  if (profile.organizationAffiliations && profile.organizationAffiliations.length > 0) {
    totalPoints += weights.organizationAffiliations;
    sections[4].completed++;
  } else {
    sections[4].suggestions.push('Add organization affiliations');
  }

  const percentage = Math.round((totalPoints / maxPoints) * 100);

  return { percentage, sections };
}

export function ProfileCompleteness({ profile }: ProfileCompletenessProps) {
  const { percentage, sections } = calculateCompleteness(profile);

  return (
    <Card className="border-cyan/30 bg-nex-dark">
      <CardHeader>
        <CardTitle className="text-cyan-soft">Profile Completeness</CardTitle>
        <CardDescription>
          Complete your profile to unlock full platform features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-cyan-glow font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3 bg-nex-light" />
        </div>

        {/* Section Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-cyan-soft">Section Status</h4>
          {sections.map((section) => (
            <div key={section.name} className="flex items-start gap-3">
              {section.completed === section.total ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {section.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {section.completed}/{section.total}
                  </span>
                </div>
                {section.suggestions.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.suggestions[0]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Benefits (if not 100% complete) */}
        {percentage < 100 && (
          <div className="pt-4 border-t border-cyan/20">
            <h4 className="text-sm font-medium text-cyan-soft mb-2">
              Complete your profile to unlock:
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Enhanced visibility in member directory</li>
              <li>• Priority for job opportunities</li>
              <li>• Full Academy certificate display</li>
              <li>• Verified professional badge</li>
            </ul>
          </div>
        )}

        {/* Celebration for 100% */}
        {percentage === 100 && (
          <div className="pt-4 border-t border-cyan/20 text-center">
            <p className="text-sm font-medium text-green-400">
              🎉 Your profile is complete! Great job!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
