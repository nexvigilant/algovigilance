'use client';

import { useState } from 'react';
import { deactivateTenant } from '@/lib/actions/tenant';
import { Button } from '@/components/ui/button';
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
import { Shield } from 'lucide-react';

export function DeactivateDialog({ tenantId, userId }: { tenantId: string; userId: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleDeactivate() {
    if (confirm !== 'DEACTIVATE') return;
    setSubmitting(true);
    const result = await deactivateTenant(tenantId, userId);
    if (result.success) {
      window.location.href = '/nucleus';
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          Deactivate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-nex-surface border-nex-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Confirm Deactivation
          </DialogTitle>
          <DialogDescription className="text-slate-dim">
            This will permanently deactivate your organization. All programs will be archived
            and team members will lose access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label className="text-slate-dim text-xs">
            Type DEACTIVATE to confirm
          </Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DEACTIVATE"
            className="bg-nex-dark border-nex-light text-slate-light"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-nex-light text-slate-dim">
            Cancel
          </Button>
          <Button
            onClick={handleDeactivate}
            disabled={confirm !== 'DEACTIVATE' || submitting}
            className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
          >
            {submitting ? 'Deactivating...' : 'Deactivate Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
