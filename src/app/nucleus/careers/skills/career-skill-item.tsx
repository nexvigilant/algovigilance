'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProficiencyBadge } from './utils';

interface CareerSkillItemProps {
  skillName: string;
  hasSkill: boolean;
  proficiencyLevel?: string;
}

export function CareerSkillItem({
  skillName,
  hasSkill,
  proficiencyLevel,
}: CareerSkillItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border-2 ${
        hasSkill
          ? 'border-green-500/30 bg-green-500/10'
          : 'border-yellow-500/30 bg-yellow-500/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasSkill ? (
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="h-3 w-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-yellow-500" />
          )}
          <span className="font-medium">{skillName}</span>
        </div>
        {hasSkill && proficiencyLevel && (
          <Badge className={getProficiencyBadge(proficiencyLevel)}>
            {proficiencyLevel}
          </Badge>
        )}
      </div>
      {!hasSkill && (
        <Button asChild size="sm" variant="outline" className="w-full mt-2">
          <Link href="/nucleus/academy">Learn This Skill</Link>
        </Button>
      )}
    </div>
  );
}
