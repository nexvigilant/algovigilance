'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Grid3X3, Target, Brain, CheckCircle2, Cpu, BookOpen, TrendingUp } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/wrappers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCPADetail, type CPADetail } from '@/app/nucleus/admin/academy/framework/actions';

import { logger } from '@/lib/logger';
const log = logger.scope('[cpaId]/page');

// Helper to extract domain number for sorting
function getDomainNumber(domainName: string): number {
  const match = domainName.match(/Domain\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

// Sort domain strings by their number
function sortDomainStrings(domains: string[]): string[] {
  return [...domains].sort((a, b) => getDomainNumber(a) - getDomainNumber(b));
}

// Helper to extract level number for sorting (L1, L2, L1-L2, L5+, etc.)
function getLevelNumber(level: string): number {
  const match = level.match(/L(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

// Sort entries by level key
function sortByLevel<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort((a, b) => getLevelNumber(a[0]) - getLevelNumber(b[0]));
}

export default function CPADetailPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const cpaId = params.cpaId as string;

  const [cpa, setCPA] = useState<CPADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const cpaData = await getCPADetail(cpaId);
        setCPA(cpaData);
      } catch (error) {
        log.error('Error loading CPA data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cpaId]);

  if (loading) {
    return (
      <VoiceLoading context="academy" variant="fullpage" message="Loading CPA data..." />
    );
  }

  if (!cpa) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-slate-dim">CPA not found</p>
        <div className="text-center mt-4">
          <Button asChild variant="outline">
            <Link href={`/nucleus/admin/academy/framework/${areaId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Framework
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PageHeader
        title={cpa.name}
        description={`Career Stage: ${cpa.careerStage}`}
        backHref={`/nucleus/admin/academy/framework/${areaId}`}
        backLabel="Back to Framework"
        badge={{ label: cpa.id }}
        secondaryBadge={{
          label: cpa.focusArea,
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
        }}
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="epas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            EPAs
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Progression
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim leading-relaxed">
                {cpa.summary}
              </p>
            </CardContent>
          </Card>

          {cpa.educationalPhilosophy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-light">
                  <BookOpen className="h-5 w-5" />
                  Educational Philosophy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-dim leading-relaxed">
                  {cpa.educationalPhilosophy}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Focus Area</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 text-sm px-3 py-1">
                {cpa.focusArea}
              </Badge>
              {cpa.implementationPhase && (
                <p className="text-sm text-slate-dim mt-2">
                  {cpa.implementationPhase}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-light">
                <Cpu className="h-5 w-5" />
                AI Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim">
                {cpa.aiIntegration}
              </p>
            </CardContent>
          </Card>

          {cpa.successMetrics && cpa.successMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-light">
                  <TrendingUp className="h-5 w-5" />
                  Success Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cpa.successMetrics.map((metric, idx) => (
                    <div key={idx} className="text-sm p-2 bg-muted/50 rounded flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {metric}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cpa.developmentPathway && cpa.developmentPathway.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Development Pathway</CardTitle>
                <CardDescription className="text-slate-dim">Sequential competency building blocks</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {cpa.developmentPathway.map((step, idx) => (
                    <li key={idx} className="text-sm text-slate-dim flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-cyan text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {cpa.integrationModules && cpa.integrationModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Integration Modules</CardTitle>
                <CardDescription className="text-slate-dim">Cross-domain integration requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {cpa.integrationModules.map((module, idx) => (
                    <li key={idx} className="text-sm text-slate-dim flex items-start gap-2">
                      <span className="text-cyan">•</span>
                      {module}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Primary Domains</CardTitle>
              <CardDescription className="text-slate-dim">Core competency domains required for this CPA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sortDomainStrings(cpa.primaryDomains).map((domain, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {domain}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {cpa.supportingDomains && cpa.supportingDomains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Supporting Domains</CardTitle>
                <CardDescription className="text-slate-dim">Additional domains that enhance this CPA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sortDomainStrings(cpa.supportingDomains).map((domain, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EPAs Tab */}
        <TabsContent value="epas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Key EPAs</CardTitle>
              <CardDescription className="text-slate-dim">
                Entrustable Professional Activities that support this CPA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cpa.keyEPAs.map((epa, idx) => (
                  <Link key={idx} href={`/nucleus/admin/academy/framework/${areaId}/epa/${epa.replace(' ', '')}`}>
                    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <Badge variant="outline" className="font-mono mb-2">
                        {epa}
                      </Badge>
                      <p className="text-sm text-slate-dim">
                        Click to view EPA details
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {cpa.supportingEPAs && cpa.supportingEPAs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Supporting EPAs</CardTitle>
                <CardDescription className="text-slate-dim">Additional EPAs that enhance this CPA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cpa.supportingEPAs.map((epa, idx) => (
                    <Link key={idx} href={`/nucleus/admin/academy/framework/${areaId}/epa/${epa.replace(' ', '')}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {epa}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progression Tab */}
        <TabsContent value="progression" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Career Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim">
                {cpa.careerStage}
              </p>
            </CardContent>
          </Card>

          {cpa.proficiencyLevels && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Proficiency Progression</CardTitle>
                <CardDescription className="text-slate-dim">
                  Expected progression through proficiency levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortByLevel(Object.entries(cpa.proficiencyLevels)).map(([level, data]) => (
                    <div key={level} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono text-base">
                          {level}
                        </Badge>
                        <span className="font-semibold">
                          {typeof data === 'object' ? data.title : level}
                        </span>
                      </div>
                      <p className="text-sm text-slate-dim mb-3">
                        {typeof data === 'object' ? data.description : data}
                      </p>
                      {typeof data === 'object' && (data.scope || data.keyCapability || data.supervision) && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {data.scope && (
                            <div className="text-xs">
                              <span className="font-medium text-slate-dim">Scope: </span>
                              <span className="text-slate-dim">{data.scope}</span>
                            </div>
                          )}
                          {data.keyCapability && (
                            <div className="text-xs">
                              <span className="font-medium text-slate-dim">Key Capability: </span>
                              <span className="text-slate-dim">{data.keyCapability}</span>
                            </div>
                          )}
                          {data.supervision && (
                            <div className="text-xs">
                              <span className="font-medium text-slate-dim">Supervision: </span>
                              <span className="text-slate-dim">{data.supervision}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cpa.behavioralAnchors && Object.keys(cpa.behavioralAnchors).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Behavioral Anchors by Level</CardTitle>
                <CardDescription className="text-slate-dim">
                  Observable behaviors demonstrating competency at each level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortByLevel(Object.entries(cpa.behavioralAnchors)).map(([level, anchors]) => (
                    <div key={level} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-mono">{level}</Badge>
                      </div>
                      <ul className="space-y-1">
                        {anchors.map((anchor, idx) => (
                          <li key={idx} className="text-xs text-slate-dim flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 text-cyan mt-0.5 shrink-0" />
                            {anchor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cpa.id === 'CPA8' && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400 text-slate-light">
                  AI Competency Capstone
                </CardTitle>
                <CardDescription className="text-slate-dim">
                  CPA8 represents the pinnacle of AI integration in pharmacovigilance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-dim mb-4">
                  This CPA requires EPA10 (AI Gateway) at L4+ mastery before progression.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Prerequisites</Badge>
                    <span className="text-sm">EPA10 at L4 or higher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Focus</Badge>
                    <span className="text-sm">Organizational AI transformation leadership</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Outcome</Badge>
                    <span className="text-sm">Strategic AI implementation & innovation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
