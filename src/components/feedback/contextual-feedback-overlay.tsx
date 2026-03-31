'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Coins, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  awardVigilCoins,
  getVigilWalletSummary,
  submitContextualFeedbackVote,
  type VigilWalletSummary,
} from '@/app/actions/vigil-feedback';
import {
  VIGIL_ACTION_COSTS,
  VIGIL_ACTION_LABELS,
  type VigilActivityType,
  type VigilFeatureAction,
} from '@/lib/vigil-coins';

type OverlayTarget = {
  id: string;
  label: string;
  top: number;
  left: number;
};

type SelectedTarget = {
  id: string;
  label: string;
};

const TARGET_SELECTOR = [
  'main [data-feedback-target]',
  'main [data-vigil-feature]',
  'main section',
  'main article',
  'main [class*="card"]',
].join(', ');

const INTERACTION_AWARD_INTERVAL_MS = 45_000;

function safeTargetId(element: Element, index: number): string {
  const explicitId =
    element.getAttribute('data-feedback-target') ||
    element.getAttribute('data-vigil-feature') ||
    element.getAttribute('id');

  if (explicitId) {
    return explicitId;
  }

  return `feature-${index + 1}`;
}

function findLabel(element: Element): string {
  const explicitLabel =
    element.getAttribute('data-feedback-label') ||
    element.getAttribute('aria-label') ||
    element.getAttribute('id');
  if (explicitLabel) {
    return explicitLabel;
  }

  const heading = element.querySelector('h1, h2, h3, h4');
  if (heading?.textContent?.trim()) {
    return heading.textContent.trim().slice(0, 80);
  }

  const text = element.textContent?.trim().replace(/\s+/g, ' ') || '';
  return text ? text.slice(0, 60) : 'Untitled feature';
}

function getVisibleTargets(): OverlayTarget[] {
  const elements = Array.from(document.querySelectorAll(TARGET_SELECTOR));
  const seen = new Set<string>();
  const targets: OverlayTarget[] = [];

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    const rect = element.getBoundingClientRect();

    if (rect.width < 180 || rect.height < 72) {
      continue;
    }
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      continue;
    }

    const id = safeTargetId(element, i);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    targets.push({
      id,
      label: findLabel(element),
      top: Math.max(8, Math.round(rect.top + 8)),
      left: Math.max(8, Math.round(rect.left + 8)),
    });

    if (targets.length >= 120) {
      break;
    }
  }

  return targets;
}

export function ContextualFeedbackOverlay() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const [targets, setTargets] = useState<OverlayTarget[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [wallet, setWallet] = useState<VigilWalletSummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<VigilFeatureAction>('fix_feature');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastInteractionAwardRef = useRef(0);

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      return;
    }

    const result = await getVigilWalletSummary({
      userId: user.uid,
      userEmail: user.email || undefined,
    });

    if (result.success && result.wallet) {
      setWallet(result.wallet);
    }
  }, [user]);

  const updateTargets = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setTargets(getVisibleTargets());
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    void refreshWallet();
  }, [refreshWallet, user, pathname]);

  useEffect(() => {
    updateTargets();
    window.addEventListener('scroll', updateTargets, { passive: true });
    window.addEventListener('resize', updateTargets, { passive: true });

    const observer = new MutationObserver(() => updateTargets());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-feedback-target', 'data-vigil-feature'],
    });

    return () => {
      window.removeEventListener('scroll', updateTargets);
      window.removeEventListener('resize', updateTargets);
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTargets, pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const award = async (activityType: VigilActivityType, source: string) => {
      const result = await awardVigilCoins({
        userId: user.uid,
        userEmail: user.email || undefined,
        activityType,
        source,
      });
      if (result.success && result.wallet) {
        setWallet(result.wallet);
      }
    };

    const onInteraction = () => {
      const now = Date.now();
      if (now - lastInteractionAwardRef.current < INTERACTION_AWARD_INTERVAL_MS) {
        return;
      }
      lastInteractionAwardRef.current = now;
      void award('interaction', 'global_interaction');
    };

    const onActivity = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: VigilActivityType; source?: string }>;
      const activityType = customEvent.detail?.type;
      if (!activityType) {
        return;
      }
      void award(activityType, customEvent.detail?.source || 'custom_event');
    };

    document.addEventListener('click', onInteraction, { passive: true });
    window.addEventListener('vigil:activity', onActivity as EventListener);

    return () => {
      document.removeEventListener('click', onInteraction);
      window.removeEventListener('vigil:activity', onActivity as EventListener);
    };
  }, [user]);

  const actionCost = useMemo(() => VIGIL_ACTION_COSTS[selectedAction], [selectedAction]);
  const canAffordAction = (wallet?.balance || 0) >= actionCost;

  const openForTarget = (target: OverlayTarget) => {
    setSelectedTarget({ id: target.id, label: target.label });
    setSelectedAction('fix_feature');
    setComment('');
    setOpen(true);
  };

  const onSubmit = async () => {
    if (!user || !selectedTarget) {
      return;
    }

    const trimmed = comment.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({
        title: 'Comment required',
        description: 'Please provide a comment between 1 and 100 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const result = await submitContextualFeedbackVote({
      userId: user.uid,
      userEmail: user.email || undefined,
      featureId: selectedTarget.id,
      featureLabel: selectedTarget.label,
      currentPath: pathname,
      action: selectedAction,
      comment: trimmed,
    });
    setSubmitting(false);

    if (!result.success) {
      toast({
        title: 'Submission failed',
        description: result.error || 'Unable to submit feedback right now.',
        variant: 'destructive',
      });
      return;
    }

    if (result.wallet) {
      setWallet(result.wallet);
    }

    toast({
      title: 'Feedback submitted',
      description: `${VIGIL_ACTION_LABELS[selectedAction]} saved for "${selectedTarget.label}".`,
    });
    setOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[70]">
        {targets.map((target) => (
          <button
            key={`${target.id}-${target.top}-${target.left}`}
            type="button"
            aria-label={`Feedback for ${target.label}`}
            title={`Feedback: ${target.label}`}
            onClick={() => openForTarget(target)}
            className="pointer-events-auto absolute flex h-6 min-h-6 items-center gap-1 rounded-full border border-cyan/60 bg-nex-deep/85 px-2 text-[10px] font-semibold uppercase tracking-wider text-cyan shadow-lg backdrop-blur-sm transition hover:bg-cyan/20"
            style={{ top: target.top, left: target.left }}
          >
            <MessageSquarePlus className="h-3 w-3" />
            <span>Feedback</span>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>Feature Feedback</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-1 text-xs text-cyan">
                <Coins className="h-3 w-3" />
                {wallet?.balance ?? 0}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedTarget ? `Target: ${selectedTarget.label}` : 'Select how this feature should evolve.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VIGIL_ACTION_COSTS) as VigilFeatureAction[]).map((action) => {
                const cost = VIGIL_ACTION_COSTS[action];
                const selected = selectedAction === action;
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setSelectedAction(action)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? 'border-cyan bg-cyan/20 text-cyan'
                        : 'border-border bg-background hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{VIGIL_ACTION_LABELS[action]}</div>
                    <div className="text-xs text-muted-foreground">{cost} VC</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label htmlFor="contextual-comment" className="text-sm font-medium">
                Comment (max 100 chars)
              </label>
              <textarea
                id="contextual-comment"
                value={comment}
                maxLength={100}
                onChange={(event) => setComment(event.target.value)}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="What should happen with this feature?"
              />
              <div className="text-right text-xs text-muted-foreground">{comment.length}/100</div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Daily allowance: {wallet?.dailyAllowance ?? 0} VC. Earn more by interactions, upvotes,
              comments, posts, tool usage, research, and development actions.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={submitting || !canAffordAction || comment.trim().length === 0}
              >
                {submitting
                  ? 'Submitting...'
                  : canAffordAction
                    ? `Spend ${actionCost} VC`
                    : `Need ${actionCost} VC`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
