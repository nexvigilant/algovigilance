import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  BarChart3,
  Users,
  Sparkles,
  Zap,
  Search,
  Network,
  Briefcase,
  Layers,
  Shuffle,
  ClipboardCheck,
  Heart
} from 'lucide-react';

export const metadata = createMetadata({
  title: 'Assessments',
  description: 'Evaluate your pharmacovigilance competencies with interactive assessments. Test your skills in signal detection, competency frameworks, and career development.',
  path: '/nucleus/careers/assessments',
});

interface Assessment {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  level: string;
  domains: string[];
  isNew?: boolean;
  isPremium?: boolean;
}

const assessments: Assessment[] = [
  {
    id: 'signal-decision-framework',
    title: '5 C\'s Signal Decision Framework',
    description: 'Master pharmacovigilance signal evaluation using structured decision-making. Practice with real-world scenarios covering disproportionality analysis, clinical context, and regulatory decisions.',
    href: '/nucleus/careers/assessments/signal-decision-framework',
    icon: Target,
    duration: '15-25 min',
    level: 'L3-L4',
    domains: ['Signal Detection', 'Risk Assessment', 'Decision Making'],
    isNew: true,
  },
  {
    id: 'value-proposition-builder',
    title: 'NECS Value Proposition Builder',
    description: 'Build your professional value proposition using the NECS framework. Transform task-based descriptions into outcome-focused statements for LinkedIn, applications, and introductions.',
    href: '/nucleus/careers/assessments/value-proposition-builder',
    icon: Zap,
    duration: '20-30 min',
    level: 'All Levels',
    domains: ['Career Development', 'Professional Branding'],
    isNew: true,
  },
  {
    id: 'interview-preparation',
    title: 'Interview Preparation & Due Diligence',
    description: 'Prepare for PV interviews and advisory conversations with structured company research. Research the ecosystem, company, and sector to demonstrate preparation and enable better conversations.',
    href: '/nucleus/careers/assessments/interview-preparation',
    icon: Search,
    duration: '30-60 min',
    level: 'All Levels',
    domains: ['Career Development', 'Due Diligence', 'Interview Prep'],
    isNew: true,
  },
  {
    id: 'hidden-job-market',
    title: 'Hidden Job Market Navigator',
    description: 'Access unadvertised PV opportunities through strategic network mapping, visibility building, and relationship development. Create your personalized action plan.',
    href: '/nucleus/careers/assessments/hidden-job-market',
    icon: Network,
    duration: '30-45 min',
    level: 'All Levels',
    domains: ['Career Development', 'Networking', 'Professional Growth'],
    isNew: true,
  },
  {
    id: 'advisory-readiness',
    title: 'Board Advisory Readiness Assessment',
    description: 'Evaluate your readiness for advisory board and consulting roles. Assess your value proposition, experience, network strength, and practical readiness across four key dimensions.',
    href: '/nucleus/careers/assessments/advisory-readiness',
    icon: Briefcase,
    duration: '15-20 min',
    level: 'L4+',
    domains: ['Career Development', 'Advisory', 'Board Positions'],
    isNew: true,
  },
  {
    id: 'board-competencies',
    title: '9 Board Advisor Competencies',
    description: 'Deep self-evaluation across the 9 core competencies for board advisory roles: Strategic Thinking, Industry Expertise, Governance, Network Value, Communication, Mentoring, Financial Acumen, Risk Assessment, and Cultural Intelligence.',
    href: '/nucleus/careers/assessments/board-competencies',
    icon: Layers,
    duration: '20-30 min',
    level: 'L4+',
    domains: ['Career Development', 'Advisory', 'Competency Assessment'],
    isNew: true,
  },
  {
    id: 'change-readiness',
    title: 'Change Readiness Assessment',
    description: 'Evaluate your readiness to transition from traditional employment to a portfolio career. Assess 15 key indicators across financial, network, emotional, and practical dimensions.',
    href: '/nucleus/careers/assessments/change-readiness',
    icon: Shuffle,
    duration: '15-20 min',
    level: 'All Levels',
    domains: ['Career Development', 'Transition Planning', 'Self-Assessment'],
    isNew: true,
  },
  {
    id: 'startup-health',
    title: 'Startup Health Checklist',
    description: 'Evaluate startup advisory opportunities with a comprehensive 10-area due diligence framework. Assess team, product, market, financials, governance, and fit using Red/Yellow/Green scoring.',
    href: '/nucleus/careers/assessments/startup-health',
    icon: ClipboardCheck,
    duration: '30-45 min',
    level: 'L4+',
    domains: ['Advisory', 'Due Diligence', 'Startup Evaluation'],
    isNew: true,
  },
  {
    id: 'mentoring-framework',
    title: "5 C's Mentoring Framework",
    description: "Evaluate and enhance your mentoring effectiveness using the 5 C's: Clarity, Connection, Challenge, Commitment, and Capability. Build stronger mentoring relationships with actionable insights.",
    href: '/nucleus/careers/assessments/mentoring-framework',
    icon: Heart,
    duration: '15-20 min',
    level: 'All Levels',
    domains: ['Mentoring', 'Leadership', 'Professional Development'],
    isNew: true,
  },
  {
    id: 'competency-assessment',
    title: 'PV Competency Self-Assessment',
    description: 'Evaluate your current proficiency level across all 15 pharmacovigilance domains. Identify strengths and areas for development.',
    href: '/nucleus/careers/assessments/competency-assessment',
    icon: BarChart3,
    duration: '20-30 min',
    level: 'All Levels',
    domains: ['All 15 PV Domains'],
  },
  {
    id: 'fellowship-evaluator',
    title: 'Fellowship Readiness Evaluator',
    description: 'Assess your readiness for advanced PV fellowship programs. Benchmark your capabilities against fellowship entry requirements.',
    href: '/nucleus/careers/assessments/fellowship-evaluator',
    icon: Award,
    duration: '25-35 min',
    level: 'L4-L5',
    domains: ['Career Development', 'Advanced Practice'],
  },
  {
    id: 'maturity-model',
    title: 'PV System Maturity Model',
    description: 'Evaluate organizational pharmacovigilance maturity. Assess systems, processes, and capabilities against industry benchmarks.',
    href: '/nucleus/careers/assessments/maturity-model',
    icon: TrendingUp,
    duration: '30-45 min',
    level: 'L4+',
    domains: ['Quality Systems', 'Organizational Assessment'],
  },
];

export default function AssessmentsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 md:px-6">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-cyan/10 rounded-xl">
            <Target className="h-8 w-8 text-cyan" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-gold">
              Capability Assessments
            </h1>
            <p className="text-muted-foreground">
              Evaluate and validate your pharmacovigilance competencies
            </p>
          </div>
        </div>
      </header>

      {/* Info Card */}
      <Card className="mb-8 bg-gradient-to-br from-cyan/5 to-purple-500/5 border-cyan/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-cyan mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Structured Capability Evaluation
              </h3>
              <p className="text-sm text-muted-foreground">
                Our assessments are aligned with the PDC (Professional Development Curriculum) framework
                and map to specific EPAs (Entrustable Professional Activities) and CPAs (Critical Practice Activities).
                Complete assessments to identify learning gaps and track your professional development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {assessments.map((assessment) => {
          const Icon = assessment.icon;

          return (
            <Card
              key={assessment.id}
              className="group bg-nex-surface border-nex-border hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-cyan/10 rounded-lg group-hover:bg-cyan/20 transition-colors">
                    <Icon className="h-5 w-5 text-cyan" />
                  </div>
                  <div className="flex gap-2">
                    {assessment.isNew && (
                      <Badge className="bg-green-500 text-white">New</Badge>
                    )}
                    {assessment.isPremium && (
                      <Badge className="bg-gold text-nex-deep">Premium</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg text-foreground group-hover:text-cyan transition-colors">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {assessment.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{assessment.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{assessment.level}</span>
                  </div>
                </div>

                {/* Domains */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {assessment.domains.map((domain) => (
                    <Badge key={domain} variant="outline" className="text-xs">
                      {domain}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <Button asChild className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
                  <Link href={assessment.href}>
                    Start Assessment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground">
          Assessments contribute to your capability profile and portfolio.
          Results are saved for tracking your professional development over time.
        </p>
      </div>
    </div>
  );
}
