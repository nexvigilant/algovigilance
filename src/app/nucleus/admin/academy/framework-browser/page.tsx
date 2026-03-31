'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Target,
  Award,
  Star,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Brain,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getDomainsAction, getEPAsAction, getCPAsAction } from './actions';
import type { PDCDomain, PDCEPA, PDCCPA } from './actions';
import { CPACard } from './components/cpa-card';

import { logger } from '@/lib/logger';
const log = logger.scope('framework-browser/page');

export default function FrameworkBrowserPage() {
  const [domains, setDomains] = useState<PDCDomain[]>([]);
  const [epas, setEPAs] = useState<PDCEPA[]>([]);
  const [cpas, setCPAs] = useState<PDCCPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [domainsData, epasData, cpasData] = await Promise.all([
          getDomainsAction(),
          getEPAsAction(),
          getCPAsAction(),
        ]);

        setDomains(domainsData);
        setEPAs(epasData);
        setCPAs(cpasData);
      } catch (error) {
        log.error('Error loading framework data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter functions
  const filteredDomains = domains.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEPAs = epas.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCPAs = cpas.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.focusArea?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group domains by cluster
  const domainsByCluster = filteredDomains.reduce((acc, domain) => {
    const clusterId = domain.cluster?.id || 'unknown';
    if (!acc[clusterId]) acc[clusterId] = [];
    acc[clusterId].push(domain);
    return acc;
  }, {} as Record<string, PDCDomain[]>);

  // Group EPAs by tier
  const coreEPAs = filteredEPAs.filter((e) => e.tier === 'Core');
  const executiveEPAs = filteredEPAs.filter((e) => e.tier === 'Executive');
  const advancedEPAs = filteredEPAs.filter((e) => e.tier === 'Advanced');

  // Group CPAs by category
  const coreCPAs = filteredCPAs.filter((c) => c.category === 'Core');
  const advancedCPAsFiltered = filteredCPAs.filter((c) => c.category === 'Advanced');
  const capstoneCPAs = filteredCPAs.filter((c) => c.category === 'Capstone');

  // Get cluster display info
  const clusterInfo: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    foundational: { name: 'Foundational Sciences', icon: Brain, color: 'bg-blue-500/20 text-blue-500' },
    operational: { name: 'Operational Excellence', icon: TrendingUp, color: 'bg-green-500/20 text-green-500' },
    strategic: { name: 'Strategic Leadership', icon: Target, color: 'bg-purple-500/20 text-purple-500' },
    integration: { name: 'Integration & AI', icon: Users, color: 'bg-orange-500/20 text-orange-500' },
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-dim">Loading PDC Framework v4.1...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">PDC Framework Browser</h1>
        <p className="text-slate-dim">
          Professional Development Continuum v4.1 for Pharmacovigilance
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-cyan" />
              <div className="text-2xl font-bold">{domains.length}</div>
            </div>
            <p className="text-sm text-slate-dim">Competency Domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-cyan" />
              <div className="text-2xl font-bold">{epas.length}</div>
            </div>
            <p className="text-sm text-slate-dim">
              EPAs ({coreEPAs.length} Core, {executiveEPAs.length} Executive, {advancedEPAs.length} Advanced)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-gold" />
              <div className="text-2xl font-bold">{cpas.length}</div>
            </div>
            <p className="text-sm text-slate-dim">Career Practice Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-dim" />
          <Input
            type="text"
            placeholder="Search framework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="domains">
            Domains ({filteredDomains.length})
          </TabsTrigger>
          <TabsTrigger value="epas">
            EPAs ({filteredEPAs.length})
          </TabsTrigger>
          <TabsTrigger value="cpas">
            CPAs ({filteredCPAs.length})
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-6 mt-6">
          {Object.entries(clusterInfo).map(([cluster, info]) => {
            const clusterDomains = domainsByCluster[cluster] || [];
            if (clusterDomains.length === 0) return null;

            const Icon = info.icon;

            return (
              <div key={cluster}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">{info.name}</h2>
                  <Badge variant="outline">{clusterDomains.length}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clusterDomains.map((domain) => (
                    <Card key={domain.id} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-slate-light">{domain.id}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2 text-slate-dim">
                              {domain.shortName || domain.name}
                            </CardDescription>
                          </div>
                          <Badge className={info.color}>{domain.cluster?.name || cluster}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-dim mb-4 line-clamp-3">
                          {domain.description}
                        </p>

                        <div className="space-y-3">
                          {/* DAG Info */}
                          <div className="flex items-center gap-2 text-xs text-slate-dim">
                            <Layers className="h-3 w-3" />
                            <span>Layer {domain.dag?.layer}</span>
                            {domain.dag?.isCriticalPath && (
                              <Badge variant="secondary" className="text-xs bg-gold/20 text-gold">
                                Critical Path
                              </Badge>
                            )}
                          </div>

                          {/* Prerequisites & Unlocks */}
                          {domain.dag?.prerequisites?.length > 0 && (
                            <div className="text-xs text-slate-dim">
                              <span className="font-medium">Requires: </span>
                              {domain.dag.prerequisites.join(', ')}
                            </div>
                          )}

                          {domain.dag?.unlocks?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-cyan">
                              <ArrowRight className="h-3 w-3" />
                              <span>Unlocks: {domain.dag.unlocks.join(', ')}</span>
                            </div>
                          )}

                          {/* Core Knowledge Preview */}
                          {domain.coreKnowledge?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-dim mb-1">
                                Core Knowledge:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {domain.coreKnowledge.slice(0, 2).map((k, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {k.component.length > 30 ? k.component.slice(0, 30) + '...' : k.component}
                                  </Badge>
                                ))}
                                {domain.coreKnowledge.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{domain.coreKnowledge.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* EPAs Tab */}
        <TabsContent value="epas" className="space-y-6 mt-6">
          {/* Core EPAs */}
          {coreEPAs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Core EPAs</h2>
                <Badge variant="outline">{coreEPAs.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreEPAs.map((epa) => (
                  <Card key={epa.id} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg text-slate-light">{epa.id}</CardTitle>
                            {epa.aiGateway?.isGateway && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-500">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Gateway
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1 text-slate-dim">
                            {epa.shortName || epa.name}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-500">Core</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-dim mb-4 line-clamp-3">
                        {epa.definition}
                      </p>

                      <div className="space-y-2">
                        {/* DAG Layer */}
                        <div className="flex items-center gap-2 text-xs text-slate-dim">
                          <Layers className="h-3 w-3" />
                          <span>Layer {epa.dag?.primaryLayer}</span>
                        </div>

                        {/* Required Domains */}
                        {epa.dag?.requiredDomains?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-dim mb-1">
                              Required Domains:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {epa.dag.requiredDomains.slice(0, 4).map((d) => (
                                <Badge key={d.domainId} variant="outline" className="text-xs">
                                  {d.domainId} (L{d.minimumLevel})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Executive EPAs */}
          {executiveEPAs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Executive EPAs</h2>
                <Badge variant="outline">{executiveEPAs.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executiveEPAs.map((epa) => (
                  <Card key={epa.id} className="bg-nex-surface border border-nex-light hover:border-purple-500/50 transition-all duration-300 border-purple-500/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-slate-light">{epa.id}</CardTitle>
                          <CardDescription className="mt-1 text-slate-dim">
                            {epa.shortName || epa.name}
                          </CardDescription>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-500">Executive</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-dim mb-4 line-clamp-3">
                        {epa.definition}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-dim">
                          <Layers className="h-3 w-3" />
                          <span>Layer {epa.dag?.primaryLayer}</span>
                          <span>•</span>
                          <span>{epa.dag?.enabledAtProgramStage}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Advanced EPAs */}
          {advancedEPAs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-semibold">Advanced EPAs</h2>
                <Badge variant="outline">{advancedEPAs.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advancedEPAs.map((epa) => (
                  <Card key={epa.id} className="bg-nex-surface border border-gold/30 hover:border-gold/50 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gold">{epa.id}</CardTitle>
                          <CardDescription className="mt-1 text-slate-dim">
                            {epa.shortName || epa.name}
                          </CardDescription>
                        </div>
                        <Badge className="bg-gold/20 text-gold">Advanced</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-dim line-clamp-3">
                        {epa.definition}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* CPAs Tab */}
        <TabsContent value="cpas" className="space-y-6 mt-6">
          {/* Core CPAs */}
          {coreCPAs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Core CPAs</h2>
                <Badge variant="outline">{coreCPAs.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreCPAs.map((cpa) => (
                  <CPACard key={cpa.id} cpa={cpa} />
                ))}
              </div>
            </div>
          )}

          {/* Advanced CPAs */}
          {advancedCPAsFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Advanced CPAs</h2>
                <Badge variant="outline">{advancedCPAsFiltered.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advancedCPAsFiltered.map((cpa) => (
                  <CPACard key={cpa.id} cpa={cpa} />
                ))}
              </div>
            </div>
          )}

          {/* Capstone CPAs */}
          {capstoneCPAs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-semibold">Capstone CPAs</h2>
                <Badge variant="outline">{capstoneCPAs.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {capstoneCPAs.map((cpa) => (
                  <CPACard key={cpa.id} cpa={cpa} isCapstone />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

