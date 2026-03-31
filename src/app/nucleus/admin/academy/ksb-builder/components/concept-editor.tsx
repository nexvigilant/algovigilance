'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { KSBConcept, KSBExample } from '@/types/pv-curriculum';
import { ResourceEditor } from './resource-editor';

interface ConceptEditorProps {
  concept: KSBConcept;
  onChange: (concept: KSBConcept) => void;
  onAddKeyPoint: () => void;
  onUpdateKeyPoint: (index: number, value: string) => void;
  onRemoveKeyPoint: (index: number) => void;
  onAddExample: () => void;
  onUpdateExample: (index: number, field: keyof KSBExample, value: string) => void;
  onRemoveExample: (index: number) => void;
}

export function ConceptEditor({
  concept,
  onChange,
  onAddKeyPoint,
  onUpdateKeyPoint,
  onRemoveKeyPoint,
  onAddExample,
  onUpdateExample,
  onRemoveExample,
}: ConceptEditorProps) {
  return (
    <>
      <div>
        <Label>Main Content (2 minutes)</Label>
        <Textarea
          value={concept.content}
          onChange={(e) => onChange({ ...concept, content: e.target.value })}
          placeholder="Explain the core concept..."
          rows={6}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Key Points</Label>
          <Button size="sm" variant="outline" onClick={onAddKeyPoint}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {concept.keyPoints.map((point, idx) => (
          <div key={idx} className="mb-2 flex gap-2">
            <Input
              value={point}
              onChange={(e) => onUpdateKeyPoint(idx, e.target.value)}
              placeholder={`Key point ${idx + 1}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemoveKeyPoint(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Examples</Label>
          <Button size="sm" variant="outline" onClick={onAddExample}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {concept.examples.map((example, idx) => (
          <Card key={idx} className="mb-2 p-3">
            <div className="space-y-2">
              <Input
                value={example.title}
                onChange={(e) => onUpdateExample(idx, 'title', e.target.value)}
                placeholder="Example title"
              />
              <Textarea
                value={example.content}
                onChange={(e) =>
                  onUpdateExample(idx, 'content', e.target.value)
                }
                placeholder="Example content"
                rows={2}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveExample(idx)}
              >
                <Trash2 className="mr-1 h-3 w-3" /> Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ResourceEditor
        resources={concept.resources || []}
        onChange={(resources) => onChange({ ...concept, resources })}
      />
    </>
  );
}
