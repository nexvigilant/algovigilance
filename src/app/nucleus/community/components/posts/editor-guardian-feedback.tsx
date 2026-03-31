'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Lightbulb, X } from 'lucide-react';

interface GuardianGuidance {
  title: string;
  tips: string[];
}

interface EditorGuardianFeedbackProps {
  level: 'low' | 'moderate' | 'high';
  guidance: GuardianGuidance;
  onDismiss: () => void;
}

export function EditorGuardianFeedback({
  level,
  guidance,
  onDismiss,
}: EditorGuardianFeedbackProps) {
  if (level !== 'moderate') return null;

  return (
    <Alert className="border-gold/50 bg-gold/5">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-gold/20 mt-0.5">
          <Shield className="h-4 w-4 text-gold" />
        </div>
        <div className="flex-1">
          <AlertTitle className="text-gold font-semibold flex items-center gap-2">
            {guidance.title}
            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
              Guardian Protocol
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm text-slate-light/80">
              Your post is ready to publish. Here are some suggestions to make it even better:
            </p>
            <ul className="space-y-1.5">
              {guidance.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-dim">
                  <Lightbulb className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-dim/70 mt-3 italic">
              These are suggestions to help you succeed in the community. Your post will still be published.
            </p>
          </AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="mt-2 text-gold/70 hover:text-gold hover:bg-gold/10"
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </div>
    </Alert>
  );
}
