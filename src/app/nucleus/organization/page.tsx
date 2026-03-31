'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTenant, checkTenantStatus, TIER_LIMITS, type TenantRecord } from '@/lib/actions/tenant';
import {
  listPrograms,
  getProgramCount,
  type ProgramRecord,
} from '@/lib/actions/programs';
import {
  revokeInvitation,
  listMembers,
  listPendingInvitations,
  type MemberRecord,
  type InvitationRecord,
} from '@/lib/actions/invitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  BarChart3,
  FlaskConical,
  Settings,
  Activity,
  Shield,
  AlertCircle,
  Mail,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { TierBadge } from './components/tier-badge';
import { StatCard } from './components/stat-card';
import { QuickAction } from './components/quick-action';
import { ProgramCard } from './components/program-card';
import { CreateProgramDialog } from './components/create-program-dialog';
import { InviteDialog } from './components/invite-dialog';

const log = logger.scope('organization/page');

// ============================================================================
// Main Component
// ============================================================================

export default function OrganizationPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationRecord[]>([]);
  const [programStats, setProgramStats] = useState({ total: 0, active: 0, limit: 3 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const status = await checkTenantStatus(user.uid);

      if (!status.hasTenant || !status.tenantId) {
        setLoading(false);
        return;
      }

      const tenantData = await getTenant(status.tenantId);
      if (tenantData) {
        setTenant(tenantData);

        // Load all data in parallel
        const [programsResult, counts, membersResult, invitationsResult] = await Promise.all([
          listPrograms(status.tenantId),
          getProgramCount(status.tenantId),
          listMembers(status.tenantId),
          listPendingInvitations(status.tenantId),
        ]);

        if (programsResult.success && programsResult.programs) {
          setPrograms(programsResult.programs);
        }
        setProgramStats(counts);
        if (membersResult.success && membersResult.members) {
          setMembers(membersResult.members);
        }
        if (invitationsResult.success && invitationsResult.invitations) {
          setPendingInvitations(invitationsResult.invitations);
        }
      }
    } catch (err) {
      log.error('Failed to load organization data', err);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleProgramCreated() {
    loadData();
  }

  function handleInviteSent() {
    loadData();
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!tenant) return;
    await revokeInvitation(tenant.id, invitationId);
    loadData();
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
            <p className="text-slate-dim">Loading organization...</p>
          </div>
        </div>
      </div>
    );
  }

  // No tenant state
  if (!tenant) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="bg-nex-surface border-nex-light max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-dim mb-4" />
            <h2 className="text-xl font-bold mb-2 text-slate-light">No Organization Found</h2>
            <p className="text-slate-dim mb-6">
              Set up your research organization to start building pharmacovigilance programs.
            </p>
            <Link href="/nucleus/onboarding">
              <Button className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent">
                Set Up Organization
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tenant dashboard
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-headline text-gold">{tenant.organizationName}</h1>
            <TierBadge tier={tenant.tier} />
          </div>
          <p className="text-slate-dim">
            {tenant.therapeuticAreas.map(a => a.replace('_', ' ')).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/nucleus/organization/analytics">
            <Button variant="outline" size="sm" className="border-nex-light text-slate-dim hover:text-slate-light">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </Link>
          <Link href="/nucleus/organization/settings">
            <Button variant="outline" size="sm" className="border-nex-light text-slate-dim hover:text-slate-light">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FlaskConical}
          label="Programs"
          value={`${programStats.active} / ${programStats.limit}`}
          subtext={`${programStats.total} total`}
        />
        <StatCard
          icon={Users}
          label="Team Members"
          value={tenant.memberCount}
          subtext={`${tenant.tier} tier`}
        />
        <StatCard
          icon={BarChart3}
          label="API Calls"
          value="0"
          subtext="this month"
        />
        <StatCard
          icon={Activity}
          label="Status"
          value={tenant.status}
          subtext="organization status"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Programs Section (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-light">Programs</CardTitle>
                  <CardDescription className="text-slate-dim">
                    {programStats.active} active of {programStats.limit} allowed
                  </CardDescription>
                </div>
                <CreateProgramDialog
                  tenantId={tenant.id}
                  userId={user?.uid || ''}
                  onCreated={handleProgramCreated}
                  programLimit={programStats.limit}
                  programCount={programStats.active}
                />
              </div>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-nex-light rounded-lg">
                  <FlaskConical className="mx-auto h-8 w-8 text-slate-dim mb-3" />
                  <p className="text-slate-dim mb-1">No programs yet</p>
                  <p className="text-xs text-slate-dim mb-4">
                    Create your first pharmacovigilance program to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {programs.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Section */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-light">Team</CardTitle>
                  <CardDescription className="text-slate-dim">
                    {members.length} member{members.length !== 1 ? 's' : ''}{pendingInvitations.length > 0 ? `, ${pendingInvitations.length} pending` : ''}
                  </CardDescription>
                </div>
                <InviteDialog
                  tenantId={tenant.id}
                  userId={user?.uid || ''}
                  userEmail={user?.email || ''}
                  onInvited={handleInviteSent}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Members */}
              {members.map((member) => {
                const isOwner = member.role === 'owner';
                const roleColors: Record<string, string> = {
                  owner: 'text-gold',
                  admin: 'text-purple-400',
                  scientist: 'text-cyan',
                  viewer: 'text-slate-dim',
                };
                return (
                  <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-nex-dark">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center',
                        isOwner ? 'bg-cyan/20' : 'bg-nex-surface'
                      )}>
                        {isOwner ? (
                          <Shield className="h-4 w-4 text-cyan" />
                        ) : (
                          <Users className="h-4 w-4 text-slate-dim" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-light">
                          {member.displayName || member.email}
                        </p>
                        <p className="text-xs text-slate-dim">{member.email}</p>
                      </div>
                    </div>
                    <span className={cn('text-xs font-medium capitalize', roleColors[member.role] || 'text-slate-dim')}>
                      {member.role}
                    </span>
                  </div>
                );
              })}

              {/* If no members loaded yet, show owner from user context */}
              {members.length === 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-nex-dark">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-light">
                        {user?.displayName || user?.email || 'You'}
                      </p>
                      <p className="text-xs text-slate-dim">{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gold font-medium">Owner</span>
                </div>
              )}

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="pt-2 mt-2 border-t border-nex-light">
                  <p className="text-xs text-slate-dim mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Invitations
                  </p>
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-nex-dark/50 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-3.5 w-3.5 text-slate-dim shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-light truncate">{inv.email}</p>
                          <p className="text-[10px] text-slate-dim capitalize">{inv.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="text-slate-dim hover:text-red-400 transition-colors p-1"
                        title="Revoke invitation"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickAction
                icon={Shield}
                label="Signal Detection"
                description="Run safety signal analysis"
                href="/nucleus/vigilance"
              />
              <QuickAction
                icon={BarChart3}
                label="View Analytics"
                description="Usage and program metrics"
                disabled
              />
            </CardContent>
          </Card>

          {/* Usage Widget */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Usage</CardTitle>
              <CardDescription className="text-slate-dim text-xs">Current billing period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-dim">Programs</span>
                  <span className="text-slate-light">{programStats.active} / {programStats.limit}</span>
                </div>
                <Progress value={programStats.limit > 0 ? (programStats.active / programStats.limit) * 100 : 0} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-dim">Team Members</span>
                  <span className="text-slate-light">
                    {tenant.memberCount} / {TIER_LIMITS[tenant.tier]?.maxTeamMembers || '?'}
                  </span>
                </div>
                <Progress
                  value={TIER_LIMITS[tenant.tier] ? (tenant.memberCount / TIER_LIMITS[tenant.tier].maxTeamMembers) * 100 : 0}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-dim">API Calls</span>
                  <span className="text-slate-light">0 / month</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-dim">Storage</span>
                  <span className="text-slate-light">0 MB</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* Therapeutic Areas */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light text-base">Therapeutic Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tenant.therapeuticAreas.map((area) => (
                  <span
                    key={area}
                    className="px-2.5 py-1 rounded-full text-xs border border-nex-light text-slate-dim capitalize"
                  >
                    {area.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
