'use client';

import { useState } from 'react';
import {
  inviteMember,
  type InviteMemberInput,
  type MemberRole,
} from '@/lib/actions/invitations';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserPlus, AlertCircle, Mail } from 'lucide-react';

export function InviteDialog({
  tenantId,
  userId,
  userEmail,
  onInvited,
}: {
  tenantId: string;
  userId: string;
  userEmail: string;
  onInvited: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('scientist');

  function resetForm() {
    setEmail('');
    setRole('scientist');
    setFormError(null);
  }

  async function handleSubmit() {
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const input: InviteMemberInput = {
      email: email.trim(),
      role,
    };

    const result = await inviteMember(tenantId, userId, userEmail, input);

    if (result.success) {
      resetForm();
      setOpen(false);
      onInvited();
    } else {
      setFormError(result.error || 'Failed to send invitation');
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-nex-light text-slate-dim hover:text-slate-light">
          <UserPlus className="h-4 w-4 mr-1" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-nex-surface border-nex-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-light">Invite Team Member</DialogTitle>
          <DialogDescription className="text-slate-dim">
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-slate-dim text-xs">Email Address *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-nex-dark border-nex-light text-slate-light"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role" className="text-slate-dim text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
              <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-nex-surface border-nex-light">
                <SelectItem value="scientist" className="text-slate-light">Scientist</SelectItem>
                <SelectItem value="admin" className="text-slate-light">Admin</SelectItem>
                <SelectItem value="viewer" className="text-slate-light">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-dim">
              {role === 'admin' && 'Full access except billing and ownership transfer'}
              {role === 'scientist' && 'Can create and manage programs, run analyses'}
              {role === 'viewer' && 'Read-only access to programs and data'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setOpen(false); resetForm(); }}
            className="border-nex-light text-slate-dim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
          >
            <Mail className="h-4 w-4 mr-1" />
            {submitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
