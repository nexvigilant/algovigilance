'use client';

import { Edit, Trash2, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Skill } from '@/types/academy';

const CATEGORY_COLORS: Record<Skill['category'], string> = {
  technical: 'bg-blue-500/20 text-blue-500',
  regulatory: 'bg-purple-500/20 text-purple-500',
  clinical: 'bg-green-500/20 text-green-500',
  business: 'bg-yellow-500/20 text-yellow-500',
  'soft-skill': 'bg-pink-500/20 text-pink-500',
};

interface SkillCardProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
}

export function SkillCard({ skill, onEdit, onDelete }: SkillCardProps) {
  return (
    <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-slate-light">{skill.name}</CardTitle>
            <CardDescription className="mt-1 text-slate-dim">
              {skill.description}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(skill)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(skill.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[skill.category]}>{skill.category}</Badge>
            {skill.industryStandard && (
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Industry Standard
              </Badge>
            )}
          </div>

          {skill.associatedRoles && skill.associatedRoles.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-dim mb-1">Associated Roles:</p>
              <div className="flex flex-wrap gap-1">
                {skill.associatedRoles.slice(0, 2).map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {skill.associatedRoles.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{skill.associatedRoles.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
