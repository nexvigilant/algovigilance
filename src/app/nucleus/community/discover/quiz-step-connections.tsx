'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  PROFESSIONAL_ORGANIZATIONS,
  GREEK_ORGANIZATIONS,
} from '@/lib/constants/organizations';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

const ALL_ORGANIZATIONS = [...PROFESSIONAL_ORGANIZATIONS, ...GREEK_ORGANIZATIONS];

interface QuizStepConnectionsProps {
  formData: EnhancedQuizData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuizData>>;
  customAffiliation: string;
  setCustomAffiliation: (value: string) => void;
  toggleArraySelection: <K extends keyof EnhancedQuizData>(field: K, value: string) => void;
}

export function QuizStepConnections({
  formData,
  setFormData,
  customAffiliation,
  setCustomAffiliation,
  toggleArraySelection,
}: QuizStepConnectionsProps) {
  function addCustomAffiliation() {
    if (customAffiliation.trim()) {
      setFormData((prev) => ({
        ...prev,
        customAffiliations: [...prev.customAffiliations, customAffiliation.trim()],
      }));
      setCustomAffiliation('');
    }
  }

  function removeCustomAffiliation(affiliation: string) {
    setFormData((prev) => ({
      ...prev,
      customAffiliations: prev.customAffiliations.filter((a) => a !== affiliation),
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-white font-medium mb-3">
          Professional Organizations
        </h4>
        <p className="text-sm text-cyan-soft/60 mb-3">
          Select any organizations you are a member of
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {ALL_ORGANIZATIONS.slice(0, 18).map((org) => {
            const isSelected = formData.organizations.includes(org.id);
            return (
              <button
                key={org.id}
                onClick={() => toggleArraySelection('organizations', org.id)}
                className={cn(
                  'rounded border-2 p-2 text-xs text-left transition-all relative',
                  isSelected
                    ? 'border-cyan bg-cyan/20 text-cyan-soft'
                    : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                )}
                title={org.name}
              >
                {isSelected && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                <span className="line-clamp-2">{org.acronym || org.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-white font-medium mb-2">Custom Affiliations</h4>
        <p className="text-sm text-cyan-soft/60 mb-2">
          Add other organizations, alumni networks, or groups
        </p>
        <div className="flex gap-2">
          <Input
            value={customAffiliation}
            onChange={(e) => setCustomAffiliation(e.target.value)}
            placeholder="Enter organization name"
            className="border-cyan/30 bg-nex-light text-white placeholder:text-cyan-soft/40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomAffiliation();
              }
            }}
          />
          <Button
            onClick={addCustomAffiliation}
            variant="outline"
            className="border-cyan/30 text-cyan-soft"
          >
            Add
          </Button>
        </div>
        {formData.customAffiliations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.customAffiliations.map((aff) => (
              <span
                key={aff}
                className="inline-flex items-center gap-1 rounded-full bg-cyan/20 px-3 py-1 text-sm text-cyan-soft"
              >
                {aff}
                <button
                  onClick={() => removeCustomAffiliation(aff)}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
