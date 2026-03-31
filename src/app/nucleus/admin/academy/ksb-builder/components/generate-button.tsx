'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  generateALOContent,
  getGenerationWarnings,
  validateQualityGates,
  type GenerationWarning,
  type QualityGateResult,
} from '@/lib/actions/ksb-builder';
import { PRODUCTION_THRESHOLDS } from '../constants';
import { useToast } from '@/hooks/use-toast';
import type { CapabilityComponent } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('components/generate-button');

interface GenerateButtonProps {
  ksb: CapabilityComponent;
  userId: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function GenerateButton({
  ksb,
  userId,
  onSuccess,
  disabled,
}: GenerateButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [engineType, setEngineType] = useState<'red_pen' | 'triage' | 'synthesis'>('triage');
  const [warnings, setWarnings] = useState<GenerationWarning[]>([]);
  const [qualityGate, setQualityGate] = useState<QualityGateResult | null>(null);
  const [bypassQualityGates, setBypassQualityGates] = useState(false);
  const [useProductionThresholds, setUseProductionThresholds] = useState(false);
  const { toast } = useToast();

  const canGenerate = ksb.status === 'draft' || ksb.status === 'archived';
  const hasExistingContent = !!(ksb.hook || ksb.concept || ksb.activity || ksb.reflection);

  // Validate when dialog opens or thresholds change
  useEffect(() => {
    if (open) {
      validateKSB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useProductionThresholds]);

  const validateKSB = async () => {
    setValidating(true);
    try {
      const [warningResults, gateResults] = await Promise.all([
        getGenerationWarnings(ksb),
        validateQualityGates(
          ksb,
          useProductionThresholds ? PRODUCTION_THRESHOLDS : undefined
        ),
      ]);
      setWarnings(warningResults);
      setQualityGate(gateResults);
    } catch (error) {
      log.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateALOContent(
        ksb.domainId,
        ksb.id,
        engineType,
        userId,
        {
          bypassQualityGates,
          useProductionThresholds,
        }
      );

      if (result.success) {
        toast({
          title: 'Content Generated',
          description: 'ALO content has been generated and is ready for review.',
        });
        setOpen(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Generation Failed',
          description: result.error || 'Failed to generate content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getWarningIcon = (severity: GenerationWarning['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const canProceed = bypassQualityGates || qualityGate?.passed;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || !canGenerate}
          className="gap-1"
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate ALO Content
          </DialogTitle>
          <DialogDescription>
            Use AI to generate the complete ALO (Atomic Learning Object) content for this KSB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* KSB Info */}
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium text-sm">{ksb.itemName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ksb.itemDescription?.substring(0, 150)}
              {(ksb.itemDescription?.length || 0) > 150 ? '...' : ''}
            </p>
          </div>

          {/* Engine Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Engine Type</label>
            <Select
              value={engineType}
              onValueChange={(v) => setEngineType(v as typeof engineType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="triage">
                  <div className="flex flex-col items-start">
                    <span>Triage</span>
                    <span className="text-xs text-muted-foreground">
                      Rapid decision-making under pressure
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="red_pen">
                  <div className="flex flex-col items-start">
                    <span>Red Pen</span>
                    <span className="text-xs text-muted-foreground">
                      Error detection in documents
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="synthesis">
                  <div className="flex flex-col items-start">
                    <span>Synthesis</span>
                    <span className="text-xs text-muted-foreground">
                      Create work products with AI evaluation
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Gate Status */}
          {validating ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Validating quality gates...</span>
            </div>
          ) : qualityGate && (
            <div className={`p-3 rounded-md border ${
              qualityGate.passed
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {qualityGate.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  qualityGate.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  Quality Gate: {qualityGate.passed ? 'Passed' : 'Failed'}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  Score: {qualityGate.score}%
                </Badge>
              </div>

              {/* Blockers */}
              {qualityGate.blockers.length > 0 && (
                <div className="space-y-1 mt-2">
                  {qualityGate.blockers.map((blocker, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gate Warnings */}
              {qualityGate.warnings.length > 0 && (
                <div className="space-y-1 mt-2">
                  {qualityGate.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-yellow-700">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Warnings</label>
              <div className="space-y-1">
                {warnings.map((warning, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${
                      warning.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : warning.severity === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {getWarningIcon(warning.severity)}
                    <span>{warning.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for existing content */}
          {hasExistingContent && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                This KSB already has content. Generating new content will replace the existing
                content.
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 pt-2 border-t">
            <label className="text-sm font-medium">Generation Options</label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="production"
                checked={useProductionThresholds}
                onCheckedChange={(checked) => setUseProductionThresholds(checked === true)}
              />
              <label
                htmlFor="production"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Use production thresholds (stricter quality requirements)
              </label>
            </div>

            {!qualityGate?.passed && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bypass"
                  checked={bypassQualityGates}
                  onCheckedChange={(checked) => setBypassQualityGates(checked === true)}
                />
                <label
                  htmlFor="bypass"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Bypass quality gates (admin override)
                </label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || validating || !canProceed}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GenerateButton;
