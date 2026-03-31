import { AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SignalStrength, SignalValidationStatus } from '@/types/intelligence';

interface SignalDisclaimerProps {
  signalStrength: SignalStrength;
  validationStatus: SignalValidationStatus;
  impactAreas: string[];
  className?: string;
}

const STRENGTH_CONFIG: Record<SignalStrength, { label: string; color: string; bgColor: string }> = {
  emerging: {
    label: 'Emerging Signal',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  developing: {
    label: 'Developing Signal',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  confirmed: {
    label: 'Confirmed Signal',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

const STATUS_CONFIG: Record<SignalValidationStatus, { label: string; description: string }> = {
  detected: {
    label: 'Detected',
    description: 'This signal has been identified but has not yet undergone expert validation.',
  },
  under_review: {
    label: 'Under Review',
    description: 'This signal is currently being evaluated by our safety review team.',
  },
  validated: {
    label: 'Validated',
    description: 'This signal has been confirmed through expert review and additional analysis.',
  },
};

export function SignalDisclaimer({
  signalStrength,
  validationStatus,
  impactAreas,
  className,
}: SignalDisclaimerProps) {
  const strength = STRENGTH_CONFIG[signalStrength];
  const status = STATUS_CONFIG[validationStatus];

  return (
    <div className={cn('mt-8 space-y-4', className)}>
      {/* Signal Status Badge */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg w-fit', strength.bgColor)}>
        <AlertTriangle className={cn('h-4 w-4', strength.color)} />
        <span className={cn('text-sm font-medium', strength.color)}>
          {strength.label} • {status.label}
        </span>
      </div>

      {/* Disclaimer Box */}
      <div className="border border-nex-light rounded-lg p-4 bg-nex-surface/30">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-slate-dim flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-slate-dim leading-relaxed">
              <strong className="text-slate-light">Signal Classification Notice:</strong>{' '}
              Like pharmacovigilance safety signals, industry signals require
              professional validation before action. {status.description} This content
              represents early findings that may require additional review
              before organizational decision-making.
            </p>
            {impactAreas.length > 0 && (
              <p className="text-sm text-slate-dim">
                <strong className="text-slate-light">Potential Impact Areas:</strong>{' '}
                {impactAreas.join(' • ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="border border-cyan/20 rounded-lg p-4 bg-cyan/5">
        <h4 className="font-semibold text-white mb-2">
          Does this signal impact you or your organization?
        </h4>
        <p className="text-sm text-slate-dim mb-4">
          Our safety experts can help you validate this signal's
          relevance to your context, assess potential impact, and plan
          next steps.
        </p>
        <Link
          href="/contact?ref=signal-validation"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
        >
          Request Signal Validation Consultation
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function SignalBadge({
  signalStrength,
  validationStatus,
  className,
}: {
  signalStrength: SignalStrength;
  validationStatus: SignalValidationStatus;
  className?: string;
}) {
  const strength = STRENGTH_CONFIG[signalStrength];
  const status = STATUS_CONFIG[validationStatus];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          strength.bgColor,
          strength.color
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        {strength.label}
      </span>
      <span className="text-xs text-slate-dim">•</span>
      <span className="text-xs text-slate-dim">{status.label}</span>
    </div>
  );
}
