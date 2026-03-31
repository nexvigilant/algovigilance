'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, BookOpen, Trophy, Award, FileText } from 'lucide-react';

export function DashboardTabs() {
  return (
    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-nex-light rounded-none space-x-6 mb-8 overflow-x-auto flex-nowrap">
      <TabsTrigger
        value="dashboard"
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan data-[state=active]:text-cyan rounded-none px-0 py-3 text-slate-dim hover:text-slate-light transition-colors flex items-center gap-2"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </TabsTrigger>
      <TabsTrigger
        value="pathways"
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan data-[state=active]:text-cyan rounded-none px-0 py-3 text-slate-dim hover:text-slate-light transition-colors flex items-center gap-2"
      >
        <BookOpen className="h-4 w-4" />
        Pathways
      </TabsTrigger>
      <TabsTrigger
        value="tracker"
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan data-[state=active]:text-cyan rounded-none px-0 py-3 text-slate-dim hover:text-slate-light transition-colors flex items-center gap-2"
      >
        <Trophy className="h-4 w-4" />
        Capabilities Tracker
      </TabsTrigger>
      <TabsTrigger
        value="portfolio"
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan data-[state=active]:text-cyan rounded-none px-0 py-3 text-slate-dim hover:text-slate-light transition-colors flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Portfolio
      </TabsTrigger>
      <TabsTrigger
        value="assessments"
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan data-[state=active]:text-cyan rounded-none px-0 py-3 text-slate-dim hover:text-slate-light transition-colors flex items-center gap-2"
      >
        <Award className="h-4 w-4" />
        Assessments
      </TabsTrigger>
    </TabsList>
  );
}
