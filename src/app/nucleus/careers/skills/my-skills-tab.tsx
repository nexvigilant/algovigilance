'use client';

import { SkillCard } from './skill-card';

interface UserSkill {
  skillId: string;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  progress: number;
  coursesCompleted: number;
  lastUpdated: Date;
}

interface MySkillsTabProps {
  skills: UserSkill[];
}

export function MySkillsTab({ skills }: MySkillsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {skills.map((skill) => (
        <SkillCard key={skill.skillId} {...skill} />
      ))}
    </div>
  );
}
