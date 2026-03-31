'use client';

/**
 * Service Discovery Wizard - Email Capture Modal
 *
 * Captures user email to send personalized recommendations as an informal proposal.
 */

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WizardRecommendations, WizardBranch } from '@/types/service-wizard';
import { serviceInfo } from '@/data/service-outcomes';

interface EmailCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: WizardRecommendations;
  branch: WizardBranch;
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  email: string;
  companyName: string;
}

interface FormErrors {
  firstName?: string;
  email?: string;
}

export function EmailCaptureModal({
  open,
  onOpenChange,
  recommendations,
  branch,
  onSuccess,
}: EmailCaptureModalProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    email: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the email payload
      const primaryInfo = serviceInfo[recommendations.primary.category];
      const secondaryData = recommendations.secondary.map((rec) => {
        const info = serviceInfo[rec.category];
        return {
          title: info.title,
          tagline: info.tagline,
          outcomes: rec.outcomes.slice(0, 2),
          detailUrl: info.detailLink || '',
        };
      });

      const payload = {
        firstName: formData.firstName.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName.trim() || undefined,
        situationSummary: recommendations.situationSummary,
        branch: branch || 'exploration',
        primary: {
          title: primaryInfo.title,
          tagline: primaryInfo.tagline,
          outcomes: recommendations.primary.outcomes,
          deliverables: primaryInfo.deliverables,
          detailUrl: primaryInfo.detailLink || '',
        },
        secondary: secondaryData,
      };

      const response = await fetch('/api/wizard-brochure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      // Success
      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({ firstName: '', email: '', companyName: '' });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-nex-surface border-nex-light">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan" />
            Send Me This Info
          </DialogTitle>
          <DialogDescription className="text-slate-dim">
            We'll email you a summary of your personalized recommendations—no spam, no follow-up
            calls unless you ask.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} method="POST" className="space-y-4 mt-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-slate-light">
              First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Your first name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              className={cn(
                'bg-nex-dark border-nex-light text-white placeholder:text-slate-dim',
                errors.firstName && 'border-red-400'
              )}
              disabled={isSubmitting}
              autoComplete="given-name"
              maxLength={50}
            />
            {errors.firstName && (
              <p className="text-sm text-red-400">{errors.firstName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-light">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange('email')}
              className={cn(
                'bg-nex-dark border-nex-light text-white placeholder:text-slate-dim',
                errors.email && 'border-red-400'
              )}
              disabled={isSubmitting}
              autoComplete="email"
              maxLength={254}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Company Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-light">
              Company <span className="text-slate-dim">(optional)</span>
            </Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Your company name"
              value={formData.companyName}
              onChange={handleChange('companyName')}
              className="bg-nex-dark border-nex-light text-white placeholder:text-slate-dim"
              disabled={isSubmitting}
              autoComplete="organization"
              maxLength={100}
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-cyan hover:bg-cyan-glow text-nex-deep font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send My Recommendations
              </>
            )}
          </Button>

          <p className="text-xs text-slate-dim text-center">
            Your information is never shared. Read our{' '}
            <a href="/privacy" className="text-cyan hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
