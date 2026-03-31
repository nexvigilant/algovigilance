'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, AlertCircle, Grid3X3, PenLine, Brain, Wrench, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateCourse } from '@/lib/course-builder-api';
import { cn } from '@/lib/utils';
import { getDomainsForSelector, generateCourseParamsFromDomain, type DomainSummary } from './domain-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/generate-form-client');

// Validation schema
const GenerationFormSchema = z.object({
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(200, 'Topic too long'),
  domain: z.enum(['Healthcare', 'Life Sciences', 'Regulatory Affairs']),
  targetAudience: z.string().min(1, 'Target audience required'),
  durationMinutes: z.enum(['15', '30', '45', '60', '90']),
});

type GenerationFormData = z.infer<typeof GenerationFormSchema>;

const DOMAIN_OPTIONS = [
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Life Sciences', label: 'Life Sciences' },
  { value: 'Regulatory Affairs', label: 'Regulatory Affairs' },
];

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

export function GenerateFormClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'custom' | 'domain'>('custom');
  const [pvDomains, setPvDomains] = useState<DomainSummary[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerationFormData>({
    resolver: zodResolver(GenerationFormSchema),
    defaultValues: {
      topic: '',
      domain: 'Healthcare',
      targetAudience: 'Healthcare Professionals',
      durationMinutes: '30',
    },
  });

  const selectedDuration = watch('durationMinutes');

  // Load PV domains when switching to domain mode
  useEffect(() => {
    if (generationMode === 'domain' && pvDomains.length === 0 && !loadingDomains && !domainError) {
      loadPVDomains();
    }
  }, [generationMode, pvDomains.length, loadingDomains, domainError]);

  async function loadPVDomains() {
    try {
      setLoadingDomains(true);
      setDomainError(null);
      const domains = await getDomainsForSelector();
      setPvDomains(domains);
    } catch (err) {
      log.error('Error loading PV domains:', err);
      setDomainError('Failed to load PV domains. Please try again.');
    } finally {
      setLoadingDomains(false);
    }
  }

  // Auto-populate form when domain is selected
  async function handleDomainSelect(domainId: string) {
    setSelectedDomainId(domainId);
    if (!domainId) return;

    try {
      const params = await generateCourseParamsFromDomain(domainId);
      setValue('topic', params.topic);
      setValue('domain', params.domain as GenerationFormData['domain']);
      setValue('targetAudience', params.targetAudience);
      setValue('durationMinutes', String(params.durationMinutes) as GenerationFormData['durationMinutes']);
    } catch (err) {
      log.error('Error generating params from domain:', err);
    }
  }

  const selectedDomainData = pvDomains.find(d => d.id === selectedDomainId);

  async function onSubmit(data: GenerationFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call backend API
      const response = await generateCourse({
        topic: data.topic,
        domain: data.domain,
        target_audience: data.targetAudience,
        duration_minutes: parseInt(data.durationMinutes, 10),
      });

      // Redirect to progress monitoring with job_id and course_id
      router.push(
        `/nucleus/admin/academy/courses/generate?job_id=${response.job_id}&course_id=${response.course_id}&topic=${encodeURIComponent(data.topic)}`
      );
    } catch (err) {
      log.error('Error generating course:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate course. Please try again.'
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2">
          Generate New Capability Pathway
        </h1>
        <p className="text-muted-foreground">
          Instruct our AI research team to build a pharmaceutical capability development pathway.
          Typical generation time: 5-15 minutes.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Card */}
      <Card className="bg-nex-surface border border-nex-light rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            Pathway Configuration
          </CardTitle>
          <CardDescription>
            Define the topic, scope, and target audience for your capability pathway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Generation Mode Tabs */}
            <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as 'custom' | 'domain')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  Custom Topic
                </TabsTrigger>
                <TabsTrigger value="domain" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  From PV Domain
                </TabsTrigger>
              </TabsList>

              {/* Custom Topic Input */}
              <TabsContent value="custom" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">
                    Topic <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="topic"
                    placeholder='E.g., "Pharmacovigilance Signal Detection"'
                    {...register('topic')}
                    disabled={isSubmitting}
                    className={cn(errors.topic && 'border-destructive')}
                  />
                  <p className="text-sm text-muted-foreground">
                    What capability are you building?
                  </p>
                  {errors.topic && (
                    <p className="text-sm text-destructive">{errors.topic.message}</p>
                  )}
                </div>
              </TabsContent>

              {/* PV Domain Selector */}
              <TabsContent value="domain" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="pvDomain">
                    Select PV Domain <span className="text-destructive">*</span>
                  </Label>
                  {loadingDomains ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading PV domains from framework...
                    </div>
                  ) : domainError ? (
                    <div className="py-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {domainError}
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto ml-2"
                            onClick={() => {
                              setDomainError(null);
                              loadPVDomains();
                            }}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : pvDomains.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Initializing...
                    </div>
                  ) : (
                    <Select
                      value={selectedDomainId}
                      onValueChange={handleDomainSelect}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="pvDomain">
                        <SelectValue placeholder="Choose a PV domain..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pvDomains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <span className="font-mono text-xs mr-2">{domain.id}</span>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Generate a comprehensive pathway from an existing PV competency domain
                  </p>
                </div>

                {/* Domain Preview */}
                {selectedDomainData && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{selectedDomainData.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {selectedDomainData.definition}
                          </p>
                        </div>
                        <Badge variant="secondary">{selectedDomainData.totalKSBs} KSBs</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <span>{selectedDomainData.stats.knowledge} Knowledge</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Wrench className="h-4 w-4 text-green-600" />
                          <span>{selectedDomainData.stats.skills} Skills</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-purple-600" />
                          <span>{selectedDomainData.stats.behaviors} Behaviors</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Hidden topic field for domain mode */}
                {generationMode === 'domain' && (
                  <input type="hidden" {...register('topic')} />
                )}
              </TabsContent>
            </Tabs>

            {/* Domain and Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('domain')}
                  onValueChange={(value) =>
                    setValue('domain', value as GenerationFormData['domain'])
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="domain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAIN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.domain && (
                  <p className="text-sm text-destructive">{errors.domain.message}</p>
                )}
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">
                  Target Audience <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('targetAudience')}
                  onValueChange={(value) => setValue('targetAudience', value)}
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
                {errors.targetAudience && (
                  <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                )}
              </div>
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
                    variant={selectedDuration === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('durationMinutes', option.value as GenerationFormData['durationMinutes'])}
                    disabled={isSubmitting}
                    className={cn(
                      selectedDuration === option.value && 'circuit-button'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {errors.durationMinutes && (
                <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>

            {/* Cost Estimate */}
            <Alert className="bg-cyan-500/5 border-cyan-500/20">
              <AlertCircle className="h-4 w-4 text-cyan-500" />
              <AlertDescription className="text-sm">
                <strong>Cost Estimate:</strong> ~$3-5 in AI API costs
                <br />
                <strong>Generation Time:</strong> 5-15 minutes
              </AlertDescription>
            </Alert>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
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
