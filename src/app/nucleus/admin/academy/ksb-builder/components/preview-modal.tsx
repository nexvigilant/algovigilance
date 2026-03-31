'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Zap,
  BookOpen,
  Target,
  MessageCircle,
  Clock,
  Tag,
  Link2,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import type {
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  CapabilityComponent,
} from '@/types/pv-curriculum';

interface PreviewModalProps {
  ksb: CapabilityComponent | null;
  hook: KSBHook;
  concept: KSBConcept;
  activity: KSBActivity;
  reflection: KSBReflection;
  metadata: KSBActivityMetadata;
}

export function PreviewModal({
  ksb,
  hook,
  concept,
  activity,
  reflection,
  metadata,
}: PreviewModalProps) {
  if (!ksb) return null;

  const completionScore = calculateCompletionScore(hook, concept, activity, reflection);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview: {ksb.itemName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{ksb.id}</Badge>
              <Badge variant="secondary" className="capitalize">
                {ksb.type}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {metadata.estimatedMinutes} min
              </Badge>
              <Badge variant="outline" className="capitalize">
                {metadata.difficulty}
              </Badge>
              <Badge
                variant={completionScore >= 80 ? 'default' : 'destructive'}
                className="ml-auto"
              >
                {completionScore}% Complete
              </Badge>
            </div>

            <Separator />

            {/* Hook Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Hook (30 seconds)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hook.content ? (
                  <div className="space-y-2">
                    <p className="text-sm">{hook.content}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {hook.scenarioType.replace('_', ' ')}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No hook content defined</p>
                )}
              </CardContent>
            </Card>

            {/* Concept Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Concept (2 minutes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {concept.content ? (
                  <p className="text-sm">{concept.content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No concept content defined</p>
                )}

                {concept.keyPoints.filter(Boolean).length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Key Points:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {concept.keyPoints.filter(Boolean).map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {concept.examples && concept.examples.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Examples:</p>
                    <div className="space-y-2">
                      {concept.examples.map((example, i) => (
                        <div key={i} className="p-2 bg-muted rounded text-sm">
                          <p className="font-medium">{example.title}</p>
                          <p className="text-muted-foreground">{example.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {concept.resources && concept.resources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Resources:</p>
                    <div className="flex flex-wrap gap-2">
                      {concept.resources.map((resource, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {resource.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Activity (5 minutes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {activity.engineType.replace('_', ' ')} Engine
                  </Badge>
                  {activity.timeLimitMinutes && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.timeLimitMinutes} min limit
                    </Badge>
                  )}
                </div>

                {activity.instructions ? (
                  <p className="text-sm">{activity.instructions}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No instructions defined</p>
                )}

                {activity.config && (
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs font-medium mb-1">Configuration:</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.engineType === 'triage' && 'Triage config with decisions'}
                      {activity.engineType === 'red_pen' && 'Red Pen config with errors'}
                      {activity.engineType === 'synthesis' && 'Synthesis config with criteria'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reflection Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                  Reflection (30 seconds)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reflection.prompt ? (
                  <p className="text-sm">{reflection.prompt}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No reflection prompt defined
                  </p>
                )}

                {reflection.portfolioArtifact.title && (
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs font-medium">Portfolio Artifact:</p>
                    <p className="text-sm">{reflection.portfolioArtifact.title}</p>
                    {reflection.portfolioArtifact.description && (
                      <p className="text-xs text-muted-foreground">
                        {reflection.portfolioArtifact.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-500" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Version:</span> {metadata.version}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>{' '}
                    <span className="capitalize">{metadata.difficulty}</span>
                  </div>
                </div>

                {metadata.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Tags:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {metadata.prerequisites.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Prerequisites:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {metadata.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function calculateCompletionScore(
  hook: KSBHook,
  concept: KSBConcept,
  activity: KSBActivity,
  reflection: KSBReflection
): number {
  let score = 0;
  let total = 0;

  // Hook (20%)
  total += 20;
  if (hook.content) score += 20;

  // Concept (30%)
  total += 30;
  if (concept.content) score += 15;
  if (concept.keyPoints.filter(Boolean).length > 0) score += 10;
  if (concept.examples && concept.examples.length > 0) score += 5;

  // Activity (30%)
  total += 30;
  if (activity.instructions) score += 15;
  if (activity.config) score += 15;

  // Reflection (20%)
  total += 20;
  if (reflection.prompt) score += 10;
  if (reflection.portfolioArtifact.title) score += 10;

  return Math.round((score / total) * 100);
}

export default PreviewModal;
