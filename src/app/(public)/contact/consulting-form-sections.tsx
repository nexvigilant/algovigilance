'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CONSULTING_COMPANY_TYPES,
  COMPANY_SIZE_LABELS,
  CONSULTING_CATEGORY_LABELS,
  FUNCTIONAL_AREA_LABELS,
  CONSULTING_TIMELINE_LABELS,
} from '@/data/contact-forms';
import type { ConsultingInquiryFormData } from './actions';

interface SectionProps {
  formData: Partial<ConsultingInquiryFormData>;
  onFieldChange: (field: keyof ConsultingInquiryFormData, value: string) => void;
  errors: Record<string, string>;
  isPending: boolean;
}

// ---------------------------------------------------------------------------
// ContactInfoSection
// ---------------------------------------------------------------------------

export function ContactInfoSection({ formData, onFieldChange, errors, isPending }: SectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-light">Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-slate-light">
            First Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={(e) => onFieldChange('firstName', e.target.value)}
            className="bg-nex-dark border-nex-border text-white"
            placeholder="Jane"
            autoComplete="given-name"
            maxLength={50}
            disabled={isPending}
            required
            aria-required="true"
            aria-invalid={errors.firstName ? 'true' : undefined}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          />
          {errors.firstName && (
            <p id="firstName-error" role="alert" className="text-xs text-red-400">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-slate-light">
            Last Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={(e) => onFieldChange('lastName', e.target.value)}
            className="bg-nex-dark border-nex-border text-white"
            placeholder="Smith"
            autoComplete="family-name"
            maxLength={50}
            disabled={isPending}
            required
            aria-required="true"
            aria-invalid={errors.lastName ? 'true' : undefined}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          />
          {errors.lastName && (
            <p id="lastName-error" role="alert" className="text-xs text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-light">
            Work Email <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className="bg-nex-dark border-nex-border text-white"
            placeholder="jane.smith@company.com"
            autoComplete="email"
            maxLength={254}
            disabled={isPending}
            required
            aria-required="true"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-red-400">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-slate-light">
            Job Title
          </Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => onFieldChange('jobTitle', e.target.value)}
            className="bg-nex-dark border-nex-border text-white"
            placeholder="VP of Pharmacovigilance"
            autoComplete="organization-title"
            maxLength={100}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompanyInfoSection
// ---------------------------------------------------------------------------

export function CompanyInfoSection({ formData, onFieldChange, errors, isPending }: SectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-light">Company Information</h4>
      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-slate-light">
          Company Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={(e) => onFieldChange('companyName', e.target.value)}
          className="bg-nex-dark border-nex-border text-white"
          placeholder="Acme Pharmaceuticals"
          autoComplete="organization"
          maxLength={100}
          disabled={isPending}
          required
          aria-required="true"
          aria-invalid={errors.companyName ? 'true' : undefined}
          aria-describedby={errors.companyName ? 'companyName-error' : undefined}
        />
        {errors.companyName && (
          <p id="companyName-error" role="alert" className="text-xs text-red-400">{errors.companyName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyType" className="text-slate-light">
            Company Type <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.companyType}
            onValueChange={(value) =>
              onFieldChange('companyType', value)
            }
            disabled={isPending}
            required
          >
            <SelectTrigger
              id="companyType"
              className="bg-nex-dark border-nex-border text-white"
              aria-required="true"
              aria-invalid={errors.companyType ? 'true' : undefined}
              aria-describedby={errors.companyType ? 'companyType-error' : undefined}
            >
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent className="bg-nex-surface border-nex-border">
              {Object.entries(CONSULTING_COMPANY_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-nex-light">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companyType && (
            <p id="companyType-error" role="alert" className="text-xs text-red-400">{errors.companyType}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize" className="text-slate-light">
            Company Size <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.companySize}
            onValueChange={(value) =>
              onFieldChange('companySize', value)
            }
            disabled={isPending}
            required
          >
            <SelectTrigger
              id="companySize"
              className="bg-nex-dark border-nex-border text-white"
              aria-required="true"
              aria-invalid={errors.companySize ? 'true' : undefined}
              aria-describedby={errors.companySize ? 'companySize-error' : undefined}
            >
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent className="bg-nex-surface border-nex-border">
              {Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-nex-light">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && (
            <p id="companySize-error" role="alert" className="text-xs text-red-400">{errors.companySize}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailsSection
// ---------------------------------------------------------------------------

export function ProjectDetailsSection({ formData, onFieldChange, errors, isPending }: SectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-light">Project Details</h4>
      <div className="space-y-2">
        <Label htmlFor="consultingCategory" className="text-slate-light">
          Consulting Service <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.consultingCategory}
          onValueChange={(value) =>
            onFieldChange('consultingCategory', value)
          }
          disabled={isPending}
          required
        >
          <SelectTrigger
            id="consultingCategory"
            className="bg-nex-dark border-nex-border text-white"
            aria-required="true"
            aria-invalid={errors.consultingCategory ? 'true' : undefined}
            aria-describedby={errors.consultingCategory ? 'consultingCategory-error' : undefined}
          >
            <SelectValue placeholder="Select consulting service" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {Object.entries(CONSULTING_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-white hover:bg-nex-light">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.consultingCategory && (
          <p id="consultingCategory-error" role="alert" className="text-xs text-red-400">{errors.consultingCategory}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="functionalArea" className="text-slate-light">
          Functional Area
        </Label>
        <Select
          value={formData.functionalArea}
          onValueChange={(value) =>
            onFieldChange('functionalArea', value)
          }
          disabled={isPending}
        >
          <SelectTrigger id="functionalArea" className="bg-nex-dark border-nex-border text-white">
            <SelectValue placeholder="Select functional area (optional)" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {Object.entries(FUNCTIONAL_AREA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-white hover:bg-nex-light">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-dim">
          We consult across functional areas. Current specialties include Pharmacovigilance, Algorithmovigilance, Business Development &amp; Operations, and Safety Strategy &amp; Intelligence.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline" className="text-slate-light">
          Project Timeline <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.timeline}
          onValueChange={(value) =>
            onFieldChange('timeline', value)
          }
          disabled={isPending}
          required
        >
          <SelectTrigger
            id="timeline"
            className="bg-nex-dark border-nex-border text-white"
            aria-required="true"
            aria-invalid={errors.timeline ? 'true' : undefined}
            aria-describedby={errors.timeline ? 'timeline-error' : undefined}
          >
            <SelectValue placeholder="Select timeline" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {Object.entries(CONSULTING_TIMELINE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-white hover:bg-nex-light">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timeline && (
          <p id="timeline-error" role="alert" className="text-xs text-red-400">{errors.timeline}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="challengeDescription" className="text-slate-light">
          Chief Complaint <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="challengeDescription"
          name="challengeDescription"
          value={formData.challengeDescription}
          onChange={(e) => onFieldChange('challengeDescription', e.target.value)}
          className="bg-nex-dark border-nex-border text-white min-h-[120px]"
          placeholder="What's the primary issue bringing you to us? Describe the symptoms—we'll work together to diagnose root causes and define success."
          maxLength={5000}
          disabled={isPending}
          required
          aria-required="true"
          aria-invalid={errors.challengeDescription ? 'true' : undefined}
          aria-describedby={errors.challengeDescription ? 'challengeDescription-error' : undefined}
        />
        {errors.challengeDescription && (
          <p id="challengeDescription-error" role="alert" className="text-xs text-red-400">{errors.challengeDescription}</p>
        )}
      </div>
    </div>
  );
}
