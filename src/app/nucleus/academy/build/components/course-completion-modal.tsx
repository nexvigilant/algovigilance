'use client';

import { Award, Home, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Certificate, Course } from '@/types/academy';

interface CourseCompletionModalProps {
  isOpen: boolean;
  course: Course;
  certificate: Certificate | null;
  onClose: () => void;
  onReturnHome: () => void;
}

export function CourseCompletionModal({
  isOpen,
  course,
  certificate,
  onClose,
  onReturnHome,
}: CourseCompletionModalProps) {
  const certificateUrl = certificate?.verificationUrl || '';

  // LinkedIn share URL
  const linkedInShareUrl = certificateUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`
    : '';

  const handleViewCertificate = () => {
    if (certificate) {
      window.open(`/verify/certificate/${certificate.id}`, '_blank');
    }
  };

  const handleShareLinkedIn = () => {
    if (linkedInShareUrl) {
      window.open(linkedInShareUrl, '_blank', 'width=600,height=600');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-cyan/10 flex items-center justify-center">
              <Award className="h-8 w-8 text-cyan" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            You've successfully completed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Course Title */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground">
              {course.modules.length} modules • {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
            </p>
          </div>

          {/* Certificate Info */}
          {certificate && (
            <div className="bg-muted/30 rounded-lg p-4 border">
              <p className="text-xs text-muted-foreground mb-1">Certificate Number</p>
              <p className="font-mono text-sm font-semibold">{certificate.certificateNumber}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {certificate && (
              <>
                <Button
                  onClick={handleViewCertificate}
                  className="w-full"
                  variant="default"
                >
                  <Award className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>

                <Button
                  onClick={handleShareLinkedIn}
                  className="w-full"
                  variant="outline"
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Share on LinkedIn
                </Button>
              </>
            )}

            <Button
              onClick={onReturnHome}
              className="w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Academy
            </Button>
          </div>

          {/* What's Next */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Your certificate has been added to your{' '}
              <a href="/nucleus/academy/dashboard" className="text-cyan hover:underline">
                Academy Dashboard
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
