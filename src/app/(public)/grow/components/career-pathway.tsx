'use client';

import { GraduationCap, Briefcase, Users, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const pathwayStages = [
  {
    id: 'ambassador',
    title: 'Ambassador',
    subtitle: '0-2 Years',
    description: 'Build your network, develop skills, and create your professional portfolio.',
    icon: GraduationCap,
    color: 'cyan',
    activities: ['Networking events', 'Skill workshops', 'Portfolio projects', 'Mentee matching'],
  },
  {
    id: 'advisor',
    title: 'Advisor',
    subtitle: '2+ Years FTE',
    description: 'Share expertise, review curriculum, mentor others, and explore advisory engagements.',
    icon: Briefcase,
    color: 'cyan',
    activities: ['Content review', 'Mentorship', 'Advisory roles', 'Speaking opportunities'],
  },
  {
    id: 'consultant',
    title: 'Consultant',
    subtitle: '5+ Years',
    description: 'Execute client projects, deliver training, and build your consulting practice.',
    icon: Users,
    color: 'gold',
    activities: ['Client engagements', 'Training delivery', 'Project execution', 'Revenue sharing'],
  },
  {
    id: 'executive',
    title: 'Fractional Executive',
    subtitle: '10+ Years',
    description: 'Lead strategic initiatives, participate in governance, and shape industry direction.',
    icon: Crown,
    color: 'gold',
    activities: ['Board participation', 'Strategic direction', 'Leadership roles', 'Equity opportunities'],
  },
];

export function CareerPathway() {
  return (
    <div className="relative">
      {/* Desktop: Horizontal layout */}
      <div className="hidden lg:block">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan via-gold to-gold -translate-y-1/2 z-0" />

        <div className="grid grid-cols-4 gap-4 relative z-10">
          {pathwayStages.map((stage, index) => (
            <div key={stage.id} className="relative">
              {/* Arrow between stages */}
              {index < pathwayStages.length - 1 && (
                <ArrowRight className="absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-dim z-20" />
              )}

              <div className={cn(
                "bg-nex-surface/90 backdrop-blur-sm rounded-xl p-6 border transition-all hover:-translate-y-1",
                stage.color === 'gold' ? "border-gold/30 hover:border-gold/50" : "border-cyan/30 hover:border-cyan/50"
              )}>
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border",
                  stage.color === 'gold'
                    ? "bg-gold/20 border-gold/50"
                    : "bg-cyan/20 border-cyan/50"
                )}>
                  <stage.icon className={cn(
                    "h-7 w-7",
                    stage.color === 'gold' ? "text-gold" : "text-cyan"
                  )} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white text-center mb-1">
                  {stage.title}
                </h3>
                <p className={cn(
                  "text-sm font-medium text-center mb-3",
                  stage.color === 'gold' ? "text-gold/80" : "text-cyan/80"
                )}>
                  {stage.subtitle}
                </p>

                {/* Description */}
                <p className="text-sm text-slate-dim text-center mb-4">
                  {stage.description}
                </p>

                {/* Activities */}
                <div className="space-y-1">
                  {stage.activities.map((activity) => (
                    <div
                      key={activity}
                      className={cn(
                        "text-xs px-2 py-1 rounded text-center",
                        stage.color === 'gold'
                          ? "bg-gold/10 text-gold/70"
                          : "bg-cyan/10 text-cyan/70"
                      )}
                    >
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet: Vertical layout */}
      <div className="lg:hidden space-y-4">
        {pathwayStages.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Connecting line */}
            {index < pathwayStages.length - 1 && (
              <div className={cn(
                "absolute left-7 top-full w-0.5 h-4 z-0",
                stage.color === 'gold' ? "bg-gold/50" : "bg-cyan/50"
              )} />
            )}

            <div className={cn(
              "flex gap-4 bg-nex-surface/90 backdrop-blur-sm rounded-xl p-4 border",
              stage.color === 'gold' ? "border-gold/30" : "border-cyan/30"
            )}>
              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shrink-0 border",
                stage.color === 'gold'
                  ? "bg-gold/20 border-gold/50"
                  : "bg-cyan/20 border-cyan/50"
              )}>
                <stage.icon className={cn(
                  "h-7 w-7",
                  stage.color === 'gold' ? "text-gold" : "text-cyan"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">
                    {stage.title}
                  </h3>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    stage.color === 'gold'
                      ? "bg-gold/20 text-gold"
                      : "bg-cyan/20 text-cyan"
                  )}>
                    {stage.subtitle}
                  </span>
                </div>
                <p className="text-sm text-slate-dim mb-2">
                  {stage.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {stage.activities.map((activity) => (
                    <span
                      key={activity}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        stage.color === 'gold'
                          ? "bg-gold/10 text-gold/70"
                          : "bg-cyan/10 text-cyan/70"
                      )}
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
