'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Brain, Wrench, Sparkles, ArrowRight } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { getPVDomains } from './actions';
import type { PVDomain } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('pv-domains/page');

export default function PVDomainsPage() {
  const [domains, setDomains] = useState<PVDomain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<PVDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredDomains(
        domains.filter(
          d =>
            d.name.toLowerCase().includes(query) ||
            d.id.toLowerCase().includes(query) ||
            d.definition.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredDomains(domains);
    }
  }, [searchQuery, domains]);

  async function loadDomains() {
    try {
      setLoading(true);
      const data = await getPVDomains();
      setDomains(data);
      setFilteredDomains(data);
    } catch (err) {
      setError('Failed to load PV domains');
      log.error('Failed to load PV domains', err instanceof Error ? { error: err.message } : { error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <VoiceLoading context="admin" variant="fullpage" />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadDomains} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalKSBs = domains.reduce((sum, d) => sum + d.totalKSBs, 0);
  const totalKnowledge = domains.reduce((sum, d) => sum + d.stats.knowledge, 0);
  const totalSkills = domains.reduce((sum, d) => sum + d.stats.skills, 0);
  const totalBehaviors = domains.reduce((sum, d) => sum + d.stats.behaviors, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">PV Competency Domains</h1>
        <p className="text-slate-dim">
          Browse the 15 pharmacovigilance domains and their capability components
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{domains.length}</div>
            <div className="text-xs text-slate-dim">Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalKSBs.toLocaleString()}</div>
            <div className="text-xs text-slate-dim">Total KSBs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totalKnowledge}</div>
            <div className="text-xs text-slate-dim">Knowledge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalSkills}</div>
            <div className="text-xs text-slate-dim">Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{totalBehaviors}</div>
            <div className="text-xs text-slate-dim">Behaviors</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
        <Input
          placeholder="Search domains by name or ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {filteredDomains.map(domain => (
          <Card key={domain.id} className="group bg-nex-surface border border-nex-light rounded-lg hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="font-mono">
                  {domain.id}
                </Badge>
                <Badge variant="secondary">{domain.totalKSBs} KSBs</Badge>
              </div>
              <CardTitle className="text-lg text-slate-light">{domain.name}</CardTitle>
              <CardDescription className="line-clamp-2 group-hover:line-clamp-none transition-all duration-300 text-slate-dim">
                {domain.definition}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <Brain className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-semibold">{domain.stats.knowledge}</div>
                  <div className="text-[10px] text-slate-dim">K</div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                  <Wrench className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-semibold">{domain.stats.skills}</div>
                  <div className="text-[10px] text-slate-dim">S</div>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded">
                  <BookOpen className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  <div className="text-sm font-semibold">{domain.stats.behaviors}</div>
                  <div className="text-[10px] text-slate-dim">B</div>
                </div>
                <div className="text-center p-2 bg-amber-50 dark:bg-amber-950 rounded">
                  <Sparkles className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                  <div className="text-sm font-semibold">{domain.stats.aiIntegration}</div>
                  <div className="text-[10px] text-slate-dim">AI</div>
                </div>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full">
                <Link href={`/nucleus/admin/academy/pv-domains/${domain.id}`}>
                  View Domain
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-dim">No domains found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
