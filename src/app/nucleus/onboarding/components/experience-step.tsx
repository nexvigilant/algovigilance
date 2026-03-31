'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import type { UseFormRegister, Path } from 'react-hook-form';
import type { CompleteOnboardingInput } from '@/lib/schemas/firestore';

interface ExperienceStepProps {
  register: UseFormRegister<CompleteOnboardingInput>;
  education: NonNullable<CompleteOnboardingInput['education']>;
  credentials: NonNullable<CompleteOnboardingInput['credentials']>;
  onAddEducation: () => void;
  onRemoveEducation: (index: number) => void;
  onAddCredential: () => void;
  onRemoveCredential: (index: number) => void;
}

export function ExperienceStep({
  register,
  education,
  credentials,
  onAddEducation,
  onRemoveEducation,
  onAddCredential,
  onRemoveCredential,
}: ExperienceStepProps) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Education</Label>
          <Button type="button" variant="outline" size="sm" onClick={onAddEducation}>
            <Plus className="h-4 w-4 mr-1" />
            Add Education
          </Button>
        </div>

        {education.map((_, index) => (
          <Card key={index} className="mb-4 p-4 bg-nex-surface border border-nex-light">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium">Education #{index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveEducation(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`education.${index}.institution`}>Institution *</Label>
                <Input
                  id={`education.${index}.institution`}
                  placeholder="University name"
                  {...register(`education.${index}.institution` as Path<CompleteOnboardingInput>)}
                />
              </div>
              <div>
                <Label htmlFor={`education.${index}.degree`}>Degree</Label>
                <Input
                  id={`education.${index}.degree`}
                  placeholder="e.g., PharmD, PhD, BS"
                  {...register(`education.${index}.degree` as Path<CompleteOnboardingInput>)}
                />
              </div>
              <div>
                <Label htmlFor={`education.${index}.fieldOfStudy`}>Field of Study</Label>
                <Input
                  id={`education.${index}.fieldOfStudy`}
                  placeholder="e.g., Pharmacy, Pharmacology"
                  {...register(`education.${index}.fieldOfStudy` as Path<CompleteOnboardingInput>)}
                />
              </div>
              <div>
                <Label htmlFor={`education.${index}.graduationYear`}>Graduation Year</Label>
                <Input
                  id={`education.${index}.graduationYear`}
                  type="number"
                  placeholder="2020"
                  {...register(
                    `education.${index}.graduationYear` as Path<CompleteOnboardingInput>,
                    {
                      setValueAs: (v) => {
                        if (v === '' || v === null || v === undefined) return undefined;
                        const num = Number(v);
                        return isNaN(num) ? undefined : num;
                      },
                    }
                  )}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Credentials & Certifications</Label>
          <Button type="button" variant="outline" size="sm" onClick={onAddCredential}>
            <Plus className="h-4 w-4 mr-1" />
            Add Credential
          </Button>
        </div>

        {credentials.map((_, index) => (
          <Card key={index} className="mb-4 p-4 bg-nex-surface border border-nex-light">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium">Credential #{index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveCredential(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`credentials.${index}.name`}>Credential Name *</Label>
                <Input
                  id={`credentials.${index}.name`}
                  placeholder="e.g., Board Certified Pharmacist"
                  {...register(`credentials.${index}.name` as Path<CompleteOnboardingInput>)}
                />
              </div>
              <div>
                <Label htmlFor={`credentials.${index}.issuingOrganization`}>
                  Issuing Organization
                </Label>
                <Input
                  id={`credentials.${index}.issuingOrganization`}
                  placeholder="e.g., State Board of Pharmacy"
                  {...register(
                    `credentials.${index}.issuingOrganization` as Path<CompleteOnboardingInput>
                  )}
                />
              </div>
              <div>
                <Label htmlFor={`credentials.${index}.issueDate`}>Issue Date</Label>
                <Input
                  id={`credentials.${index}.issueDate`}
                  type="date"
                  {...register(`credentials.${index}.issueDate` as Path<CompleteOnboardingInput>)}
                />
              </div>
              <div>
                <Label htmlFor={`credentials.${index}.credentialId`}>Credential ID</Label>
                <Input
                  id={`credentials.${index}.credentialId`}
                  placeholder="License or certification number"
                  {...register(
                    `credentials.${index}.credentialId` as Path<CompleteOnboardingInput>
                  )}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
