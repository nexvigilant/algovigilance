'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface ReviewStepProps {
  organizationAffiliations: string[];
  specializations: string[];
  showAffiliationInput: boolean;
  affiliationInput: string;
  onAffiliationInputChange: (value: string) => void;
  onAddAffiliation: () => void;
  onSaveAffiliation: () => void;
  onRemoveAffiliation: (index: number) => void;
  onCancelAffiliation: () => void;
  showSpecializationInput: boolean;
  specializationInput: string;
  onSpecializationInputChange: (value: string) => void;
  onAddSpecialization: () => void;
  onSaveSpecialization: () => void;
  onRemoveSpecialization: (index: number) => void;
  onCancelSpecialization: () => void;
}

export function ReviewStep({
  organizationAffiliations,
  specializations,
  showAffiliationInput,
  affiliationInput,
  onAffiliationInputChange,
  onAddAffiliation,
  onSaveAffiliation,
  onRemoveAffiliation,
  onCancelAffiliation,
  showSpecializationInput,
  specializationInput,
  onSpecializationInputChange,
  onAddSpecialization,
  onSaveSpecialization,
  onRemoveSpecialization,
  onCancelSpecialization,
}: ReviewStepProps) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Organization Affiliations</Label>
          {!showAffiliationInput && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddAffiliation}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Affiliation
            </Button>
          )}
        </div>

        {showAffiliationInput && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter organization name"
              value={affiliationInput}
              onChange={(e) => onAffiliationInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSaveAffiliation();
                }
                if (e.key === 'Escape') {
                  onCancelAffiliation();
                }
              }}
              autoFocus
            />
            <Button type="button" size="sm" onClick={onSaveAffiliation}>
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelAffiliation}
            >
              Cancel
            </Button>
          </div>
        )}

        {organizationAffiliations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {organizationAffiliations.map((affiliation, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
              >
                <span className="text-sm">{affiliation}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAffiliation(index)}
                  className="text-slate-dim hover:text-slate-light"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-dim">
          e.g., Professional associations, alumni groups, etc.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Areas of Specialization</Label>
          {!showSpecializationInput && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSpecialization}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Specialization
            </Button>
          )}
        </div>

        {showSpecializationInput && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter specialization"
              value={specializationInput}
              onChange={(e) => onSpecializationInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSaveSpecialization();
                }
                if (e.key === 'Escape') {
                  onCancelSpecialization();
                }
              }}
              autoFocus
            />
            <Button type="button" size="sm" onClick={onSaveSpecialization}>
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelSpecialization}
            >
              Cancel
            </Button>
          </div>
        )}

        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {specializations.map((spec, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
              >
                <span className="text-sm">{spec}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSpecialization(index)}
                  className="text-slate-dim hover:text-slate-light"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-dim">
          e.g., Clinical Pharmacy, Regulatory Affairs, Pharmacovigilance
        </p>
      </div>
    </>
  );
}
