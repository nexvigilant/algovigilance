'use client';

import { useState } from 'react';
import { SectionCard } from './section-card';
import { TagInput } from '@/components/ui/tag-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/actions/users';
import { Building2, Target, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface AffiliationsTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

export function AffiliationsTab({ profile, userId, onProfileUpdate }: AffiliationsTabProps) {
  const { toast } = useToast();
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [specializationError, setSpecializationError] = useState<string | null>(null);

  const organizationAffiliations = profile?.organizationAffiliations || [];
  const specializations = profile?.specializations || [];

  // Organization Affiliations Handlers
  const handleOrganizationsSave = async (newOrganizations: string[]) => {
    setOrganizationError(null);

    try {
      const result = await updateUserProfile(
        userId,
        { organizationAffiliations: newOrganizations }
      );

      if (result.success) {
        toast({
          title: 'Saved',
          description: 'Organization affiliations updated successfully',
        });
        onProfileUpdate();
      } else {
        setOrganizationError(result.message);
      }
    } catch (err) {
      setOrganizationError('Failed to update organization affiliations');
    }
  };

  const handleOrganizationsCancel = () => {
    setOrganizationError(null);
    onProfileUpdate(); // Reload to reset state
  };

  // Specializations Handlers
  const handleSpecializationsSave = async (newSpecializations: string[]) => {
    setSpecializationError(null);

    try {
      const result = await updateUserProfile(
        userId,
        { specializations: newSpecializations }
      );

      if (result.success) {
        toast({
          title: 'Saved',
          description: 'Specializations updated successfully',
        });
        onProfileUpdate();
      } else {
        setSpecializationError(result.message);
      }
    } catch (err) {
      setSpecializationError('Failed to update specializations');
    }
  };

  const handleSpecializationsCancel = () => {
    setSpecializationError(null);
    onProfileUpdate(); // Reload to reset state
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-headline font-bold text-cyan-soft">Affiliations & Specializations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization memberships and areas of professional specialization
        </p>
      </div>

      {/* Organization Affiliations */}
      <SectionCard
        title="Organization Affiliations"
        description="Professional organizations, societies, and associations you belong to"
        onSave={() => handleOrganizationsSave(organizationAffiliations)}
        onCancel={handleOrganizationsCancel}
        editContent={
          <div className="space-y-4">
            {organizationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{organizationError}</AlertDescription>
              </Alert>
            )}
            <TagInput
              tags={organizationAffiliations}
              onTagsChange={handleOrganizationsSave}
              placeholder="e.g., American Society of Health-System Pharmacists (ASHP)"
              addButtonLabel="Add Organization"
            />
            <Alert className="bg-nex-surface border-cyan/20">
              <AlertDescription className="text-xs text-muted-foreground">
                Add professional organizations, pharmacy societies, healthcare associations, or other relevant
                memberships. Press Enter or click Add to save each entry.
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Building2 className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Organizations</p>
              {organizationAffiliations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {organizationAffiliations.map((org, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-nex-surface border border-cyan/30 rounded-md text-white text-sm"
                    >
                      {org}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No organizations added</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Specializations */}
      <SectionCard
        title="Specializations"
        description="Your areas of clinical expertise and professional focus"
        onSave={() => handleSpecializationsSave(specializations)}
        onCancel={handleSpecializationsCancel}
        editContent={
          <div className="space-y-4">
            {specializationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{specializationError}</AlertDescription>
              </Alert>
            )}
            <TagInput
              tags={specializations}
              onTagsChange={handleSpecializationsSave}
              placeholder="e.g., Critical Care, Oncology, Pediatrics"
              addButtonLabel="Add Specialization"
            />
            <Alert className="bg-nex-surface border-cyan/20">
              <AlertDescription className="text-xs text-muted-foreground">
                Add your areas of clinical expertise, therapeutic specialties, or practice focus areas.
                Examples: Critical Care, Oncology, Pediatrics, Infectious Disease, Ambulatory Care, etc.
                Press Enter or click Add to save each entry.
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Target className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Specializations</p>
              {specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-nex-surface border border-cyan/30 rounded-md text-white text-sm"
                    >
                      {spec}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specializations added</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Info Card */}
      <Alert className="bg-nex-surface border-cyan/20">
        <AlertDescription className="text-sm text-muted-foreground">
          <strong className="text-white">Why add affiliations and specializations?</strong>
          <ul className="mt-2 ml-4 space-y-1 list-disc">
            <li>Connect with professionals in your field</li>
            <li>Showcase your expertise and practice areas</li>
            <li>Enhance your profile visibility in relevant searches</li>
            <li>Demonstrate commitment to professional development</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
