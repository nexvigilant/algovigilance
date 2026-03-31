'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, Bug, Star, Lightbulb, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { BugReportForm } from './bug-report-form';
import { FeedbackForm } from './feedback-form';
import { FeatureRequestForm } from './feature-request-form';
import { SupportMessageForm } from './support-message-form';
import { submitBugReport, submitFeedback, submitFeatureRequest, submitSupportMessage } from '@/app/actions/feedback';
import type {
  FeedbackType,
  BugReportFormData,
  FeedbackFormData,
  FeatureRequestFormData,
} from '@/types/feedback';

type WidgetStep = 'select' | 'bug' | 'feedback' | 'feature' | 'support' | 'success';

const TYPE_OPTIONS: { type: FeedbackType | 'support'; icon: React.ReactNode; label: string; description: string }[] = [
  {
    type: 'bug',
    icon: <Bug className="h-6 w-6" />,
    label: 'Report a Bug',
    description: 'Something not working correctly?',
  },
  {
    type: 'feedback',
    icon: <Star className="h-6 w-6" />,
    label: 'Give Feedback',
    description: 'Share your experience with us',
  },
  {
    type: 'feature_request',
    icon: <Lightbulb className="h-6 w-6" />,
    label: 'Request a Feature',
    description: 'Suggest something new',
  },
  {
    type: 'support',
    icon: <Headphones className="h-6 w-6" />,
    label: 'Contact Support',
    description: 'Get help from our team',
  },
];

const DIALOG_TITLES: Record<WidgetStep, string> = {
  select: 'How can we help?',
  bug: 'Report a Bug',
  feedback: 'Give Feedback',
  feature: 'Request a Feature',
  support: 'Contact Support',
  success: 'Thank You!',
};

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<WidgetStep>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const getMetadata = () => ({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    screenSize:
      typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
    currentPath: pathname,
  });

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setStep('select'), 300);
  }, []);

  const handleBugSubmit = async (data: BugReportFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitBugReport({
        ...data,
        metadata: getMetadata(),
      });
      setStep('success');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to submit bug report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (data: FeedbackFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitFeedback({
        ...data,
        metadata: getMetadata(),
      });
      setStep('success');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureSubmit = async (data: FeatureRequestFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitFeatureRequest({
        ...data,
        metadata: getMetadata(),
      });
      setStep('success');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feature request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportSubmit = async (data: { subject: string; message: string }) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitSupportMessage(data);
      setStep('success');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show widget if user is not authenticated
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="!fixed !bottom-6 !right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
        size="icon"
        aria-label="Open feedback"
        aria-expanded={isOpen}
      >
        <MessageSquarePlus className="h-6 w-6" />
      </Button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLES[step]}</DialogTitle>
            {step === 'select' && (
              <DialogDescription>
                Your feedback helps us improve AlgoVigilance for everyone.
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Type Selection */}
          {step === 'select' && (
            <div className="grid gap-3 py-4">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setStep(option.type === 'feature_request' ? 'feature' : option.type as WidgetStep)}
                  className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="text-primary">{option.icon}</div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-muted-foreground text-sm">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bug Report Form */}
          {step === 'bug' && (
            <BugReportForm
              onSubmit={handleBugSubmit}
              onCancel={() => setStep('select')}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Feedback Form */}
          {step === 'feedback' && (
            <FeedbackForm
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setStep('select')}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Feature Request Form */}
          {step === 'feature' && (
            <FeatureRequestForm
              onSubmit={handleFeatureSubmit}
              onCancel={() => setStep('select')}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Support Message Form */}
          {step === 'support' && (
            <SupportMessageForm
              onSubmit={handleSupportSubmit}
              onCancel={() => setStep('select')}
              isSubmitting={isSubmitting}
              userEmail={user?.email || ''}
            />
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-muted-foreground mb-4">
                We appreciate you taking the time to help us improve. Your submission has been
                recorded and our team will review it.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
