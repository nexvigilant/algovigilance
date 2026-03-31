import { createMetadata } from '@/lib/metadata';
import {
  BookOpen,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartsSection } from './charts-section';
import { getDashboardKPIs, getTopLearners } from '@/lib/actions/system-stats';
import { getThreatEvents } from '@/lib/actions/threats';

export const metadata = createMetadata({
  title: 'Insights Dashboard',
  description: 'Real-time analytics and KPIs across Academy, Community, Guardian, and Careers services.',
  path: '/nucleus/insights',
});

const iconMap = {
  'Community Members': Users,
  'Academy Courses': BookOpen,
  'Guardian Signals Resolved': ShieldCheck,
  'Careers™ Active Roles': Briefcase,
};

export default async function InsightsPage() {
  // Fetch real data from Firestore
  const [kpis, topLearners, threats] = await Promise.all([
    getDashboardKPIs(),
    getTopLearners(3),
    getThreatEvents(3, false), // Get 3 most recent threats
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 space-y-golden-2 p-4 pt-6 md:p-8">
        <header className="mb-golden-3">
          <div className="flex items-center gap-golden-2 mb-golden-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
              <BarChart3 className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
                AlgoVigilance Analytics
              </p>
              <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Insights
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
            Real-time analytics and KPIs across Academy, Community, Guardian, and Careers
          </p>
        </header>

        <div className="grid gap-golden-2 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = iconMap[kpi.title as keyof typeof iconMap] || Users;
            const isLive = kpi.title === 'Guardian Signals Resolved';

            return (
              <Card key={kpi.title} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-light">{kpi.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${isLive ? 'text-cyan' : 'text-slate-dim'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-slate-dim">
                    {isLive && <span className="text-cyan mr-1 animate-pulse">•</span>}
                    {kpi.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ChartsSection />

        <div className="grid grid-cols-1 gap-golden-2 lg:grid-cols-2">
          <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-gold">Guardian Safety Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {threats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threats.map((threat) => {
                      const severityBadge = {
                        critical: <Badge variant="destructive">Critical</Badge>,
                        high: <Badge className="bg-orange-500 text-white">High</Badge>,
                        medium: <Badge className="bg-nex-gold-500 text-nex-dark">Medium</Badge>,
                        low: <Badge variant="secondary">Low</Badge>,
                      }[threat.severity];

                      return (
                        <TableRow key={threat.id}>
                          <TableCell className="font-medium">{threat.event}</TableCell>
                          <TableCell>{severityBadge}</TableCell>
                          <TableCell className="text-right">{threat.action}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-dim py-4 text-center">
                  No safety events detected. System monitoring active.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-gold">Academy Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-golden-2">
              {topLearners.length > 0 ? (
                topLearners.map((learner) => {
                  const initials = learner.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const rankDisplay =
                    learner.rank === 1 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-nex-gold-400 fill-nex-gold-400" /> 1st
                      </div>
                    ) : (
                      `${learner.rank}${learner.rank === 2 ? 'nd' : 'rd'}`
                    );

                  return (
                    <div key={learner.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={learner.avatar} alt={learner.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{learner.name}</p>
                        <p className="text-sm text-slate-dim">{learner.title}</p>
                      </div>
                      <div className="ml-auto font-medium">{rankDisplay}</div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-dim py-4 text-center">
                  No learners have completed courses yet. Be the first!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
