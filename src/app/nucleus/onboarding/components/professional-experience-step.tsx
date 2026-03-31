"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CompleteOnboardingInput } from "@/lib/schemas/firestore";

interface ProfessionalExperienceStepProps {
  register: UseFormRegister<CompleteOnboardingInput>;
  errors: FieldErrors<CompleteOnboardingInput>;
}

export function ProfessionalExperienceStep({
  register,
  errors,
}: ProfessionalExperienceStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="currentEmployer">Current Employer</Label>
        <Input
          id="currentEmployer"
          placeholder="Company or organization name"
          {...register("currentEmployer")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          placeholder="e.g., 5"
          {...register("yearsOfExperience", {
            setValueAs: (v) => {
              if (v === "" || v === null || v === undefined) return undefined;
              const num = Number(v);
              return isNaN(num) ? undefined : num;
            },
          })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedInProfile">LinkedIn Profile</Label>
        <Input
          id="linkedInProfile"
          type="url"
          placeholder="https://linkedin.com/in/yourprofile"
          {...register("linkedInProfile")}
        />
        {errors.linkedInProfile && (
          <p className="text-sm text-destructive">
            {errors.linkedInProfile.message}
          </p>
        )}
      </div>
    </>
  );
}
