'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CompleteOnboardingInput } from '@/lib/schemas/firestore';

interface ProfileStepProps {
  register: UseFormRegister<CompleteOnboardingInput>;
  errors: FieldErrors<CompleteOnboardingInput>;
}

export function ProfileStep({ register, errors }: ProfileStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input id="name" placeholder="John Doe" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="professionalTitle">Professional Title</Label>
        <Input
          id="professionalTitle"
          placeholder="e.g., Clinical Pharmacist, Regulatory Affairs Specialist"
          {...register('professionalTitle')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea
          id="bio"
          placeholder="Brief summary of your professional background and interests..."
          rows={4}
          {...register('bio')}
        />
        <p className="text-xs text-slate-dim">Optional - Max 500 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="City, State or Country"
          {...register('location')}
        />
      </div>
    </>
  );
}
