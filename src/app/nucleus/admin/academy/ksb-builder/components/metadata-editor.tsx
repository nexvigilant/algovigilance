'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KSBActivityMetadata } from '@/types/pv-curriculum';
import { TagManager } from './tag-manager';
import { PrerequisitesSelector } from './prerequisites-selector';

type DifficultyLevel = KSBActivityMetadata['difficulty'];

interface MetadataEditorProps {
  metadata: KSBActivityMetadata;
  onChange: (metadata: KSBActivityMetadata) => void;
  currentDomain: string;
  currentKSBId: string | undefined;
}

export function MetadataEditor({
  metadata,
  onChange,
  currentDomain,
  currentKSBId,
}: MetadataEditorProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Estimated Minutes</Label>
          <Input
            type="number"
            value={metadata.estimatedMinutes}
            onChange={(e) =>
              onChange({
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
              onChange({ ...metadata, difficulty: v as DifficultyLevel })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="foundational">Foundational</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Version</Label>
        <Input
          value={metadata.version}
          onChange={(e) => onChange({ ...metadata, version: e.target.value })}
        />
      </div>

      <TagManager
        tags={metadata.tags}
        onChange={(tags) => onChange({ ...metadata, tags })}
      />

      <PrerequisitesSelector
        prerequisites={metadata.prerequisites}
        onChange={(prerequisites) => onChange({ ...metadata, prerequisites })}
        currentDomain={currentDomain}
        currentKSBId={currentKSBId}
      />
    </>
  );
}
