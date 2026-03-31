'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { checkTenantStatus } from '@/lib/actions/tenant';
import {
  getProgram,
  updateProgram,
  STAGE_INFO,
  type ProgramRecord,
  type ProgramStage,
  type ProgramStatus,
} from '@/lib/actions/programs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  FlaskConical,
  Shield,
  Activity,
  Target,
  Dna,
  Calendar,
  AlertCircle,
  Pause,
  Play,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { STAGE_COLORS } from './components/constants';
import { StagePipelineDetailed } from './components/stage-pipeline-detailed';
import { InfoRow } from './components/info-row';
import { SignalDetectionCard } from './components/signal-detection-card';
const log = logger.scope('organization/programs/[id]');

// ============================================================================
// Main Component
// ============================================================================

export default function ProgramDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const programId = params.id as string;

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadProgram = useCallback(async () => {
    if (!user) return;

    try {
      const status = await checkTenantStatus(user.uid);
      if (!status.hasTenant || !status.tenantId) {
        setError('No organization found');
        setLoading(false);
        return;
      }

      setTenantId(status.tenantId);
      const result = await getProgram(status.tenantId, programId);

      if (result.success && result.program) {
        setProgram(result.program);
      } else {
        setError(result.error || 'Program not found');
      }
    } catch (err) {
      log.error('Failed to load program', err);
      setError('Failed to load program');
    } finally {
      setLoading(false);
    }
  }, [user, programId]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  async function handleStageChange(stage: ProgramStage) {
    if (!tenantId || !program || stage === program.currentStage) return;

    setUpdating(true);
    const result = await updateProgram(tenantId, programId, { currentStage: stage });
    if (result.success) {
      setProgram({ ...program, currentStage: stage });
    } else {
      setError(result.error || 'Failed to update stage');
    }
    setUpdating(false);
  }

  async function handleStatusChange(status: ProgramStatus) {
    if (!tenantId || !program) return;

    setUpdating(true);
    const result = await updateProgram(tenantId, programId, { status });
    if (result.success) {
      setProgram({ ...program, status });
    } else {
      setError(result.error || 'Failed to update status');
    }
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
            <p className="text-slate-dim">Loading program...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Program not found'}</AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Link href="/nucleus/organization">
            <Button variant="outline" size="sm" className="border-nex-light text-slate-dim">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Organization
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stageColors = STAGE_COLORS[program.currentStage];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Back Nav */}
      <Link href="/nucleus/organization" className="inline-flex items-center gap-1 text-sm text-slate-dim hover:text-slate-light mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Organization
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className={cn('h-6 w-6', stageColors.text)} />
            <h1 className="text-2xl font-bold font-headline text-slate-light">{program.codeName}</h1>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
              stageColors.bg, stageColors.border, stageColors.text
            )}>
              {STAGE_INFO[program.currentStage].label}
            </span>
          </div>
          {program.description && (
            <p className="text-sm text-slate-dim mt-1">{program.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {program.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('paused')}
              disabled={updating}
              className="border-nex-light text-slate-dim hover:text-amber-400 hover:border-amber-500/30"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {program.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="border-nex-light text-slate-dim hover:text-emerald-400 hover:border-emerald-500/30"
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          {(program.status === 'active' || program.status === 'paused') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('archived')}
              disabled={updating}
              className="border-nex-light text-slate-dim hover:text-slate-400"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Stage Pipeline */}
      <Card className="bg-nex-surface border-nex-light mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-light text-sm">Development Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <StagePipelineDetailed
            currentStage={program.currentStage}
            onAdvance={handleStageChange}
          />
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Signal Detection Card */}
          <SignalDetectionCard
            tenantId={tenantId || ''}
            programId={programId}
            userId={user?.uid || ''}
            targetName={program.targetName}
            codeName={program.codeName}
          />

          {/* Activity Timeline Placeholder */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Activity</CardTitle>
              <CardDescription className="text-slate-dim">
                Recent events and changes for this program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-nex-dark/50">
                  <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', stageColors.dot)} />
                  <div>
                    <p className="text-sm text-slate-light">Program created</p>
                    <p className="text-xs text-slate-dim">
                      Stage: {STAGE_INFO[program.currentStage].label} | {program.therapeuticArea.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Program Info */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Target} label="Target" value={program.targetName} />
              {program.targetGene && (
                <InfoRow icon={Dna} label="Gene" value={program.targetGene} />
              )}
              <InfoRow icon={FlaskConical} label="Therapeutic Area" value={program.therapeuticArea.replace('_', ' ')} />
              <InfoRow icon={Activity} label="Status" value={program.status} />
              <InfoRow icon={Calendar} label="Stage" value={STAGE_INFO[program.currentStage].label} />

              {program.budgetTotal !== undefined && program.budgetTotal > 0 && (
                <div className="pt-3 mt-3 border-t border-nex-light">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-dim">Budget</span>
                    <span className="text-slate-light">
                      ${program.budgetSpent.toLocaleString()} / ${program.budgetTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stage Change */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Advance Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={program.currentStage}
                onValueChange={(v) => handleStageChange(v as ProgramStage)}
                disabled={updating}
              >
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  {Object.entries(STAGE_INFO).map(([value, info]) => (
                    <SelectItem key={value} value={value} className="text-slate-light">
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/nucleus/vigilance?program=${program.codeName}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-cyan/5 transition-colors text-sm text-slate-dim hover:text-cyan"
              >
                <Shield className="h-4 w-4" />
                Signal Detection
              </Link>
              <Link
                href="/nucleus/organization"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-cyan/5 transition-colors text-sm text-slate-dim hover:text-cyan"
              >
                <FlaskConical className="h-4 w-4" />
                All Programs
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

