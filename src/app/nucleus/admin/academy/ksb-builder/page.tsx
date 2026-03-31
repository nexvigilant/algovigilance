'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Used in activity editor
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  BookOpen,
  Target,
  MessageCircle,
  Save,
  Plus,
  Trash2,
  Settings,
  ClipboardList,
  BarChart3,
  Shield,
  FileText,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type {
  CapabilityComponent,
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  KSBExample,
  PortfolioArtifactConfig,
} from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('ksb-builder/page');

// Type-safe value extractors for Select components
type ScenarioType = KSBHook['scenarioType'];
type EngineType = KSBActivity['engineType'];
type ArtifactType = PortfolioArtifactConfig['artifactType'];
type DifficultyLevel = KSBActivityMetadata['difficulty'];
import {
  getKSBsForBuilder,
  getKSBForBuilder,
  updateKSBFullContent,
  getKSBContentStatus,
} from '@/lib/actions/ksb-builder';
import { KSBBrowserPanel } from './components/ksb-browser-panel';
import { ActivityEditor } from './components/activity-editor';
import { ResourceEditor } from './components/resource-editor';
import { TagManager } from './components/tag-manager';
import { PrerequisitesSelector } from './components/prerequisites-selector';
import { PreviewModal } from './components/preview-modal';
import { WorkflowStatusBadge } from './components/workflow-status-badge';
import { GenerateButton } from './components/generate-button';
import { WorkflowActions } from './components/workflow-actions';
import { ResearchDataEditor } from './components/research-data-editor';
import { ResearchQualityDashboard } from './components/research-quality-dashboard';
import { BulkValidation } from './components/bulk-validation';

export default function KSBBuilderPage() {
  const { user } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [ksbs, setKsbs] = useState<CapabilityComponent[]>([]);
  const [selectedKSB, setSelectedKSB] = useState<CapabilityComponent | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    complete: number;
  } | null>(null);
  const [researchEditorOpen, setResearchEditorOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    'builder' | 'dashboard' | 'validation'
  >('builder');

  // Form state
  const [hook, setHook] = useState<KSBHook>({
    content: '',
    scenarioType: 'real_world',
  });
  const [concept, setConcept] = useState<KSBConcept>({
    content: '',
    keyPoints: [''],
    examples: [],
    resources: [],
  });
  const [activity, setActivity] = useState<KSBActivity>({
    engineType: 'triage',
    instructions: '',
    config: {
      scenario: '',
      decisions: [],
      timeConstraint: 30,
      scoringWeights: { accuracy: 0.5, speed: 0.25, justification: 0.25 },
    },
  });
  const [reflection, setReflection] = useState<KSBReflection>({
    prompt: '',
    portfolioArtifact: {
      title: '',
      description: '',
      competencyTags: [],
      artifactType: 'completion',
    },
  });
  const [metadata, setMetadata] = useState<KSBActivityMetadata>({
    version: '1.0',
    estimatedMinutes: 8,
    difficulty: 'intermediate',
    prerequisites: [],
    tags: [],
    completionCriteria: {
      requiredSections: ['hook', 'concept', 'activity', 'reflection'],
    },
  });

  useEffect(() => {
    if (selectedDomain) {
      loadKSBs();
      loadStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  useEffect(() => {
    if (selectedKSB) {
      // Populate form with existing data
      if (selectedKSB.hook) setHook(selectedKSB.hook);
      if (selectedKSB.concept) setConcept(selectedKSB.concept);
      if (selectedKSB.activity) setActivity(selectedKSB.activity);
      if (selectedKSB.reflection) setReflection(selectedKSB.reflection);
      if (selectedKSB.activityMetadata)
        setMetadata(selectedKSB.activityMetadata);
    }
  }, [selectedKSB]);

  const loadKSBs = async () => {
    setLoading(true);
    try {
      const result = await getKSBsForBuilder(selectedDomain);
      if (result.success && result.ksbs) {
        setKsbs(result.ksbs);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load KSBs' });
      }
    } catch (error) {
      log.error('Error loading KSBs:', error);
      setMessage({ type: 'error', text: 'Failed to load KSBs. Please ensure you are logged in as an admin.' });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const result = await getKSBContentStatus(selectedDomain);
      if (result.success && result.stats) {
        setStats({
          total: result.stats.total,
          complete: result.stats.complete,
        });
      }
    } catch (error) {
      log.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedKSB) return;

    setSaving(true);
    setMessage(null);

    const result = await updateKSBFullContent(selectedDomain, selectedKSB.id, {
      hook,
      concept,
      activity,
      reflection,
      activityMetadata: metadata,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'KSB content saved successfully!' });
      loadStats();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save' });
    }

    setSaving(false);
  };

  const addKeyPoint = () => {
    setConcept({
      ...concept,
      keyPoints: [...concept.keyPoints, ''],
    });
  };

  const updateKeyPoint = (index: number, value: string) => {
    const newPoints = [...concept.keyPoints];
    newPoints[index] = value;
    setConcept({ ...concept, keyPoints: newPoints });
  };

  const removeKeyPoint = (index: number) => {
    setConcept({
      ...concept,
      keyPoints: concept.keyPoints.filter((_, i) => i !== index),
    });
  };

  const addExample = () => {
    setConcept({
      ...concept,
      examples: [...concept.examples, { title: '', content: '' }],
    });
  };

  const updateExample = (
    index: number,
    field: keyof KSBExample,
    value: string
  ) => {
    const newExamples = [...concept.examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setConcept({ ...concept, examples: newExamples });
  };

  const removeExample = (index: number) => {
    setConcept({
      ...concept,
      examples: concept.examples.filter((_, i) => i !== index),
    });
  };

  const handleRefresh = () => {
    loadKSBs();
    loadStats();
    if (selectedKSB) {
      // Reload the selected KSB to get updated data
      getKSBForBuilder(selectedDomain, selectedKSB.id).then((result) => {
        if (result.success && result.ksb) {
          setSelectedKSB(result.ksb);
        }
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-nex-surface p-4">
        <div>
          <h1 className="text-2xl font-bold text-gold">KSB Activity Builder</h1>
          <p className="text-sm text-slate-dim">
            Configure activity engine content for KSBs
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Switcher */}
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button
              variant={activeView === 'builder' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('builder')}
            >
              <Settings className="mr-1 h-4 w-4" />
              Builder
            </Button>
            <Button
              variant={activeView === 'dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('dashboard')}
            >
              <BarChart3 className="mr-1 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeView === 'validation' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('validation')}
            >
              <Shield className="mr-1 h-4 w-4" />
              Validation
            </Button>
          </div>
          {stats && (
            <Badge variant="outline">
              {stats.complete}/{stats.total} Complete
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={selectedDomain ? `/nucleus/admin/academy/content-pipeline?domain=${selectedDomain}` : '/nucleus/admin/academy/content-pipeline'}>
              <Sparkles className="mr-2 h-4 w-4" />
              Batch Generate
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              (window.location.href =
                '/nucleus/admin/academy/ksb-builder/review')
            }
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Review Queue
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'dashboard' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <ResearchQualityDashboard
            onSelectKSB={(ksb) => {
              setSelectedKSB(ksb);
              setActiveView('builder');
            }}
          />
        </div>
      ) : activeView === 'validation' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <BulkValidation
            onSelectKSB={(ksb) => {
              setSelectedKSB(ksb);
              setActiveView('builder');
            }}
          />
        </div>
      ) : (
        /* Builder View - Side Panel Layout */
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - KSB Browser */}
          <div className="w-80 flex-shrink-0 border-r">
            <KSBBrowserPanel
              ksbs={ksbs}
              selectedKSB={selectedKSB}
              onSelectKSB={setSelectedKSB}
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
              loading={loading}
            />
          </div>

          {/* Right Panel - Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Message */}
            {message && (
              <Alert
                variant={message.type === 'error' ? 'destructive' : 'default'}
                className="mb-4"
              >
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Content Builder */}
            {selectedKSB ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <CardTitle className="text-slate-light">
                          {selectedKSB.itemName}
                        </CardTitle>
                        <WorkflowStatusBadge
                          status={selectedKSB.status || 'draft'}
                        />
                      </div>
                      <CardDescription className="text-slate-dim">
                        {selectedKSB.itemDescription}
                      </CardDescription>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {user && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResearchEditorOpen(true)}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            Research
                          </Button>
                          <GenerateButton
                            ksb={selectedKSB}
                            userId={user.uid}
                            onSuccess={handleRefresh}
                          />
                          <WorkflowActions
                            domainId={selectedDomain}
                            ksbId={selectedKSB.id}
                            currentStatus={selectedKSB.status || 'draft'}
                            userId={user.uid}
                            onStatusChange={handleRefresh}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="hook">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="hook">
                        <Zap className="mr-1 h-4 w-4" /> Hook
                      </TabsTrigger>
                      <TabsTrigger value="concept">
                        <BookOpen className="mr-1 h-4 w-4" /> Concept
                      </TabsTrigger>
                      <TabsTrigger value="activity">
                        <Target className="mr-1 h-4 w-4" /> Activity
                      </TabsTrigger>
                      <TabsTrigger value="reflection">
                        <MessageCircle className="mr-1 h-4 w-4" /> Reflection
                      </TabsTrigger>
                      <TabsTrigger value="metadata">
                        <Settings className="mr-1 h-4 w-4" /> Settings
                      </TabsTrigger>
                    </TabsList>

                    {/* Hook Tab */}
                    <TabsContent value="hook" className="space-y-4">
                      <div>
                        <Label>Scenario Type</Label>
                        <Select
                          value={hook.scenarioType}
                          onValueChange={(v) =>
                            setHook({ ...hook, scenarioType: v as ScenarioType })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real_world">
                              Real World
                            </SelectItem>
                            <SelectItem value="case_study">
                              Case Study
                            </SelectItem>
                            <SelectItem value="challenge">Challenge</SelectItem>
                            <SelectItem value="question">Question</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Hook Content (30 seconds)</Label>
                        <Textarea
                          value={hook.content}
                          onChange={(e) =>
                            setHook({ ...hook, content: e.target.value })
                          }
                          placeholder="Write an engaging scenario that captures attention..."
                          rows={4}
                        />
                      </div>
                    </TabsContent>

                    {/* Concept Tab */}
                    <TabsContent value="concept" className="space-y-4">
                      <div>
                        <Label>Main Content (2 minutes)</Label>
                        <Textarea
                          value={concept.content}
                          onChange={(e) =>
                            setConcept({ ...concept, content: e.target.value })
                          }
                          placeholder="Explain the core concept..."
                          rows={6}
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Key Points</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addKeyPoint}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Add
                          </Button>
                        </div>
                        {concept.keyPoints.map((point, idx) => (
                          <div key={idx} className="mb-2 flex gap-2">
                            <Input
                              value={point}
                              onChange={(e) =>
                                updateKeyPoint(idx, e.target.value)
                              }
                              placeholder={`Key point ${idx + 1}`}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeKeyPoint(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Examples</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addExample}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Add
                          </Button>
                        </div>
                        {concept.examples.map((example, idx) => (
                          <Card key={idx} className="mb-2 p-3">
                            <div className="space-y-2">
                              <Input
                                value={example.title}
                                onChange={(e) =>
                                  updateExample(idx, 'title', e.target.value)
                                }
                                placeholder="Example title"
                              />
                              <Textarea
                                value={example.content}
                                onChange={(e) =>
                                  updateExample(idx, 'content', e.target.value)
                                }
                                placeholder="Example content"
                                rows={2}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExample(idx)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" /> Remove
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <ResourceEditor
                        resources={concept.resources || []}
                        onChange={(resources) =>
                          setConcept({ ...concept, resources })
                        }
                      />
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-4">
                      <div>
                        <Label>Activity Engine</Label>
                        <Select
                          value={activity.engineType}
                          onValueChange={(v) =>
                            setActivity({ ...activity, engineType: v as EngineType })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="triage">
                              Triage (Decision Making)
                            </SelectItem>
                            <SelectItem value="red_pen">
                              Red Pen (Error Detection)
                            </SelectItem>
                            <SelectItem value="synthesis">
                              Synthesis (Creation)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Textarea
                          value={activity.instructions}
                          onChange={(e) =>
                            setActivity({
                              ...activity,
                              instructions: e.target.value,
                            })
                          }
                          placeholder="Activity instructions..."
                          rows={4}
                        />
                      </div>
                      <ActivityEditor
                        activity={activity}
                        onChange={setActivity}
                      />
                    </TabsContent>

                    {/* Reflection Tab */}
                    <TabsContent value="reflection" className="space-y-4">
                      <div>
                        <Label>Reflection Prompt (30 seconds)</Label>
                        <Textarea
                          value={reflection.prompt}
                          onChange={(e) =>
                            setReflection({
                              ...reflection,
                              prompt: e.target.value,
                            })
                          }
                          placeholder="What reflection question should learners answer?"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Portfolio Artifact Title</Label>
                        <Input
                          value={reflection.portfolioArtifact.title}
                          onChange={(e) =>
                            setReflection({
                              ...reflection,
                              portfolioArtifact: {
                                ...reflection.portfolioArtifact,
                                title: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g., Completed Signal Detection Analysis"
                        />
                      </div>
                      <div>
                        <Label>Artifact Description</Label>
                        <Textarea
                          value={reflection.portfolioArtifact.description}
                          onChange={(e) =>
                            setReflection({
                              ...reflection,
                              portfolioArtifact: {
                                ...reflection.portfolioArtifact,
                                description: e.target.value,
                              },
                            })
                          }
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Artifact Type</Label>
                        <Select
                          value={reflection.portfolioArtifact.artifactType}
                          onValueChange={(v) =>
                            setReflection({
                              ...reflection,
                              portfolioArtifact: {
                                ...reflection.portfolioArtifact,
                                artifactType: v as ArtifactType,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completion">
                              Completion
                            </SelectItem>
                            <SelectItem value="creation">Creation</SelectItem>
                            <SelectItem value="analysis">Analysis</SelectItem>
                            <SelectItem value="decision_log">
                              Decision Log
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    {/* Metadata Tab */}
                    <TabsContent value="metadata" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estimated Minutes</Label>
                          <Input
                            type="number"
                            value={metadata.estimatedMinutes}
                            onChange={(e) =>
                              setMetadata({
                                ...metadata,
                                estimatedMinutes: parseInt(e.target.value) || 8,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            value={metadata.difficulty}
                            onValueChange={(v) =>
                              setMetadata({ ...metadata, difficulty: v as DifficultyLevel })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="foundational">
                                Foundational
                              </SelectItem>
                              <SelectItem value="intermediate">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Version</Label>
                        <Input
                          value={metadata.version}
                          onChange={(e) =>
                            setMetadata({
                              ...metadata,
                              version: e.target.value,
                            })
                          }
                        />
                      </div>

                      <TagManager
                        tags={metadata.tags}
                        onChange={(tags) => setMetadata({ ...metadata, tags })}
                      />

                      <PrerequisitesSelector
                        prerequisites={metadata.prerequisites}
                        onChange={(prerequisites) =>
                          setMetadata({ ...metadata, prerequisites })
                        }
                        currentDomain={selectedDomain}
                        currentKSBId={selectedKSB?.id}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 flex justify-end gap-2">
                    <PreviewModal
                      ksb={selectedKSB}
                      hook={hook}
                      concept={concept}
                      activity={activity}
                      reflection={reflection}
                      metadata={metadata}
                    />
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Content'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-dim">
                <div className="text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">Select a KSB to edit</p>
                  <p className="text-sm">
                    Choose a domain and KSB from the browser panel
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Research Data Editor Dialog */}
      {selectedKSB && user && (
        <ResearchDataEditor
          ksb={selectedKSB}
          userId={user.uid}
          open={researchEditorOpen}
          onOpenChange={setResearchEditorOpen}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}
