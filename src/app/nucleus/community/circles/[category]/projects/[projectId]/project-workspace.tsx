'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Microscope, Database, BookOpen, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react';
import {
  type Project, type Deliverable, type ToolResultResponse, type CircleMember,
  getProject, listDeliverables, listMembers, advanceStage,
  createDeliverable, updateDeliverable, reviewDeliverable,
  runSignalDetection, runFaersQuery, runLiteratureSearch,
} from '@/lib/api/circles-api';
import { useAuth } from '@/hooks/use-auth';
import { TabErrorBoundary } from '@/app/nucleus/community/components/tab-error-boundary';

interface ProjectWorkspaceProps { circleId: string; projectId: string; }

const STAGE_ORDER = ['Initiate','Design','Execute','Analyze','Report','Review','Publish','Closed'];
const DELIVERABLE_TYPES = ['Report','Dataset','ToolOutput','Analysis','Presentation','Protocol','Other'];
const REVIEW_STATUSES = ['Approved','Rejected','RevisionRequested'];
const REVIEW_ICONS: Record<string, typeof CheckCircle2> = {
  Approved: CheckCircle2, Pending: Clock, Rejected: XCircle, RevisionRequested: Clock,
};

function FullStagePipeline({ stage }: { stage: string }) {
  const activeIdx = STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {STAGE_ORDER.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${i < activeIdx ? 'bg-emerald-500/20 text-emerald-400' : i === activeIdx ? 'bg-cyan/20 text-cyan border border-cyan/30' : 'bg-nex-light/50 text-cyan-soft/40'}`}>
            {i < activeIdx && <CheckCircle2 className="h-3 w-3" />}{s}
          </div>
          {i < STAGE_ORDER.length - 1 && <div className="h-px w-4 bg-nex-light" />}
        </div>
      ))}
    </div>
  );
}

function ToolResultPanel({ result, circleId, projectId, userId, onSaved }: {
  result: ToolResultResponse; circleId: string; projectId: string; userId: string; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await createDeliverable(circleId, projectId, { name: `Tool Result: ${result.tool_name}`, deliverable_type: 'ToolOutput', created_by: userId });
    onSaved();
    setSaving(false);
  };
  return (
    <div className="mt-3 border border-cyan/30 bg-nex-deep rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white">{result.tool_name}</span>
        <Badge variant="outline" className={`text-xs ${result.success ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
          {result.success ? 'Success' : 'Failed'}
        </Badge>
      </div>
      <pre className="bg-nex-deep rounded p-3 text-xs font-mono text-cyan-soft/80 overflow-auto max-h-64 border border-nex-light">
        {JSON.stringify(result.result, null, 2)}
      </pre>
      <Button size="sm" disabled={saving} onClick={() => void handleSave()} className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80">
        {saving ? 'Saving...' : 'Save as Deliverable'}
      </Button>
    </div>
  );
}

function DeliverableCard({ deliverable, circleId, projectId, userId, onUpdate, canReview }: {
  deliverable: Deliverable; circleId: string; projectId: string; userId: string; onUpdate: () => void; canReview: boolean;
}) {
  const ReviewIcon = REVIEW_ICONS[deliverable.review_status] ?? Clock;
  const [showReview, setShowReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const canSubmit = deliverable.status === 'Draft' || deliverable.status === 'RevisionNeeded';
  const showReviewButton = deliverable.status === 'InReview' && canReview;

  const handleSubmitForReview = async () => {
    setBusy(true);
    await updateDeliverable(circleId, projectId, deliverable.id, { status: 'InReview' });
    onUpdate(); setBusy(false);
  };
  const handleReview = async () => {
    setBusy(true);
    await reviewDeliverable(circleId, projectId, deliverable.id, { reviewed_by: userId, review_status: reviewStatus, review_notes: reviewNotes });
    setShowReview(false); onUpdate(); setBusy(false);
  };

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-soft/50" />
            <h3 className="font-medium text-white">{deliverable.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-cyan-soft/50">
            <span>{deliverable.deliverable_type}</span><span>v{deliverable.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${deliverable.status === 'Approved' || deliverable.status === 'Published' ? 'border-emerald-500/30 text-emerald-400' : deliverable.status === 'InReview' ? 'border-nex-gold-500/30 text-nex-gold-400' : 'border-nex-light text-cyan-soft/50'}`}>
            {deliverable.status}
          </Badge>
          <ReviewIcon className={`h-4 w-4 ${deliverable.review_status === 'Approved' ? 'text-emerald-400' : deliverable.review_status === 'Rejected' ? 'text-red-400' : 'text-cyan-soft/40'}`} />
        </div>
      </div>
      {(canSubmit || showReviewButton) && (
        <div className="mt-3 flex gap-2">
          {canSubmit && <Button size="sm" disabled={busy} onClick={() => void handleSubmitForReview()} className="bg-cyan-dark text-white hover:bg-cyan-dark/80">Submit for Review</Button>}
          {showReviewButton && <Button size="sm" variant="outline" onClick={() => setShowReview((v) => !v)} className="border-nex-light text-cyan-soft/70 hover:text-white">{showReview ? 'Cancel' : 'Review'}</Button>}
        </div>
      )}
      {showReview && (
        <div className="mt-3 space-y-2 border border-nex-light rounded p-3 bg-nex-deep">
          <div>
            <label className="mb-1 block text-xs text-white">Review Status</label>
            <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="w-full rounded border border-nex-light bg-nex-deep px-2 py-1.5 text-xs text-white">
              {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white">Notes</label>
            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Optional review notes..." className="w-full rounded border border-nex-light bg-nex-deep px-2 py-1.5 text-xs text-white placeholder:text-cyan-soft/30 resize-none" />
          </div>
          <Button size="sm" disabled={busy} onClick={() => void handleReview()} className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80">
            {busy ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function ProjectWorkspace({ circleId, projectId }: ProjectWorkspaceProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolRunning, setToolRunning] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, ToolResultResponse>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Report');
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [projRes, delRes, memRes] = await Promise.all([
        getProject(circleId, projectId),
        listDeliverables(circleId, projectId),
        listMembers(circleId),
      ]);
      if (projRes.data) setProject(projRes.data);
      if (delRes.data) setDeliverables(delRes.data);
      if (memRes.data) setMembers(memRes.data);
    } catch {
      setLoadError('Failed to load project data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [circleId, projectId]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const currentMember = members.find((m) => m.user_id === user?.uid);
  const canReview = currentMember?.role ? ['Founder', 'Lead', 'Reviewer'].includes(currentMember.role) : false;
  const canAdvance = canReview;

  const handleAdvanceStage = async () => {
    if (!user?.uid) return;
    const res = await advanceStage(circleId, projectId, { advanced_by: user.uid });
    if (res.success) {
      setFeedback({ message: 'Stage advanced successfully', type: 'success' });
      void loadData();
    } else {
      setFeedback({ message: 'Operation failed', type: 'error' });
    }
  };

  const buildToolRequest = (tool: 'signal' | 'faers' | 'literature', uid: string) => {
    if (tool === 'signal') return runSignalDetection(circleId, projectId, { drug_count: 100, event_count: 50, drug_event_count: 10, total_count: 10000, user_id: uid });
    if (tool === 'faers') return runFaersQuery(circleId, projectId, { query: project?.drug_names[0] ?? 'aspirin', limit: 25, user_id: uid });
    return runLiteratureSearch(circleId, projectId, { query: project?.name ?? 'pharmacovigilance', limit: 10, user_id: uid });
  };

  const handleRunTool = async (tool: 'signal' | 'faers' | 'literature') => {
    if (!user?.uid) return;
    setToolRunning(tool);
    const res = await buildToolRequest(tool, user.uid);
    if (res?.success && res.data) {
      setToolResults((prev) => ({ ...prev, [tool]: res.data as ToolResultResponse }));
      setFeedback({ message: 'Tool completed — results below', type: 'success' });
      void loadData();
    } else {
      setFeedback({ message: 'Operation failed', type: 'error' });
    }
    setToolRunning(null);
  };

  const handleCreateDeliverable = async () => {
    if (!user?.uid || !newName.trim()) return;
    setCreating(true);
    await createDeliverable(circleId, projectId, { name: newName.trim(), deliverable_type: newType, created_by: user.uid });
    setNewName(''); setNewType('Report'); setShowCreateForm(false);
    setFeedback({ message: 'Deliverable created', type: 'success' });
    void loadData(); setCreating(false);
  };

  if (loading) return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
    </div>
  );

  if (loadError) return (
    <Card className="border border-red-500/30 bg-nex-surface p-8 text-center">
      <p className="text-red-400">{loadError}</p>
      <button onClick={() => void loadData()} className="mt-4 rounded bg-cyan/20 px-4 py-2 text-cyan hover:bg-cyan/30">Retry</button>
    </Card>
  );

  if (!project) return (
    <Card className="border border-cyan/30 bg-nex-surface p-8 text-center">
      <p className="text-cyan-soft/70">Project not found.</p>
    </Card>
  );

  const uid = user?.uid ?? '';

  return (
    <div>
      <div className="mb-6 border border-cyan/30 bg-nex-surface p-6">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="mb-1 font-headline text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-sm text-cyan-soft/60">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan/30 text-cyan-soft/70">{project.project_type}</Badge>
            <Badge variant="outline" className={project.status === 'Active' ? 'border-emerald-500/30 text-emerald-400' : 'border-nex-light text-cyan-soft/50'}>{project.status}</Badge>
          </div>
        </div>
        <FullStagePipeline stage={project.stage} />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-cyan-soft/40">
          {project.therapeutic_area && <span>Area: {project.therapeutic_area}</span>}
          {project.drug_names.length > 0 && <span>Drugs: {project.drug_names.join(', ')}</span>}
          {project.target_completion && <span>Target: {new Date(project.target_completion).toLocaleDateString()}</span>}
        </div>
      </div>

      <Tabs defaultValue="deliverables" className="w-full">
        {feedback && (
          <div className={`mb-4 rounded p-3 text-sm ${
            feedback.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border border-red-500/30 bg-red-500/10 text-red-400'
          }`}>
            {feedback.message}
          </div>
        )}
        <TabsList className="mb-4 w-full justify-start border-b border-nex-light bg-transparent">
          <TabsTrigger value="deliverables" className="data-[state=active]:border-b-2 data-[state=active]:border-cyan">Deliverables ({deliverables.length})</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:border-b-2 data-[state=active]:border-cyan">Tools</TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:border-b-2 data-[state=active]:border-cyan">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="deliverables" className="space-y-3">
          <TabErrorBoundary>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreateForm((v) => !v)} className="bg-cyan-dark text-white hover:bg-cyan-dark/80">
              <Plus className="mr-1 h-3.5 w-3.5" />{showCreateForm ? 'Cancel' : 'New Deliverable'}
            </Button>
          </div>
          {showCreateForm && (
            <Card className="border border-cyan/30 bg-nex-surface p-4 space-y-3">
              <h3 className="text-sm font-medium text-white">Create Deliverable</h3>
              <div>
                <label className="mb-1 block text-xs text-white">Name <span className="text-red-400">*</span></label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Deliverable name" className="w-full rounded border border-nex-light bg-nex-deep px-3 py-1.5 text-sm text-white placeholder:text-cyan-soft/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white">Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full rounded border border-nex-light bg-nex-deep px-3 py-1.5 text-sm text-white">
                  {DELIVERABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Button size="sm" disabled={creating || !newName.trim()} onClick={() => void handleCreateDeliverable()} className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80">
                {creating ? 'Creating...' : 'Create Deliverable'}
              </Button>
            </Card>
          )}
          {deliverables.length === 0 ? (
            <Card className="border border-nex-light bg-nex-surface p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
              <p className="text-cyan-soft/60">No deliverables yet. Run a tool or create one manually.</p>
            </Card>
          ) : deliverables.map((d) => (
            <DeliverableCard key={d.id} deliverable={d} circleId={circleId} projectId={projectId} userId={uid} onUpdate={() => void loadData()} canReview={canReview} />
          ))}
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="tools" className="space-y-3">
          <TabErrorBoundary>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              { key: 'signal' as const, icon: <Microscope className="mb-3 h-8 w-8 text-cyan" />, label: 'Signal Detection', desc: 'Run PRR/ROR/IC/EBGM analysis on drug-event combinations.', running: 'Running...', idle: 'Run Analysis' },
              { key: 'faers' as const, icon: <Database className="mb-3 h-8 w-8 text-nex-gold-400" />, label: 'FAERS Query', desc: 'Search FDA Adverse Event Reporting System data.', running: 'Querying...', idle: 'Query FAERS' },
              { key: 'literature' as const, icon: <BookOpen className="mb-3 h-8 w-8 text-emerald-400" />, label: 'Literature Search', desc: 'Search regulatory guidelines and literature.', running: 'Searching...', idle: 'Search Literature' },
            ]).map(({ key, icon, label, desc, running, idle }) => (
              <Card key={key} className="border border-nex-light bg-nex-surface p-5">
                {icon}
                <h3 className="mb-1 font-medium text-white">{label}</h3>
                <p className="mb-3 text-xs text-cyan-soft/60">{desc}</p>
                <Button size="sm" disabled={toolRunning !== null} onClick={() => void handleRunTool(key)} className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80">
                  {toolRunning === key ? running : idle}
                </Button>
                {toolResults[key] && (
                  <ToolResultPanel result={toolResults[key]} circleId={circleId} projectId={projectId} userId={uid} onSaved={() => void loadData()} />
                )}
              </Card>
            ))}
          </div>
          <p className="text-xs text-cyan-soft/40">Tool results are automatically saved as project deliverables.</p>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="actions" className="space-y-3">
          <TabErrorBoundary>
          <Card className="border border-nex-light bg-nex-surface p-5">
            <h3 className="mb-2 font-medium text-white">Advance Stage</h3>
            <p className="mb-3 text-sm text-cyan-soft/60">
              Move the project from <strong className="text-cyan">{project.stage}</strong> to the next stage. Requires Reviewer role or above.
            </p>
            {canAdvance ? (
              <Button size="sm" onClick={() => void handleAdvanceStage()} disabled={project.stage === 'Closed'} className="bg-cyan-dark text-white hover:bg-cyan-dark/80">
                Advance to {STAGE_ORDER[STAGE_ORDER.indexOf(project.stage) + 1] ?? 'N/A'}
              </Button>
            ) : (
              <p className="text-xs text-cyan-soft/40">You need Founder, Lead, or Reviewer role to advance the stage.</p>
            )}
          </Card>
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
