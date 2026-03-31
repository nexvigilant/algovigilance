'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Grid3X3, Target, ClipboardList, ExternalLink } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/wrappers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFunctionalArea } from '../../ksb-management/actions';
import { getPVDomains } from '../../pv-domains/actions';
import { getEPAs, getCPAs, type EPA, type CPA } from '@/lib/actions/framework-compat';
import type { FunctionalArea } from '@/types/ksb-framework';
import type { PVDomain } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('[areaId]/page');

export default function FrameworkAreaPage() {
  const params = useParams();
  const areaId = params.areaId as string;

  const [functionalArea, setFunctionalArea] = useState<FunctionalArea | null>(null);
  const [domains, setDomains] = useState<PVDomain[]>([]);
  const [epas, setEPAs] = useState<EPA[]>([]);
  const [cpas, setCPAs] = useState<CPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('domains');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [area, pvDomains, epaData, cpaData] = await Promise.all([
          getFunctionalArea(areaId),
          getPVDomains(),
          getEPAs(),
          getCPAs(),
        ]);

        setFunctionalArea(area);
        setDomains(pvDomains);
        setEPAs(epaData);
        setCPAs(cpaData);
      } catch (error) {
        log.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [areaId]);

  if (loading) {
    return (
      <VoiceLoading context="admin" variant="fullpage" message="Loading framework data..." />
    );
  }

  if (!functionalArea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-slate-dim">Functional area not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title={functionalArea.area_name}
        description="Browse Domains, EPAs, and CPAs"
        backHref="/nucleus/admin/academy/framework"
        backLabel="Back to Framework"
      />

      {/* Statistics Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Domains</CardDescription>
            <CardTitle className="text-3xl text-blue-600 text-slate-light">{domains.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">EPAs</CardDescription>
            <CardTitle className="text-3xl text-purple-600 text-slate-light">{epas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">CPAs</CardDescription>
            <CardTitle className="text-3xl text-orange-600 text-slate-light">{cpas.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Domains ({domains.length})
          </TabsTrigger>
          <TabsTrigger value="epas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            EPAs ({epas.length})
          </TabsTrigger>
          <TabsTrigger value="cpas" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            CPAs ({cpas.length})
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map(domain => (
              <Card key={domain.id} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {domain.id}
                    </Badge>
                    <Badge variant="secondary">{domain.totalKSBs} KSBs</Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-light">{domain.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-dim">
                    {domain.definition}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <div className="text-sm font-semibold">{domain.stats.knowledge}</div>
                      <div className="text-[10px] text-slate-dim">K</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                      <div className="text-sm font-semibold">{domain.stats.skills}</div>
                      <div className="text-[10px] text-slate-dim">S</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded">
                      <div className="text-sm font-semibold">{domain.stats.behaviors}</div>
                      <div className="text-[10px] text-slate-dim">B</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/nucleus/admin/academy/pv-domains/${domain.id}`}>
                      View Domain
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* EPAs Tab */}
        <TabsContent value="epas" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {epas.map(epa => (
              <Card key={epa.id} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {epa.id}
                    </Badge>
                    <Badge className={epa.tier === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'}>
                      {epa.tier === 'core' ? 'Core' : 'Executive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-light">{epa.name}</CardTitle>
                  <CardDescription className="line-clamp-3 text-slate-dim">
                    {epa.definition}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Primary Domains */}
                  <div className="mb-4">
                    <div className="text-xs text-slate-dim mb-2">Primary Domains:</div>
                    <div className="flex flex-wrap gap-1">
                      {epa.primaryDomains.slice(0, 3).map((domain, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          {domain.split(' - ')[0]}
                        </Badge>
                      ))}
                      {epa.primaryDomains.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{epa.primaryDomains.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* AI Integration */}
                  <div className="text-xs">
                    <span className="text-slate-dim">AI: </span>
                    <span className="line-clamp-1">{epa.aiIntegration}</span>
                  </div>

                  {/* Career Stage */}
                  <div className="mt-2 text-xs">
                    <span className="text-slate-dim">Stage: </span>
                    <span>{epa.careerStage}</span>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full mt-4" size="sm">
                    <Link href={`/nucleus/admin/academy/framework/${areaId}/epa/${epa.id}`}>
                      View EPA
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CPAs Tab */}
        <TabsContent value="cpas" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cpas.map(cpa => (
              <Card key={cpa.id} className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {cpa.id}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                      {cpa.focusArea}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-light">{cpa.name}</CardTitle>
                  <CardDescription className="line-clamp-3 text-slate-dim">
                    {cpa.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Primary Domains */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-dim mb-2">Primary Domains:</div>
                    <div className="flex flex-wrap gap-1">
                      {cpa.primaryDomains.slice(0, 3).map((domain, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          {domain.split(' - ')[0]}
                        </Badge>
                      ))}
                      {cpa.primaryDomains.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{cpa.primaryDomains.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Key EPAs */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-dim mb-2">Key EPAs:</div>
                    <div className="flex flex-wrap gap-1">
                      {cpa.keyEPAs.map((epa, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {epa}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* AI Integration */}
                  <div className="text-xs">
                    <span className="text-slate-dim">AI: </span>
                    <span className="line-clamp-1">{cpa.aiIntegration}</span>
                  </div>

                  {/* Career Stage */}
                  <div className="mt-2 text-xs">
                    <span className="text-slate-dim">Stage: </span>
                    <span>{cpa.careerStage}</span>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full mt-4" size="sm">
                    <Link href={`/nucleus/admin/academy/framework/${areaId}/cpa/${cpa.id}`}>
                      View CPA
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
