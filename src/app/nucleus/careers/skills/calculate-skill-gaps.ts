/**
 * Skills Gap Calculation Algorithm
 * Calculates skill gaps between user's current skills and career path requirements
 * Matches relevant courses to each skill gap
 *
 * Part of B008 fix - replaces hardcoded mock data
 */

export interface UserSkill {
  skillId: string;
  skillName: string;
  category: 'regulatory' | 'clinical' | 'technical' | 'soft-skill' | 'quality';
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  progress: number;
  coursesCompleted: number;
  lastUpdated: Date;
}

export interface CareerPath {
  id: string;
  title: string;
  requiredSkills: string[];
  requiredLevels?: Record<string, ProficiencyLevel>;
  matchPercentage: number;
  avgSalary: string;
  demand: string;
}

export interface Course {
  id: string;
  title: string;
  topic: string;
  skills?: string[]; // Skills taught by this course
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: string;
  visibility?: string;
}

export interface SkillGap {
  skillName: string;
  category: string;
  requiredLevel: ProficiencyLevel;
  currentLevel?: ProficiencyLevel;
  gap: number; // 0-100%
  recommendedCourses: string[]; // Course titles
}

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Calculate skill gaps for a user based on selected career path
 */
export function calculateSkillGaps(
  userSkills: UserSkill[],
  careerPath: CareerPath,
  availableCourses: Course[]
): SkillGap[] {
  const gaps: SkillGap[] = [];

  for (const requiredSkill of careerPath.requiredSkills) {
    // Find user's current level for this skill
    const userSkill = userSkills.find(s => s.skillName === requiredSkill);
    const currentLevel = userSkill?.proficiencyLevel;
    const requiredLevel = careerPath.requiredLevels?.[requiredSkill] || 'advanced';

    // Calculate gap percentage
    const gap = calculateGapPercentage(currentLevel, requiredLevel);

    // Find relevant courses for this skill
    const recommendedCourses = findRelevantCourses(
      requiredSkill,
      currentLevel,
      requiredLevel,
      availableCourses
    );

    // Infer category from skill name or user's existing skill data
    const category = userSkill?.category || inferCategory(requiredSkill);

    gaps.push({
      skillName: requiredSkill,
      category,
      requiredLevel: requiredLevel as ProficiencyLevel,
      currentLevel: currentLevel,
      gap,
      recommendedCourses: recommendedCourses.map(c => c.title),
    });
  }

  // Sort by gap size (highest gaps first = most critical)
  return gaps.sort((a, b) => b.gap - a.gap);
}

/**
 * Calculate percentage gap between current and required proficiency level
 */
function calculateGapPercentage(
  current: ProficiencyLevel | undefined,
  required: ProficiencyLevel
): number {
  const levels: Record<ProficiencyLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };

  const currentScore = current ? levels[current] : 0;
  const requiredScore = levels[required];

  // Gap = (required - current) / required * 100
  const gap = ((requiredScore - currentScore) / requiredScore) * 100;

  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(gap)));
}

/**
 * Find courses relevant to a skill gap
 * Prioritizes courses that match the user's current level
 */
function findRelevantCourses(
  skillName: string,
  currentLevel: ProficiencyLevel | undefined,
  requiredLevel: ProficiencyLevel,
  courses: Course[]
): Course[] {
  // Normalize skill name for matching
  const normalizedSkill = skillName.toLowerCase().trim();

  // Filter courses that teach this skill
  const relevantCourses = courses.filter(course => {
    // Check if course has skills metadata
    if (course.skills && course.skills.length > 0) {
      // Direct skill match
      const hasSkill = course.skills.some(s =>
        s.toLowerCase().includes(normalizedSkill) ||
        normalizedSkill.includes(s.toLowerCase())
      );
      if (hasSkill) return true;
    }

    // Fallback: Check title and topic
    const title = course.title?.toLowerCase() || '';
    const topic = course.topic?.toLowerCase() || '';

    return title.includes(normalizedSkill) || topic.includes(normalizedSkill);
  });

  if (relevantCourses.length === 0) {
    return [];
  }

  // Determine target difficulty based on user's current level
  let targetDifficulty: 'beginner' | 'intermediate' | 'advanced';

  if (!currentLevel || currentLevel === 'beginner') {
    // User is beginner or has no experience - start with beginner courses
    targetDifficulty = 'beginner';
  } else if (currentLevel === 'intermediate') {
    // User is intermediate - recommend intermediate/advanced courses
    targetDifficulty = 'intermediate';
  } else {
    // User is advanced/expert - recommend advanced courses
    targetDifficulty = 'advanced';
  }

  // Score each course based on difficulty match
  const scoredCourses = relevantCourses.map(course => {
    let score = 0;

    // Primary scoring: difficulty match
    if (course.difficulty === targetDifficulty) {
      score += 10;
    } else if (course.difficulty) {
      // Prefer courses slightly above current level
      const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
      const targetIndex = difficultyOrder.indexOf(targetDifficulty);
      const courseIndex = difficultyOrder.indexOf(course.difficulty);

      if (courseIndex === targetIndex + 1) {
        score += 7; // Next level up
      } else if (courseIndex === targetIndex - 1) {
        score += 5; // One level below
      } else {
        score += 2; // Other levels
      }
    }

    // Secondary scoring: exact skill name match in title
    if (course.title.toLowerCase().includes(normalizedSkill)) {
      score += 5;
    }

    // Tertiary scoring: skill in skills array
    if (course.skills?.some(s => s.toLowerCase() === normalizedSkill)) {
      score += 3;
    }

    return { course, score };
  });

  // Sort by score (highest first)
  scoredCourses.sort((a, b) => b.score - a.score);

  // Return top 3 courses
  return scoredCourses.slice(0, 3).map(item => item.course);
}

/**
 * Infer category from skill name
 * Used when user doesn't have this skill in their profile yet
 */
function inferCategory(skillName: string): string {
  const categoryMap: Record<string, string> = {
    // Regulatory
    'Pharmacovigilance': 'regulatory',
    'Good Clinical Practice (GCP)': 'regulatory',
    'GCP': 'regulatory',
    'Regulatory Affairs': 'regulatory',
    'FDA Compliance': 'regulatory',
    'Drug Safety': 'regulatory',
    'Risk Management': 'regulatory',

    // Clinical
    'Clinical Trial Design': 'clinical',
    'Medical Writing': 'clinical',
    'Clinical Research': 'clinical',
    'Protocol Development': 'clinical',
    'Drug Development Process': 'clinical',

    // Technical
    'Data Management': 'technical',
    'Statistical Analysis': 'technical',
    'Biostatistics': 'technical',
    'Clinical Data Systems': 'technical',
    'Database Management': 'technical',

    // Soft Skills
    'Stakeholder Communication': 'soft-skill',
    'Project Management': 'soft-skill',
    'Leadership': 'soft-skill',
    'Team Collaboration': 'soft-skill',

    // Quality
    'Quality Assurance': 'quality',
    'Compliance': 'quality',
    'Audit Preparation': 'quality',
  };

  // Check for exact match
  if (categoryMap[skillName]) {
    return categoryMap[skillName];
  }

  // Check for partial match (case-insensitive)
  const lowerSkill = skillName.toLowerCase();
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lowerSkill.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerSkill)) {
      return category;
    }
  }

  // Default to 'general' if no match
  return 'general';
}
