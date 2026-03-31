'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Wrench, Heart, ExternalLink } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFunctionalArea, getKSBsByFunctionalArea } from '../actions';
import type { FunctionalArea, KSB } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
const log = logger.scope('pharmacovigilance/page');

// Status color mapping
const statusColors = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  archived: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};

// Proficiency level badge colors
const proficiencyColors = {
  'L1': 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300',
  'L2': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'L3': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'L4': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  'L5': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'L5+': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  'L5++': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
};

function KSBCard({ ksb }: { ksb: KSB }) {
  return (
    <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {ksb.id}
            </Badge>
            <Badge className={statusColors[ksb.status]}>
              {ksb.status.replace('_', ' ')}
            </Badge>
          </div>
          <Badge className={proficiencyColors[ksb.proficiency_level_target]}>
            {ksb.proficiency_level_target}
          </Badge>
        </div>
        <CardTitle className="text-lg text-slate-light">{ksb.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-slate-dim">
          {ksb.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Framework Alignment Summary */}
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-dim">Domains:</span>
            <span className="font-medium">
              {ksb.framework_alignment.competency_domains.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-dim">EPAs:</span>
            <span className="font-medium">
              {ksb.framework_alignment.epa_alignment.length}
            </span>
          </div>
          {ksb.framework_alignment.cpa_alignment && (
            <div className="flex items-center justify-between">
              <span className="text-slate-dim">CPAs:</span>
              <span className="font-medium">
                {ksb.framework_alignment.cpa_alignment.length}
              </span>
            </div>
          )}
        </div>

        {/* Primary Domain */}
        {ksb.framework_alignment.competency_domains.length > 0 && (
          <div className="mb-4 rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="font-medium mb-1">
              Primary Domain: {ksb.framework_alignment.competency_domains[0].domain_id}
            </div>
            <div className="text-slate-dim text-xs">
              {ksb.framework_alignment.competency_domains[0].domain_name}
            </div>
          </div>
        )}

        {/* Learning Objectives Count */}
        <div className="mb-4 text-sm">
          <span className="text-slate-dim">Learning Objectives:</span>
          <span className="ml-2 font-medium">
            {ksb.learning_objectives.length}
          </span>
        </div>

        {/* Quality Metrics */}
        <div className="flex gap-2 mb-4 text-xs">
          <div className="flex-1 bg-muted rounded px-2 py-1 text-center">
            <div className="font-semibold">{ksb.quality_metrics.validation_score}%</div>
            <div className="text-slate-dim">Validation</div>
          </div>
          <div className="flex-1 bg-muted rounded px-2 py-1 text-center">
            <div className="font-semibold">{ksb.quality_metrics.factual_accuracy}%</div>
            <div className="text-slate-dim">Accuracy</div>
          </div>
          <div className="flex-1 bg-muted rounded px-2 py-1 text-center">
            <div className="font-semibold">{ksb.quality_metrics.completeness}%</div>
            <div className="text-slate-dim">Complete</div>
          </div>
        </div>

        {/* Action Button */}
        <Button asChild className="w-full" size="sm">
          <Link href={`/nucleus/admin/academy/ksb-management/pharmacovigilance/${ksb.id}`}>
            View Details
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PharmVigilanceKSBsPage() {
  const [functionalArea, setFunctionalArea] = useState<FunctionalArea | null>(null);
  const [knowledgeKSBs, setKnowledgeKSBs] = useState<KSB[]>([]);
  const [skillsKSBs, setSkillsKSBs] = useState<KSB[]>([]);
  const [behaviorsKSBs, setBehaviorsKSBs] = useState<KSB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [area, knowledge, skills, behaviors] = await Promise.all([
          getFunctionalArea('pharmacovigilance'),
          getKSBsByFunctionalArea('pharmacovigilance', 'knowledge'),
          getKSBsByFunctionalArea('pharmacovigilance', 'skill'),
          getKSBsByFunctionalArea('pharmacovigilance', 'behavior'),
        ]);

        setFunctionalArea(area);
        setKnowledgeKSBs(knowledge);
        setSkillsKSBs(skills);
        setBehaviorsKSBs(behaviors);
      } catch (error) {
        log.error('Error loading KSBs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <VoiceLoading context="academy" variant="fullpage" message="Loading KSBs..." />
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">
            {functionalArea.area_name} KSBs
          </h1>
          <p className="text-slate-dim">
            {functionalArea.description}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/nucleus/admin/academy/ksb-management">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to KSB Management
          </Link>
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Total KSBs</CardDescription>
            <CardTitle className="text-3xl text-slate-light">{functionalArea.stats.total_ksbs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Knowledge</CardDescription>
            <CardTitle className="text-3xl text-blue-600 text-slate-light">
              {functionalArea.stats.knowledge_count}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Skills</CardDescription>
            <CardTitle className="text-3xl text-purple-600 text-slate-light">
              {functionalArea.stats.skills_count}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Behaviors</CardDescription>
            <CardTitle className="text-3xl text-orange-600 text-slate-light">
              {functionalArea.stats.behaviors_count}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Published</CardDescription>
            <CardTitle className="text-3xl text-green-600 text-slate-light">
              {functionalArea.stats.published_count}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed KSB Browser */}
      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge ({knowledgeKSBs.length})
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Skills ({skillsKSBs.length})
          </TabsTrigger>
          <TabsTrigger value="behaviors" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Behaviors ({behaviorsKSBs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          {knowledgeKSBs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-dim">
                No knowledge KSBs found. Create your first knowledge KSB to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeKSBs.map((ksb) => (
                <KSBCard key={ksb.id} ksb={ksb} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          {skillsKSBs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-dim">
                No skill KSBs found. Create your first skill KSB to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillsKSBs.map((ksb) => (
                <KSBCard key={ksb.id} ksb={ksb} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="behaviors" className="space-y-4">
          {behaviorsKSBs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-dim">
                No behavior KSBs found. Create your first behavior KSB to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {behaviorsKSBs.map((ksb) => (
                <KSBCard key={ksb.id} ksb={ksb} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
