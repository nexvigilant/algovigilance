'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import type { CircleMember } from '@/lib/api/circles-api';

const ROLE_COLORS: Record<string, string> = {
  Founder: 'border-nex-gold-500/30 text-nex-gold-400',
  Lead: 'border-cyan/30 text-cyan',
  Reviewer: 'border-emerald-500/30 text-emerald-400',
};

function roleColor(role: string): string {
  return ROLE_COLORS[role] ?? 'border-nex-light text-cyan-soft/60';
}

function formatUserId(uid: string): string {
  return uid.length > 16 ? `${uid.slice(0, 8)}...${uid.slice(-4)}` : uid;
}

function MemberRow({ member }: { member: CircleMember }) {
  return (
    <div className="flex items-center justify-between border-b border-nex-light/50 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/20 text-sm font-medium text-cyan">
          {member.user_id.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{formatUserId(member.user_id)}</p>
          <p className="text-xs text-cyan-soft/50">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
        </div>
      </div>
      <Badge variant="outline" className={`text-xs ${roleColor(member.role)}`}>
        {member.role}
      </Badge>
    </div>
  );
}

const ROLE_FILTERS = ['all', 'Founder', 'Lead', 'Researcher', 'Reviewer', 'Member', 'Observer'] as const;

interface MembersTabProps {
  members: CircleMember[];
  canInvite: boolean;
  onInvite: (userIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export function MembersTab({ members, canInvite, onInvite }: MembersTabProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');

  const handleInvite = async () => {
    const userIds = inviteInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (!userIds.length) return;
    setInviting(true);
    const res = await onInvite(userIds);
    if (res.success) {
      setInviteMessage(`${userIds.length} invitation(s) sent`);
      setInviteInput('');
      setShowInvite(false);
    } else {
      setInviteMessage(res.error ?? 'Failed to send invitations');
    }
    setInviting(false);
  };

  const filteredMembers = members
    .filter((m) => memberRoleFilter === 'all' || m.role === memberRoleFilter)
    .filter((m) => !memberSearch || m.user_id.toLowerCase().includes(memberSearch.toLowerCase()));

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Members</h2>
        {canInvite && (
          <Button
            size="sm"
            variant="outline"
            className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
            onClick={() => setShowInvite(!showInvite)}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Invite
          </Button>
        )}
      </div>

      {showInvite && (
        <Card className="mt-3 border border-cyan/30 bg-nex-deep p-4">
          <label className="mb-1 block text-sm font-medium text-white">
            User IDs (comma-separated)
          </label>
          <input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="user-id-1, user-id-2"
            className="mb-3 w-full rounded border border-nex-light bg-nex-surface p-2 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={inviting || !inviteInput.trim()}
              className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
            >
              {inviting ? 'Sending...' : 'Send Invitations'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowInvite(false); setInviteMessage(''); }}
              className="text-cyan-soft/60"
            >
              Cancel
            </Button>
          </div>
          {inviteMessage && (
            <p className="mt-2 text-xs text-cyan-soft/60">{inviteMessage}</p>
          )}
        </Card>
      )}

      <div className="mb-3 flex items-center gap-2">
        <input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search members..."
          className="h-7 flex-1 rounded border border-nex-light bg-nex-deep px-2 text-xs text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
        />
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setMemberRoleFilter(r)}
            className={`rounded px-2 py-0.5 text-xs ${memberRoleFilter === r ? 'bg-cyan-dark text-white' : 'border border-nex-light text-cyan-soft/60'}`}
          >
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>

      {filteredMembers.length === 0 ? (
        <p className="py-8 text-center text-cyan-soft/60">No members found.</p>
      ) : (
        filteredMembers.map((m) => <MemberRow key={m.id} member={m} />)
      )}
    </Card>
  );
}
