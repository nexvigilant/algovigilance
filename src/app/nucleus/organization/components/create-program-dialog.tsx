'use client';

import { useState } from 'react';
import {
  createProgram,
  STAGE_INFO,
  type CreateProgramInput,
  type ProgramStage,
} from '@/lib/actions/programs';
import { TIER_LIMITS } from '@/lib/actions/tenant';
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
import { Plus, AlertCircle } from 'lucide-react';
import { THERAPEUTIC_AREAS } from './constants';

export function CreateProgramDialog({
  tenantId,
  userId,
  onCreated,
  programLimit,
  programCount,
}: {
  tenantId: string;
  userId: string;
  onCreated: () => void;
  programLimit: number;
  programCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [codeName, setCodeName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetGene, setTargetGene] = useState('');
  const [therapeuticArea, setTherapeuticArea] = useState('');
  const [stage, setStage] = useState<ProgramStage>('target_validation');
  const [description, setDescription] = useState('');

  const atLimit = programCount >= programLimit;

  function resetForm() {
    setCodeName('');
    setTargetName('');
    setTargetGene('');
    setTherapeuticArea('');
    setStage('target_validation');
    setDescription('');
    setFormError(null);
  }

  async function handleSubmit() {
    if (!codeName.trim() || !targetName.trim() || !therapeuticArea) {
      setFormError('Code name, target name, and therapeutic area are required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const input: CreateProgramInput = {
      codeName: codeName.trim(),
      targetName: targetName.trim(),
      targetGene: targetGene.trim() || undefined,
      therapeuticArea: therapeuticArea as CreateProgramInput['therapeuticArea'],
      currentStage: stage,
      description: description.trim() || undefined,
    };

    const result = await createProgram(tenantId, userId, input);

    if (result.success) {
      resetForm();
      setOpen(false);
      onCreated();
    } else {
      setFormError(result.error || 'Failed to create program');
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={atLimit}
          className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
          title={atLimit ? `Program limit reached (${programLimit})` : undefined}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-nex-surface border-nex-light sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-light">Create Program</DialogTitle>
          <DialogDescription className="text-slate-dim">
            {programCount} of {programLimit} programs used ({TIER_LIMITS[
              'academic' // placeholder — real tier from parent
            ] ? '' : ''}
            {programLimit - programCount} remaining)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeName" className="text-slate-dim text-xs">Code Name *</Label>
              <Input
                id="codeName"
                placeholder="e.g., PHOENIX-001"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                className="bg-nex-dark border-nex-light text-slate-light"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetName" className="text-slate-dim text-xs">Target Name *</Label>
              <Input
                id="targetName"
                placeholder="e.g., EGFR"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="bg-nex-dark border-nex-light text-slate-light"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="therapeuticArea" className="text-slate-dim text-xs">Therapeutic Area *</Label>
              <Select value={therapeuticArea} onValueChange={setTherapeuticArea}>
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  {THERAPEUTIC_AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value} className="text-slate-light">
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-slate-dim text-xs">Starting Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ProgramStage)}>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetGene" className="text-slate-dim text-xs">Target Gene (optional)</Label>
            <Input
              id="targetGene"
              placeholder="e.g., ERBB1"
              value={targetGene}
              onChange={(e) => setTargetGene(e.target.value)}
              className="bg-nex-dark border-nex-light text-slate-light"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-dim text-xs">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief program description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-nex-dark border-nex-light text-slate-light"
            />
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
            {submitting ? 'Creating...' : 'Create Program'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
