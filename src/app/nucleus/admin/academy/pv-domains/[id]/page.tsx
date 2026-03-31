'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain, Wrench, BookOpen, Sparkles,
  Target, ClipboardCheck, GitBranch,
  ArrowUpDown, Search,
  Filter
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getPVDomain,
  getCapabilityComponents,
  getActivityAnchors,
  getAssessmentMethods,
  getDomainIntegrations,
  getImplementationPhases,
  type DomainIntegrationWithContext,
} from '../actions';
import type { PVDomain, CapabilityComponent, ActivityAnchor, AssessmentMethod, ImplementationPhase } from '@/types/pv-curriculum';
import type { ProficiencyLevel } from '@/types/pv-framework';
import {
  typeConfig,
  sortOptions,
  assessmentCategoryConfig,
  getAssessmentCategory,
  type SortOption,
} from './components/constants';

import { logger } from '@/lib/logger';
const log = logger.scope('[id]/page');

export default function PVDomainDetailPage() {
  const params = useParams();
  const domainId = params.id as string;

  const [domain, setDomain] = useState<PVDomain | null>(null);
  const [components, setComponents] = useState<CapabilityComponent[]>([]);
  const [anchors, setAnchors] = useState<ActivityAnchor[]>([]);
  const [methods, setMethods] = useState<AssessmentMethod[]>([]);
  const [integrations, setIntegrations] = useState<DomainIntegrationWithContext[]>([]);
  const [phases, setPhases] = useState<ImplementationPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('components');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('section');
  const [searchQuery, setSearchQuery] = useState('');
  const [assessmentLevelFilter, setAssessmentLevelFilter] = useState<'all' | ProficiencyLevel>('all');

  useEffect(() => {
    loadDomainData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId]);

  async function loadDomainData() {
    try {
      setLoading(true);
      const [domainData, componentsData, anchorsData, methodsData, integrationsData, phasesData] =
        await Promise.all([
          getPVDomain(domainId),
          getCapabilityComponents(domainId),
          getActivityAnchors(domainId),
          getAssessmentMethods(domainId),
          getDomainIntegrations(domainId),
          getImplementationPhases(domainId),
        ]);

      setDomain(domainData);
      setComponents(componentsData);
      setAnchors(anchorsData);
      setMethods(methodsData);
      setIntegrations(integrationsData);
      setPhases(phasesData);
    } catch (error) {
      log.error('Error loading domain data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <VoiceLoading
        context="admin"
        variant="fullpage"
        message="Loading domain details..."
      />
    );
  }

  if (!domain) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-slate-dim">Domain not found</p>
        </div>
      </div>
    );
  }

  // Filter components by type and search query
  const filteredComponents = components.filter(c => {
    const matchesType = !typeFilter || c.type === typeFilter;
    const matchesSearch = !searchQuery ||
      c.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Sort components
  const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];
  const bloomOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  const sortedComponents = [...filteredComponents].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.itemName.localeCompare(b.itemName);
      case 'name-desc':
        return b.itemName.localeCompare(a.itemName);
      case 'level':
        return levelOrder.indexOf(a.proficiencyLevel) - levelOrder.indexOf(b.proficiencyLevel);
      case 'bloom':
        return bloomOrder.indexOf(a.bloomLevel.toLowerCase()) - bloomOrder.indexOf(b.bloomLevel.toLowerCase());
      case 'section':
      default:
        return (a.majorSection || '').localeCompare(b.majorSection || '');
    }
  });

  // Determine grouping based on filter and sort
  // When filtering by type, group by section within the type
  // When viewing all, group by majorSection
  const getGroupedComponents = () => {
    if (typeFilter && sortBy === 'section') {
      // When filtering by type, group by section field
      return sortedComponents.reduce((acc, comp) => {
        const key = comp.section || comp.majorSection || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(comp);
        return acc;
      }, {} as Record<string, CapabilityComponent[]>);
    } else if (sortBy === 'section') {
      // When viewing all, group by majorSection
      return sortedComponents.reduce((acc, comp) => {
        const key = comp.majorSection || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(comp);
        return acc;
      }, {} as Record<string, CapabilityComponent[]>);
    } else {
      return { 'All Components': sortedComponents };
    }
  };

  const groupedComponents = getGroupedComponents();

  // Get the main card title based on active type filter
  const getTypeCardTitle = () => {
    if (!typeFilter) return null;
    const titles: Record<string, string> = {
      knowledge: 'Core Knowledge Components',
      skill: 'Core Skill Components',
      behavior: 'Core Behavior Components',
      ai_integration: 'AI Integration Components',
    };
    return titles[typeFilter] || 'Components';
  };

  const typeCardTitle = getTypeCardTitle();

  // Helper to highlight action verbs in activity descriptions
  const highlightActionVerb = (text: string) => {
    const words = text.split(' ');
    if (words.length === 0) return text;

    const verb = words[0];
    const rest = words.slice(1).join(' ');

    return (
      <>
        <span className="text-cyan-500 font-semibold">{verb}</span>
        {rest && ` ${rest}`}
      </>
    );
  };

  // Group anchors by proficiency level
  const groupedAnchors = anchors.reduce((acc, anchor) => {
    const key = anchor.proficiencyLevel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(anchor);
    return acc;
  }, {} as Record<string, ActivityAnchor[]>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
            {domain.id}
          </Badge>
          <Badge variant="secondary">{domain.totalKSBs} KSBs</Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline mb-3 text-gold">{domain.name}</h1>
        <p className="text-slate-dim mb-4">{domain.definition}</p>

        {domain.educationalRationale && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-light">Educational Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-dim">{domain.educationalRationale}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
        <Card>
          <CardContent className="pt-4 text-center">
            <Brain className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xl font-bold">{domain.stats.knowledge}</div>
            <div className="text-xs text-slate-dim">Knowledge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Wrench className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold">{domain.stats.skills}</div>
            <div className="text-xs text-slate-dim">Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-xl font-bold">{domain.stats.behaviors}</div>
            <div className="text-xs text-slate-dim">Behaviors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-xl font-bold">{domain.stats.aiIntegration}</div>
            <div className="text-xs text-slate-dim">AI</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <div className="text-xl font-bold">{domain.stats.activityAnchors}</div>
            <div className="text-xs text-slate-dim">Anchors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-cyan-600" />
            <div className="text-xl font-bold">{domain.stats.assessmentMethods}</div>
            <div className="text-xs text-slate-dim">Methods</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="components">
            Capability Components ({components.length})
          </TabsTrigger>
          <TabsTrigger value="anchors">
            Activity Anchors ({anchors.length})
          </TabsTrigger>
          <TabsTrigger value="methods">
            Assessment Methods ({methods.length})
          </TabsTrigger>
          <TabsTrigger value="integrations" disabled className="opacity-50">
            Integrations ({integrations.length})
          </TabsTrigger>
          <TabsTrigger value="phases" disabled className="opacity-50">
            Learning Phases ({phases.length})
          </TabsTrigger>
        </TabsList>

        {/* Capability Components Tab */}
        <TabsContent value="components" className="pt-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-dim" />
              <Input
                placeholder="Search by name, description, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={typeFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(null)}
            >
              All ({components.length})
            </Button>
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const count = components.filter(c => c.type === type).length;
              return (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  <Icon className={`h-4 w-4 mr-1 ${typeFilter !== type ? config.color : ''}`} />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Results count */}
          {(searchQuery || typeFilter) && (
            <p className="text-sm text-slate-dim mb-4">
              Showing {filteredComponents.length} of {components.length} components
            </p>
          )}

          {/* Grouped Components */}
          <div className="space-y-6">
            {typeFilter && typeCardTitle ? (
              /* When filtering by type, show single card with accordion sub-sections */
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-light">{typeCardTitle}</CardTitle>
                  <CardDescription className="text-slate-dim">{filteredComponents.length} items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(groupedComponents).map(([section, items]) => (
                      <AccordionItem key={section} value={section}>
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                          <div className="flex items-center gap-2">
                            {section}
                            <Badge variant="secondary" className="text-xs">
                              {items.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {items.map(comp => {
                              const config = typeConfig[comp.type] || typeConfig.knowledge;
                              const Icon = config.icon;
                              return (
                                <div
                                  key={comp.id}
                                  className={`p-3 rounded-lg border ${config.bg}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{comp.itemName}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {comp.proficiencyLevel}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {comp.bloomLevel}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-dim">
                                        {comp.itemDescription}
                                      </p>
                                      {comp.keywords.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                          {comp.keywords.slice(0, 5).map(kw => (
                                            <Badge key={kw} variant="outline" className="text-xs">
                                              {kw}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              /* When viewing all, show separate cards per majorSection */
              Object.entries(groupedComponents).map(([section, items]) => (
                <Card key={section}>
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-light">{section}</CardTitle>
                    <CardDescription className="text-slate-dim">{items.length} items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map(comp => {
                        const config = typeConfig[comp.type] || typeConfig.knowledge;
                        const Icon = config.icon;
                        return (
                          <div
                            key={comp.id}
                            className={`p-3 rounded-lg border ${config.bg}`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{comp.itemName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {comp.proficiencyLevel}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {comp.bloomLevel}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-dim">
                                  {comp.itemDescription}
                                </p>
                                {comp.keywords.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {comp.keywords.slice(0, 5).map(kw => (
                                      <Badge key={kw} variant="outline" className="text-xs">
                                        {kw}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Activity Anchors Tab */}
        <TabsContent value="anchors" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-light">Activity Anchors by Proficiency Level</CardTitle>
              <CardDescription className="text-slate-dim">{anchors.length} total anchors</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedAnchors).map(([level, items]) => (
                  <AccordionItem key={level} value={level}>
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{level}</Badge>
                        <span>{items[0]?.levelName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length} anchors
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {items.map(anchor => (
                          <div key={anchor.id} className="border-l-2 border-primary pl-4">
                            <p className="font-medium mb-2">{highlightActionVerb(anchor.activityDescription)}</p>
                            {anchor.observableBehaviors.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-slate-dim">Observable Behaviors:</span>
                                <ul className="list-disc list-inside text-sm text-slate-dim">
                                  {anchor.observableBehaviors.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {anchor.evidenceTypes.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-slate-dim">Evidence Types:</span>
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {anchor.evidenceTypes.map((e, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {e}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Methods Tab */}
        <TabsContent value="methods" className="pt-4">
          {(() => {
            // Filter methods by level if filter is set
            const filteredMethods = assessmentLevelFilter === 'all'
              ? methods
              : methods.filter(m => m.applicableLevels.includes(assessmentLevelFilter));

            // Group by consolidated category
            const groupedByType = filteredMethods.reduce((acc, method) => {
              const category = getAssessmentCategory(method.assessmentType);
              if (!acc[category]) acc[category] = [];
              acc[category].push(method);
              return acc;
            }, {} as Record<string, AssessmentMethod[]>);

            // Get all unique levels for filter
            const allLevels = [...new Set(methods.flatMap(m => m.applicableLevels))].sort();

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-light">
                        <ClipboardCheck className="h-5 w-5 text-cyan-600" />
                        Assessment Methods
                      </CardTitle>
                      <CardDescription className="text-slate-dim">
                        {filteredMethods.length} assessment method{filteredMethods.length !== 1 ? 's' : ''} available
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-dim" />
                      <Select value={assessmentLevelFilter} onValueChange={(value) => setAssessmentLevelFilter(value as 'all' | ProficiencyLevel)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {allLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupedByType).length === 0 ? (
                    <p className="text-sm text-slate-dim text-center py-4">
                      No assessment methods found for the selected filter.
                    </p>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedByType).map(([category, typeMethods]) => {
                        const config = assessmentCategoryConfig[category] || assessmentCategoryConfig['default'];
                        const Icon = config.icon;

                        // Group methods by their original assessment type within this category
                        const methodsByType = typeMethods.reduce((acc, method) => {
                          if (!acc[method.assessmentType]) acc[method.assessmentType] = [];
                          acc[method.assessmentType].push(method);
                          return acc;
                        }, {} as Record<string, AssessmentMethod[]>);

                        // Sort assessment types by level indicators in their names
                        const sortedTypes = Object.keys(methodsByType).sort((a, b) => {
                          // Extract level numbers for sorting
                          const getOrder = (name: string) => {
                            if (name.includes('L1-L2') || name.includes('Foundation')) return 1;
                            if (name.includes('L3-L4') || name.includes('Professional')) return 2;
                            if (name.includes('L5+') || name.includes('Expert')) return 3;
                            return 4;
                          };
                          return getOrder(a) - getOrder(b);
                        });

                        return (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-lg ${config.bg}`}>
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <span className="font-semibold">{category}</span>
                                  <span className="text-sm text-slate-dim ml-2">
                                    ({typeMethods.length})
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-muted">
                                {sortedTypes.map(assessmentType => {
                                  const typeMethodsList = methodsByType[assessmentType];
                                  const typeLevels = [...new Set(typeMethodsList.flatMap(m => m.applicableLevels))].sort();
                                  return (
                                    <AccordionItem key={assessmentType} value={`${category}-${assessmentType}`}>
                                      <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="text-sm font-medium">{assessmentType}</span>
                                          <span className="text-xs text-slate-dim">
                                            ({typeMethodsList.length})
                                          </span>
                                          <div className="flex gap-1 ml-auto mr-2">
                                            {typeLevels.map(level => (
                                              <Badge key={level} variant="outline" className="text-xs">
                                                {level}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="space-y-3 pt-2">
                                          {typeMethodsList.map(method => (
                                            <div key={method.id} className="border rounded-lg p-4 bg-muted/30">
                                              <div className="mb-3">
                                                <p className="text-sm text-slate-dim">{method.purpose}</p>
                                              </div>
                                              <div className="grid md:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                  <span className="font-semibold text-cyan-600">Frequency</span>
                                                  <p className="text-slate-dim">{method.frequency}</p>
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-cyan-600">Evidence Required</span>
                                                  <p className="text-slate-dim">{method.evidenceRequired}</p>
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-cyan-600">Passing Criteria</span>
                                                  <p className="text-slate-dim">{method.passingCriteria}</p>
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-cyan-600">Assessor Qualifications</span>
                                                  <p className="text-slate-dim">{method.assessorQualifications}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* Domain Integrations Tab */}
        <TabsContent value="integrations" className="pt-4">
          {(() => {
            // Categorize by actual flow direction (from bidirectional query)
            const inboundIntegrations = integrations.filter(i => i.flowDirection === 'inbound');
            const outboundIntegrations = integrations.filter(i => i.flowDirection === 'outbound');

            // Further categorize by relationship type
            const synergies = integrations.filter(i =>
              i.direction.toLowerCase().includes('synergy')
            );
            const _aiGateways = integrations.filter(i =>
              i.direction.toLowerCase().includes('ai') ||
              i.direction.toLowerCase().includes('gateway')
            );
            // Group integrations by prerequisite level
            const groupByLevel = (items: DomainIntegrationWithContext[]) => {
              const grouped: Record<string, DomainIntegrationWithContext[]> = {};
              items.forEach(item => {
                const level = item.prerequisiteLevel || 'General';
                if (!grouped[level]) grouped[level] = [];
                grouped[level].push(item);
              });
              return grouped;
            };

            const inboundByLevel = groupByLevel(inboundIntegrations);
            const outboundByLevel = groupByLevel(outboundIntegrations);

            // Sort levels
            const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++', 'General'];
            const sortLevels = (levels: string[]) =>
              levels.sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b));

            return (
              <div className="space-y-6">
                {/* Visual Flow Header */}
                <Card className="bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="text-sm text-slate-dim mb-1">Dependencies (In)</div>
                        <div className="text-2xl font-bold text-blue-600">{inboundIntegrations.length}</div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-dim">
                        <span>→</span>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-sm text-slate-dim mb-1">Current Domain</div>
                        <div className="text-2xl font-bold">{domain?.id}</div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-dim">
                        <span>→</span>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-sm text-slate-dim mb-1">Dependencies (Out)</div>
                        <div className="text-2xl font-bold text-green-600">{outboundIntegrations.length}</div>
                      </div>
                      {synergies.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 text-slate-dim">
                            <span>↔</span>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-sm text-slate-dim mb-1">Synergies</div>
                            <div className="text-2xl font-bold text-purple-600">{synergies.length}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Main Accordion for Dependencies */}
                <Accordion type="multiple" className="w-full">
                  {/* Inbound Dependencies */}
                  {inboundIntegrations.length > 0 && (
                    <AccordionItem value="dependencies-in">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                            <ArrowUpDown className="h-4 w-4 text-blue-600 rotate-90" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-semibold">Dependencies (In)</span>
                            <span className="text-sm text-slate-dim ml-2">
                              ({inboundIntegrations.length})
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-dim mb-4 pl-4">
                          Capabilities from other domains that this domain depends on
                        </p>
                        <Accordion type="multiple" className="w-full pl-4 border-l-2 border-blue-200">
                          {sortLevels(Object.keys(inboundByLevel)).map(level => {
                            const levelItems = inboundByLevel[level];
                            return (
                              <AccordionItem key={level} value={`in-${level}`}>
                                <AccordionTrigger className="hover:no-underline py-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono">
                                      {level}
                                    </Badge>
                                    <span className="text-sm">
                                      {levelItems.length} integration{levelItems.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 pt-2">
                                    {levelItems.map(integration => (
                                      <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                                        <div className="flex-shrink-0 mt-1">
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {integration.relatedDomain}
                                          </Badge>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">{integration.integrationPoint}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {integration.direction}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-slate-dim">
                                            {integration.dataProcessExchange}
                                          </p>
                                          {integration.notes && (
                                            <p className="text-xs text-blue-600 mt-1">
                                              &larr; {integration.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Outbound Dependencies */}
                  {outboundIntegrations.length > 0 && (
                    <AccordionItem value="dependencies-out">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                            <ArrowUpDown className="h-4 w-4 text-green-600 -rotate-90" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-semibold">Dependencies (Out)</span>
                            <span className="text-sm text-slate-dim ml-2">
                              ({outboundIntegrations.length})
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-dim mb-4 pl-4">
                          Other domains that depend on capabilities from this domain
                        </p>
                        <Accordion type="multiple" className="w-full pl-4 border-l-2 border-green-200">
                          {sortLevels(Object.keys(outboundByLevel)).map(level => {
                            const levelItems = outboundByLevel[level];
                            return (
                              <AccordionItem key={level} value={`out-${level}`}>
                                <AccordionTrigger className="hover:no-underline py-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono">
                                      {level}
                                    </Badge>
                                    <span className="text-sm">
                                      {levelItems.length} integration{levelItems.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 pt-2">
                                    {levelItems.map(integration => (
                                      <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                                        <div className="flex-shrink-0 mt-1">
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {integration.relatedDomain}
                                          </Badge>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">{integration.integrationPoint}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {integration.direction}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-slate-dim">
                                            {integration.dataProcessExchange}
                                          </p>
                                          {integration.notes && (
                                            <p className="text-xs text-green-600 mt-1">
                                              → {integration.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Synergies */}
                  {synergies.length > 0 && (
                    <AccordionItem value="synergies">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                            <GitBranch className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-semibold">Mutual Synergies</span>
                            <span className="text-sm text-slate-dim ml-2">
                              ({synergies.length})
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-dim mb-4 pl-4">
                          Domains that enhance each other when developed together
                        </p>
                        <div className="space-y-3 pl-4">
                          {synergies.map(integration => (
                            <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="flex-shrink-0 mt-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {integration.relatedDomain}
                                </Badge>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{integration.integrationPoint}</span>
                                  {integration.prerequisiteLevel && (
                                    <Badge variant="outline" className="text-xs">
                                      {integration.prerequisiteLevel}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-dim">
                                  {integration.dataProcessExchange}
                                </p>
                                {integration.notes && (
                                  <p className="text-xs text-purple-600 mt-1">
                                    ↔ {integration.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {integrations.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center text-slate-dim">
                      No domain integrations defined yet.
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* Learning Phases Tab */}
        <TabsContent value="phases" className="pt-4">
          <div className="space-y-4">
            {phases.map(phase => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {phase.phase}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-light">{phase.phaseName}</CardTitle>
                      <CardDescription className="text-slate-dim">Duration: {phase.duration}</CardDescription>
                    </div>
                    {phase.reviewRequired && (
                      <Badge variant="destructive" className="ml-auto">Review Required</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Focus Areas:</span>
                      <p className="text-slate-dim">{phase.focusAreas}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Key Activities:</span>
                      <p className="text-slate-dim">{phase.keyActivities}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Assessment Gate:</span>
                      <p className="text-slate-dim">{phase.assessmentGate}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Resources Required:</span>
                      <p className="text-slate-dim">{phase.resourcesRequired}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
