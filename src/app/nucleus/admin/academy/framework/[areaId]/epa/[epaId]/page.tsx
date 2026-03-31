'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, Brain, GraduationCap, ClipboardList, ExternalLink, CheckCircle2, Cpu } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/wrappers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getEPADetail, type EPADetail } from '@/app/nucleus/admin/academy/framework/actions';

import { logger } from '@/lib/logger';
const log = logger.scope('[epaId]/page');

// Helper to extract domain number for sorting
function getDomainNumber(domainName: string): number {
  const match = domainName.match(/Domain\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

// Sort domains by their number
function sortDomains<T extends { domain: string }>(domains: T[]): T[] {
  return [...domains].sort((a, b) => getDomainNumber(a.domain) - getDomainNumber(b.domain));
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

export default function EPADetailPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const epaId = params.epaId as string;

  const [epa, setEPA] = useState<EPADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const epaData = await getEPADetail(epaId);
        setEPA(epaData);
      } catch (error) {
        log.error('Error loading EPA data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [epaId]);

  if (loading) {
    return (
      <VoiceLoading context="academy" variant="fullpage" message="Loading EPA data..." />
    );
  }

  if (!epa) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-slate-dim">EPA not found</p>
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
        title={epa.title}
        description={`Career Stage: ${epa.career_stage}`}
        backHref={`/nucleus/admin/academy/framework/${areaId}`}
        backLabel="Back to Framework"
        badge={{ label: epa.id }}
        secondaryBadge={{
          label: epa.category === 'core' ? 'Core EPA' : 'Executive EPA',
          className: epa.category === 'core'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
        }}
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Competencies
          </TabsTrigger>
          <TabsTrigger value="entrustment" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Entrustment
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Learning Path
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Definition</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim leading-relaxed">
                {epa.definition}
              </p>
            </CardContent>
          </Card>

          {epa.educational_rationale && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Educational Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-dim leading-relaxed">
                  {epa.educational_rationale}
                </p>
              </CardContent>
            </Card>
          )}

          {epa.scope_and_boundaries && epa.scope_and_boundaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Scope and Boundaries</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {epa.scope_and_boundaries.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-dim flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-light">
                <Cpu className="h-5 w-5" />
                AI Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim mb-4">
                {epa.ai_integration}
              </p>
              {epa.ai_integration_requirements && epa.ai_integration_requirements.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                  <ul className="space-y-1">
                    {epa.ai_integration_requirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-slate-dim flex items-start gap-2">
                        <span className="text-cyan">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {epa.quality_metrics && epa.quality_metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {epa.quality_metrics.map((metric, idx) => (
                    <div key={idx} className="text-sm p-2 bg-muted/50 rounded flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {metric}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {epa.drive_link && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <a href={epa.drive_link} target="_blank" rel="noopener noreferrer">
                    View Full Documentation
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Competencies Tab */}
        <TabsContent value="competencies" className="space-y-6">
          {epa.required_domains && epa.required_domains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Required Competency Domains</CardTitle>
                <CardDescription className="text-slate-dim">Primary domains with required proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortDomains(epa.required_domains).map((domain, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{domain.domain}</span>
                        <Badge variant="default" className="font-mono">{domain.level}</Badge>
                      </div>
                      <p className="text-xs text-slate-dim">{domain.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {epa.supporting_domains && epa.supporting_domains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Supporting Competency Domains</CardTitle>
                <CardDescription className="text-slate-dim">Additional domains that enhance this EPA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortDomains(epa.supporting_domains).map((domain, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{domain.domain}</span>
                        <Badge variant="outline" className="font-mono">{domain.level}</Badge>
                      </div>
                      <p className="text-xs text-slate-dim">{domain.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {epa.observable_components && epa.observable_components.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Observable Performance Components</CardTitle>
                <CardDescription className="text-slate-dim">Key activities and behaviors demonstrating competency</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {epa.observable_components.map((component, idx) => (
                    <AccordionItem key={idx} value={`component-${idx}`}>
                      <AccordionTrigger className="text-left">
                        <span className="font-medium">{component.category}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 pl-4">
                          {component.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm text-slate-dim flex items-start gap-2">
                              <span className="text-cyan mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entrustment Levels Tab */}
        <TabsContent value="entrustment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Entrustment Scale</CardTitle>
              <CardDescription className="text-slate-dim">
                Progressive levels of independence with behavioral anchors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {epa.entrustment_levels ? (
                <div className="space-y-4">
                  {sortByLevel(Object.entries(epa.entrustment_levels)).map(([level, data]) => (
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
                      {typeof data === 'object' && data.behavioral_anchors && data.behavioral_anchors.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="text-xs font-medium text-slate-dim mb-2">Behavioral Anchors:</h5>
                          <ul className="space-y-1">
                            {data.behavioral_anchors.map((anchor, idx) => (
                              <li key={idx} className="text-xs text-slate-dim flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-cyan mt-0.5 shrink-0" />
                                {anchor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-dim">
                  Entrustment level details not available for this EPA.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Path Tab */}
        <TabsContent value="learning" className="space-y-6">
          {epa.supports_cpas && epa.supports_cpas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Supports CPAs</CardTitle>
                <CardDescription className="text-slate-dim">
                  Critical Practice Activities this EPA enables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {epa.supports_cpas.map((cpa, idx) => (
                    <Link key={idx} href={`/nucleus/admin/academy/framework/${areaId}/cpa/${cpa}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {cpa}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Career Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-dim">
                {epa.required_level || `Target: ${epa.career_stage}`}
              </p>
            </CardContent>
          </Card>

          {epa.id === 'EPA10' && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400 text-slate-light">
                  AI Competency Gateway
                </CardTitle>
                <CardDescription className="text-slate-dim">
                  EPA10 serves as the structured gateway to advanced AI competency development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-dim mb-4">
                  This EPA provides the foundation for progression to CPA8 (AI-Enhanced Pharmacovigilance Activities).
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Phase 1</Badge>
                    <span className="text-sm">Foundation (L1-L2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Phase 2</Badge>
                    <span className="text-sm">Application (L3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Phase 3</Badge>
                    <span className="text-sm">Integration (L4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Phase 4</Badge>
                    <span className="text-sm">Innovation (L5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Phase 5</Badge>
                    <span className="text-sm">Capstone → CPA8</span>
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
