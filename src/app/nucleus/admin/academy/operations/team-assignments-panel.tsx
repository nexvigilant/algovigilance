'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  RefreshCw,
  Briefcase,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getTeamMembers,
  getContentAssignments,
  assignDomainToMember,
  removeAssignment,
  type TeamMember,
  type ContentAssignment,
} from './team-assignments-actions';
import { useAuth } from '@/hooks/use-auth';
import type { DomainOperationsStats } from '@/lib/actions/operations';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/team-assignments-panel');

interface TeamAssignmentsPanelProps {
  domains: DomainOperationsStats[];
  onRefresh: () => void;
}

export function TeamAssignmentsPanel({ domains, onRefresh }: TeamAssignmentsPanelProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainOperationsStats | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  async function fetchData() {
    try {
      const [membersResult, assignmentsResult] = await Promise.all([
        getTeamMembers(),
        getContentAssignments({ status: 'active' }),
      ]);

      if (membersResult.success && membersResult.members) {
        setTeamMembers(membersResult.members);
      }
      if (assignmentsResult.success && assignmentsResult.assignments) {
        setAssignments(assignmentsResult.assignments);
      }
    } catch (error) {
      log.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  function getDomainAssignee(domainId: string): ContentAssignment | undefined {
    return assignments.find(
      (a) => a.domainId === domainId && a.assignmentType === 'domain' && a.status === 'active'
    );
  }

  function getMemberWorkload(memberId: string): { domains: number; total: number } {
    const memberAssignments = assignments.filter((a) => a.assigneeId === memberId);
    return {
      domains: memberAssignments.filter((a) => a.assignmentType === 'domain').length,
      total: memberAssignments.length,
    };
  }

  function openAssignModal(domain: DomainOperationsStats) {
    setSelectedDomain(domain);
    setSelectedMember('');
    setAssignmentNotes('');
    setShowAssignModal(true);
  }

  async function handleAssign() {
    if (!user || !selectedDomain || !selectedMember) return;

    const member = teamMembers.find((m) => m.id === selectedMember);
    if (!member) return;

    setAssigning(true);
    try {
      const result = await assignDomainToMember(
        selectedDomain.domainId,
        selectedDomain.domainName,
        member.id,
        member.displayName,
        member.email,
        user.uid,
        assignmentNotes || undefined
      );

      if (result.success) {
        setShowAssignModal(false);
        await fetchData();
        onRefresh();
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    const result = await removeAssignment(assignmentId);
    if (result.success) {
      await fetchData();
      onRefresh();
    }
  }

  if (loading) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        </CardContent>
      </Card>
    );
  }

  const assignedDomains = assignments.filter((a) => a.assignmentType === 'domain').length;
  const unassignedDomains = domains.length - assignedDomains;

  return (
    <>
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Users className="h-5 w-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-light">Team Assignments</CardTitle>
                <CardDescription className="text-slate-dim">
                  {teamMembers.length} team members • {assignedDomains} domains assigned
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-slate-dim hover:text-cyan"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-slate-dim hover:text-cyan"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Quick Stats */}
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 bg-nex-dark rounded-lg">
              <div className="text-xl font-bold text-slate-light">{teamMembers.length}</div>
              <div className="text-xs text-slate-dim">Team Members</div>
            </div>
            <div className="text-center p-2 bg-nex-dark rounded-lg">
              <div className="text-xl font-bold text-emerald-400">{assignedDomains}</div>
              <div className="text-xs text-slate-dim">Assigned</div>
            </div>
            <div className="text-center p-2 bg-nex-dark rounded-lg">
              <div className="text-xl font-bold text-amber-400">{unassignedDomains}</div>
              <div className="text-xs text-slate-dim">Unassigned</div>
            </div>
          </div>
        </CardContent>

        {/* Expanded View */}
        {expanded && (
          <CardContent className="pt-0">
            <div className="border-t border-nex-light pt-4">
              {/* Team Members Overview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-light mb-3">Team Workload</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teamMembers.map((member) => {
                    const workload = getMemberWorkload(member.id);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 bg-nex-dark rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photoURL} />
                          <AvatarFallback className="bg-cyan/20 text-cyan text-xs">
                            {member.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-light truncate">
                            {member.displayName}
                          </p>
                          <p className="text-xs text-slate-dim">{member.role}</p>
                        </div>
                        <Badge variant="secondary" className="bg-cyan/10 text-cyan">
                          {workload.domains} domains
                        </Badge>
                      </div>
                    );
                  })}
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-slate-dim col-span-2 text-center py-4">
                      No team members with admin or moderator roles found.
                    </p>
                  )}
                </div>
              </div>

              {/* Domain Assignments */}
              <div>
                <h4 className="text-sm font-medium text-slate-light mb-3">Domain Assignments</h4>
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2">
                    {domains.map((domain) => {
                      const assignment = getDomainAssignee(domain.domainId);
                      return (
                        <div
                          key={domain.domainId}
                          className="flex items-center gap-3 p-3 bg-nex-dark rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-light">
                              {domain.domainId}: {domain.domainName}
                            </p>
                            <p className="text-xs text-slate-dim">
                              {domain.total} KSBs • {domain.completionPercent}% complete
                            </p>
                          </div>
                          {assignment ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                                  {assignment.assigneeName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-light">{assignment.assigneeName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="h-6 w-6 p-0 text-slate-dim hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignModal(domain)}
                              className="border-cyan/50 text-cyan hover:bg-cyan/10"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-nex-surface border-nex-light">
          <DialogHeader>
            <DialogTitle className="text-slate-light flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gold" />
              Assign Domain
            </DialogTitle>
            <DialogDescription className="text-slate-dim">
              Assign {selectedDomain?.domainName} to a team member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-light">Team Member</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="bg-nex-dark border-nex-light">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => {
                    const workload = getMemberWorkload(member.id);
                    return (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{member.displayName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {workload.domains} domains
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-light">Notes (optional)</label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Any notes about this assignment..."
                className="bg-nex-dark border-nex-light"
                rows={2}
              />
            </div>

            {selectedDomain && (
              <div className="bg-nex-dark border border-nex-light rounded-lg p-3">
                <p className="text-xs text-slate-dim mb-1">Domain Details</p>
                <p className="text-sm text-slate-light font-medium">
                  {selectedDomain.domainId}: {selectedDomain.domainName}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-dim">
                  <span>{selectedDomain.total} KSBs</span>
                  <span>{selectedDomain.published} published</span>
                  <span>{selectedDomain.needsReview} need review</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedMember || assigning}
              className="bg-gold hover:bg-gold-bright text-nex-deep"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Assign Domain
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
