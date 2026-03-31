'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Course } from '@/types/academy';
import { CourseCard } from './course-card';

interface RecommendedCoursesProps {
  courses: Course[];
  className?: string;
}

export function RecommendedCourses({ courses, className = '' }: RecommendedCoursesProps) {
  return (
    <div className={`relative space-y-6 p-8 rounded-2xl overflow-hidden ${className}`}>
      {/* Polished background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-nex-deep via-nex-dark/95 to-nex-deep" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.05),transparent_50%)]" />
      <div className="absolute inset-0 border border-nex-light/20 rounded-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-light">Recommended for You</h2>
          <Button
            variant="outline"
            asChild
            className="border-cyan/50 text-cyan hover:text-cyan-glow hover:border-cyan hover:bg-cyan/10 transition-all shadow-[0_0_15px_rgba(0,174,239,0.2)] hover:shadow-[0_0_20px_rgba(0,174,239,0.3)]"
          >
            <Link href="/nucleus/academy/pathways">Explore Pathways</Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          /* Empty State with polished cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group relative bg-nex-surface/50 backdrop-blur-sm border border-nex-light/30 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-cyan/40 transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan/20 to-nex-light/10 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,174,239,0.15)] group-hover:shadow-[0_0_25px_rgba(0,174,239,0.25)] transition-all">
                    <span className="text-2xl">📚</span>
                  </div>
                  <p className="text-sm text-slate-dim group-hover:text-slate-light transition-colors">
                    {i === 1 ? 'New pathways coming soon' : i === 2 ? 'Tailored to your goals' : 'Based on your progress'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
        /* Carousel */
        <Carousel
          opts={{
            align: 'start',
            loop: courses.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {courses.map((course) => (
              <CarouselItem
                key={course.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <CourseCard course={course} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows */}
          {courses.length > 3 && (
            <>
              <CarouselPrevious className="-left-4 bg-nex-surface border-nex-light hover:bg-nex-light hover:border-cyan/50 text-slate-dim hover:text-cyan" />
              <CarouselNext className="-right-4 bg-nex-surface border-nex-light hover:bg-nex-light hover:border-cyan/50 text-slate-dim hover:text-cyan" />
            </>
          )}
        </Carousel>
        )}
      </div>
    </div>
  );
}
