'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRightLeft,
  CheckCircle2,
  User,
  FileText,
  Phone,
  Key,
  Brain,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import {
  listTransitions,
  updateTransitionChecklist,
  completeTransition,
  type OfficerTransition,
  type TransitionChecklistItem,
} from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  documents: FileText,
  contacts: Phone,
  access: Key,
  knowledge: Brain,
  financial: DollarSign,
};

const CATEGORY_LABELS: Record<string, string> = {
  documents: 'Documents & Files',
  contacts: 'Key Contacts',
  access: 'Access & Credentials',
  knowledge: 'Institutional Knowledge',
  financial: 'Financial Handoff',
};

function ChecklistSection({
  category,
  items,
  circleId,
  transitionId,
  onUpdate,
}: {
  category: string;
  items: TransitionChecklistItem[];
  circleId: string;
  transitionId: string;
  onUpdate: () => void;
}) {
  const Icon = CATEGORY_ICONS[category] ?? FileText;
  const label = CATEGORY_LABELS[category] ?? category;
  const done = items.filter((i) => i.completed).length;

  const handleToggle = async (itemId: string, currentState: boolean) => {
    const res = await updateTransitionChecklist(circleId, transitionId, itemId, !currentState);
    if (res.success) onUpdate();
  };

  return (
    <div className="mb-4">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
        <Icon className="h-3.5 w-3.5" />
        {label}
        <span className="text-cyan-soft/40">({done}/{items.length})</span>
      </h4>
      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => void handleToggle(item.id, item.completed)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-nex-light/20"
          >
            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
              item.completed ? 'border-emerald-500 bg-emerald-500/20' : 'border-nex-light'
            }`}>
              {item.completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <span className={`text-xs ${item.completed ? 'text-cyan-soft/40 line-through' : 'text-cyan-soft/70'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TransitionCard({
  transition,
  circleId,
  onUpdate,
}: {
  transition: OfficerTransition;
  circleId: string;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [reflectionNotes, setReflectionNotes] = useState(transition.reflection_notes ?? '');
  const [completing, setCompleting] = useState(false);

  const totalItems = transition.checklist.length;
  const completedItems = transition.checklist.filter((c) => c.completed).length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group checklist by category
  const byCategory = new Map<string, TransitionChecklistItem[]>();
  for (const item of transition.checklist) {
    const existing = byCategory.get(item.category) ?? [];
    existing.push(item);
    byCategory.set(item.category, existing);
  }

  const isOutgoing = transition.outgoing_user_id === user?.uid;
  const isIncoming = transition.incoming_user_id === user?.uid;

  const handleComplete = async () => {
    setCompleting(true);
    const res = await completeTransition(circleId, transition.id, reflectionNotes || undefined);
    if (res.success) onUpdate();
    setCompleting(false);
  };

  return (
    <Card className={`border bg-nex-surface ${
      transition.status === 'completed' ? 'border-emerald-500/20' :
      transition.status === 'in_progress' ? 'border-cyan/30' :
      'border-amber-500/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-nex-light/30 p-4">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-cyan" />
          <div>
            <h3 className="text-sm font-semibold text-white">{transition.role_name}</h3>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-cyan-soft/50">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {transition.outgoing_user_name}
              </span>
              <ArrowRightLeft className="h-3 w-3 text-cyan-soft/30" />
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {transition.incoming_user_name ?? 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${
            transition.status === 'completed' ? 'border-emerald-500/30 text-emerald-400' :
            transition.status === 'in_progress' ? 'border-cyan/30 text-cyan' :
            'border-amber-500/30 text-amber-400'
          }`}>
            {transition.status}
          </Badge>
          <span className="text-xs text-cyan-soft/40">{transition.term_year}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-cyan-soft/50">Progress</span>
          <span className="text-cyan-soft/50">{completedItems}/{totalItems} ({progressPct}%)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-nex-light">
          <div
            className="h-full rounded-full bg-cyan transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      {transition.status !== 'completed' && (
        <div className="p-4">
          {[...byCategory.entries()].map(([category, items]) => (
            <ChecklistSection
              key={category}
              category={category}
              items={items}
              circleId={circleId}
              transitionId={transition.id}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* "What I Wish I Knew" Section */}
      {(isOutgoing || isIncoming) && transition.status !== 'completed' && (
        <div className="border-t border-nex-light/30 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
            <MessageSquare className="h-3.5 w-3.5" />
            What I Wish I Knew
          </h4>
          <textarea
            value={reflectionNotes}
            onChange={(e) => setReflectionNotes(e.target.value)}
            placeholder="Share advice, tips, and context for your successor..."
            rows={3}
            className="mb-3 w-full resize-none rounded-md border border-nex-light bg-nex-deep p-2.5 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
          />
        </div>
      )}

      {/* Existing Reflection Notes (if completed) */}
      {transition.reflection_notes && transition.status === 'completed' && (
        <div className="border-t border-nex-light/30 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
            <MessageSquare className="h-3.5 w-3.5" />
            What I Wish I Knew
          </h4>
          <p className="text-sm text-cyan-soft/70 italic">{transition.reflection_notes}</p>
        </div>
      )}

      {/* Key Contacts */}
      {transition.key_contacts.length > 0 && (
        <div className="border-t border-nex-light/30 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
            <Phone className="h-3.5 w-3.5" />
            Key Contacts to Pass Along
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {transition.key_contacts.map((c, i) => (
              <div key={i} className="rounded border border-nex-light/50 p-2 text-xs">
                <p className="font-medium text-white">{c.name}</p>
                <p className="text-cyan-soft/50">{c.role}{c.organization ? ` — ${c.organization}` : ''}</p>
                {c.email && <p className="text-cyan-soft/40">{c.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Button */}
      {(isOutgoing || isIncoming) && transition.status !== 'completed' && completedItems === totalItems && (
        <div className="border-t border-nex-light/30 p-4">
          <Button
            onClick={() => void handleComplete()}
            disabled={completing}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {completing ? 'Completing...' : 'Complete Transition'}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── Main Transitions Tab ──────────────────────

interface TransitionsTabProps {
  circleId: string;
}

export function TransitionsTab({ circleId }: TransitionsTabProps) {
  const [transitions, setTransitions] = useState<OfficerTransition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await listTransitions(circleId);
    if (res.data) setTransitions(res.data);
    setLoading(false);
  }, [circleId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const active = transitions.filter((t) => t.status !== 'completed');
  const completed = transitions.filter((t) => t.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="h-40 animate-pulse border border-nex-light bg-nex-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Active Transitions ({active.length})
          </h3>
          <div className="space-y-4">
            {active.map((t) => <TransitionCard key={t.id} transition={t} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Completed ({completed.length})
          </h3>
          <div className="space-y-4">
            {completed.map((t) => <TransitionCard key={t.id} transition={t} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {transitions.length === 0 && (
        <Card className="border border-nex-light bg-nex-surface p-8 text-center">
          <ArrowRightLeft className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
          <p className="text-cyan-soft/60">No officer transitions in progress.</p>
          <p className="mt-1 text-xs text-cyan-soft/40">
            Start a transition when officers change to preserve institutional knowledge.
          </p>
        </Card>
      )}
    </div>
  );
}
