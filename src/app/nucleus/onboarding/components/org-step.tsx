'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TherapeuticArea } from '@/lib/actions/tenant';
import type { OrgFormData } from './constants';
import { THERAPEUTIC_AREAS } from './constants';
import { TierSelector } from './tier-selector';

interface OrgStepProps {
  orgData: OrgFormData;
  setOrgData: React.Dispatch<React.SetStateAction<OrgFormData>>;
  onToggleTherapeuticArea: (area: TherapeuticArea) => void;
}

export function OrgStep({
  orgData,
  setOrgData,
  onToggleTherapeuticArea,
}: OrgStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization Name *</Label>
        <Input
          id="orgName"
          placeholder="e.g., Acme Healthcare Corp"
          value={orgData.organizationName}
          onChange={(e) =>
            setOrgData((prev) => ({ ...prev, organizationName: e.target.value }))
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Organization Type *</Label>
        <TierSelector
          selectedTier={orgData.tier}
          onSelect={(tier) => setOrgData((prev) => ({ ...prev, tier }))}
        />
      </div>

      <div className="space-y-3">
        <Label>
          Therapeutic Areas *{' '}
          <span className="text-xs text-slate-dim">(select all that apply)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {THERAPEUTIC_AREAS.map((area) => (
            <button
              key={area.value}
              type="button"
              onClick={() => onToggleTherapeuticArea(area.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-all',
                orgData.therapeuticAreas.includes(area.value)
                  ? 'border-cyan bg-cyan/10 text-cyan'
                  : 'border-nex-light text-slate-dim hover:border-slate-dim'
              )}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orgSize">Organization Size</Label>
          <select
            id="orgSize"
            value={orgData.organizationSize}
            onChange={(e) =>
              setOrgData((prev) => ({ ...prev, organizationSize: e.target.value }))
            }
            className="flex h-10 w-full rounded-md border border-nex-light bg-nex-surface px-3 py-2 text-sm text-slate-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <option value="">Select size...</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1,000 employees</option>
            <option value="1000+">1,000+ employees</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgWebsite">Website</Label>
          <Input
            id="orgWebsite"
            type="url"
            placeholder="https://example.com"
            value={orgData.website}
            onChange={(e) =>
              setOrgData((prev) => ({ ...prev, website: e.target.value }))
            }
          />
        </div>
      </div>
    </>
  );
}
