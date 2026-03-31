'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Grid3X3, Target, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateCourse } from '@/lib/course-builder-api';
import { cn } from '@/lib/utils';
import type { SelectedItem } from './framework-item-selector';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/framework-config-form');

interface FrameworkConfigFormProps {
  selectedItem: SelectedItem;
  onBack: () => void;
}

const AUDIENCE_OPTIONS = [
  { value: 'PharmD/RPh', label: 'PharmD/RPh (Pharmacists)' },
  { value: 'MD/DO', label: 'MD/DO (Physicians)' },
  { value: 'RN/NP', label: 'RN/NP (Nurses)' },
  { value: 'Allied Health', label: 'Allied Health Professionals' },
  { value: 'Healthcare Professionals', label: 'Healthcare Professionals (General)' },
  { value: 'Industry Professionals', label: 'Pharmaceutical Industry Professionals' },
];

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
];

export function FrameworkConfigForm({ selectedItem, onBack }: FrameworkConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - pre-populated from selected item
  const [topic, setTopic] = useState(selectedItem.name);
  const [targetAudience, setTargetAudience] = useState('Healthcare Professionals');
  const [duration, setDuration] = useState('45');

  // Get icon based on type
  const getTypeIcon = () => {
    switch (selectedItem.type) {
      case 'domain': return Grid3X3;
      case 'epa': return Target;
      case 'cpa': return ClipboardList;
    }
  };

  const TypeIcon = getTypeIcon();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await generateCourse({
        topic,
        domain: 'Life Sciences', // Always Life Sciences for PV framework
        target_audience: targetAudience,
        duration_minutes: parseInt(duration, 10),
      });

      // Redirect to progress monitoring
      router.push(
        `/nucleus/admin/academy/courses/generate?job_id=${response.job_id}&course_id=${response.course_id}&topic=${encodeURIComponent(topic)}`
      );
    } catch (err) {
      log.error('Error generating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate course');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Selection
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2">
          Configure Pathway Generation
        </h1>
        <p className="text-muted-foreground">
          Review and customize the generation parameters for your capability pathway.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Item Summary */}
      <Card className="mb-6 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-lg',
              selectedItem.type === 'domain' && 'bg-blue-500/10',
              selectedItem.type === 'epa' && 'bg-purple-500/10',
              selectedItem.type === 'cpa' && 'bg-orange-500/10',
            )}>
              <TypeIcon className={cn(
                'h-6 w-6',
                selectedItem.type === 'domain' && 'text-blue-600',
                selectedItem.type === 'epa' && 'text-purple-600',
                selectedItem.type === 'cpa' && 'text-orange-600',
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono">
                  {selectedItem.id}
                </Badge>
                <Badge variant="secondary">
                  {selectedItem.type.toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {selectedItem.description}
              </p>
              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedItem.metadata.ksbCount && (
                  <Badge variant="outline" className="text-xs">
                    {selectedItem.metadata.ksbCount} KSBs
                  </Badge>
                )}
                {selectedItem.metadata.primaryDomains && (
                  <Badge variant="outline" className="text-xs">
                    {selectedItem.metadata.primaryDomains.length} Primary Domains
                  </Badge>
                )}
                {selectedItem.metadata.keyEPAs && (
                  <Badge variant="outline" className="text-xs">
                    {selectedItem.metadata.keyEPAs.length} Key EPAs
                  </Badge>
                )}
                {selectedItem.metadata.careerStage && (
                  <Badge variant="outline" className="text-xs">
                    {selectedItem.metadata.careerStage}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className="bg-nex-surface border border-nex-light rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            Pathway Parameters
          </CardTitle>
          <CardDescription>
            Customize the generation settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">
                Pathway Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter pathway title"
              />
              <p className="text-xs text-muted-foreground">
                Pre-populated from {selectedItem.type}. Customize as needed.
              </p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience">
                Target Audience <span className="text-destructive">*</span>
              </Label>
              <Select
                value={targetAudience}
                onValueChange={setTargetAudience}
                disabled={isSubmitting}
              >
                <SelectTrigger id="targetAudience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>
                Estimated Practice Time <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={duration === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDuration(option.value)}
                    disabled={isSubmitting}
                    className={cn(duration === option.value && 'circuit-button')}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cost Estimate */}
            <Alert className="bg-cyan-500/5 border-cyan-500/20">
              <AlertCircle className="h-4 w-4 text-cyan-500" />
              <AlertDescription className="text-sm">
                <strong>Estimated Cost:</strong> ~$3-5 in AI API costs
                <br />
                <strong>Generation Time:</strong> 5-15 minutes
              </AlertDescription>
            </Alert>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !topic.trim()}
                className="circuit-button min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Capability Pathway
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
