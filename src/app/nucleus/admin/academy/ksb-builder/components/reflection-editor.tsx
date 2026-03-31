'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KSBReflection, PortfolioArtifactConfig } from '@/types/pv-curriculum';

type ArtifactType = PortfolioArtifactConfig['artifactType'];

interface ReflectionEditorProps {
  reflection: KSBReflection;
  onChange: (reflection: KSBReflection) => void;
}

export function ReflectionEditor({ reflection, onChange }: ReflectionEditorProps) {
  return (
    <>
      <div>
        <Label>Reflection Prompt (30 seconds)</Label>
        <Textarea
          value={reflection.prompt}
          onChange={(e) =>
            onChange({ ...reflection, prompt: e.target.value })
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
            onChange({
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
            onChange({
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
            onChange({
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
            <SelectItem value="completion">Completion</SelectItem>
            <SelectItem value="creation">Creation</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="decision_log">Decision Log</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
