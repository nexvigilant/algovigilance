'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createProject, type CreateProjectRequest } from '@/lib/api/circles-api';

import { COMMUNITY_ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
const log = logger.scope('projects/create/create-project-form');

const PROJECT_TYPES = [
  { value: 'SignalDetection', label: 'Signal Detection' },
  { value: 'CaseSeriesAnalysis', label: 'Case Series Analysis' },
  { value: 'LiteratureReview', label: 'Literature Review' },
  { value: 'RegulatoryIntelligence', label: 'Regulatory Intelligence' },
  { value: 'DrugSafetyProfile', label: 'Drug Safety Profile' },
  { value: 'Custom', label: 'Custom' },
] as const;

const INPUT_CLASS =
  'rounded border border-nex-light bg-nex-deep p-3 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none w-full';

interface Props {
  circleId: string;
}

export function CreateProjectForm({ circleId }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [therapeuticArea, setTherapeuticArea] = useState('');
  const [drugNames, setDrugNames] = useState('');
  const [targetCompletion, setTargetCompletion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to create a project.');
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.');
      return;
    }

    const req: CreateProjectRequest = {
      name: name.trim(),
      description: description.trim(),
      lead_user_id: user.uid,
      created_by: user.uid,
      ...(projectType && { project_type: projectType }),
      ...(therapeuticArea.trim() && { therapeutic_area: therapeuticArea.trim() }),
      ...(drugNames.trim() && {
        drug_names: drugNames
          .split(',')
          .map((d) => d.trim())
          .filter((d) => d.length > 0),
      }),
      ...(targetCompletion && { target_completion: targetCompletion }),
    };

    setIsSubmitting(true);
    try {
      const result = await createProject(circleId, req);
      if (result.success && result.data) {
        router.push(
          COMMUNITY_ROUTES.circleProject(circleId, result.data.id),
        );
      } else {
        setError(result.error ?? 'Failed to create project. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      log.error('Unexpected error creating project', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 font-headline text-3xl font-bold text-white">
          New Research Project
        </h1>
        <p className="text-cyan-soft/60">
          Define a research project for this circle. All members can contribute once it is created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <Card className="border-cyan/30 bg-nex-surface">
          <CardHeader>
            <CardTitle className="text-white">Project Details</CardTitle>
            <CardDescription className="text-cyan-soft/60">
              Required information to identify and classify the project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hepatotoxicity Signal Review — Q1 2026"
                maxLength={120}
                required
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-white">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the objectives, scope, and expected outcomes of this project..."
                rows={4}
                maxLength={1000}
                required
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="project_type" className="mb-1 block text-sm font-medium text-white">
                Project Type
              </label>
              <select
                id="project_type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select a type (optional)</option>
                {PROJECT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Optional Context */}
        <Card className="border-cyan/30 bg-nex-surface">
          <CardHeader>
            <CardTitle className="text-white">Research Context</CardTitle>
            <CardDescription className="text-cyan-soft/60">
              Optional metadata to improve discoverability and tool pre-population.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="therapeutic_area" className="mb-1 block text-sm font-medium text-white">
                Therapeutic Area
              </label>
              <input
                id="therapeutic_area"
                type="text"
                value={therapeuticArea}
                onChange={(e) => setTherapeuticArea(e.target.value)}
                placeholder="e.g., Oncology, Cardiovascular, Neurology"
                maxLength={80}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="drug_names" className="mb-1 block text-sm font-medium text-white">
                Drug Names
              </label>
              <input
                id="drug_names"
                type="text"
                value={drugNames}
                onChange={(e) => setDrugNames(e.target.value)}
                placeholder="Comma-separated, e.g., Atorvastatin, Simvastatin"
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-xs text-cyan-soft/60">
                Separate multiple drug names with commas.
              </p>
            </div>

            <div>
              <label htmlFor="target_completion" className="mb-1 block text-sm font-medium text-white">
                Target Completion Date
              </label>
              <input
                id="target_completion"
                type="date"
                value={targetCompletion}
                onChange={(e) => setTargetCompletion(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inline Error */}
        {error !== null && (
          <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !description.trim()}
            className="flex-1 bg-cyan-dark font-semibold text-white hover:bg-cyan-dark/80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
