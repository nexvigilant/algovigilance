'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getTenant,
  checkTenantStatus,
  updateTenant,
  TIER_LIMITS,
  type TenantRecord,
  type TherapeuticArea,
  type UpdateTenantInput,
} from '@/lib/actions/tenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { THERAPEUTIC_AREAS, TIER_PRICING } from './components/constants';
import { StripePortalButton } from './components/stripe-portal-button';
import { ApiKeysCard } from './components/api-keys-card';
import { DeactivateDialog } from './components/deactivate-dialog';

// ============================================================================
// Main Component
// ============================================================================

export default function SettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<TherapeuticArea[]>([]);

  const loadTenant = useCallback(async () => {
    if (!user) return;
    try {
      const status = await checkTenantStatus(user.uid);
      if (!status.hasTenant || !status.tenantId) {
        setLoading(false);
        return;
      }
      const data = await getTenant(status.tenantId);
      if (data) {
        setTenant(data);
        setOrgName(data.organizationName);
        setWebsite(data.website || '');
        setOrgSize(data.organizationSize || '');
        setSelectedAreas(data.therapeuticAreas || []);
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadTenant(); }, [loadTenant]);

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const input: UpdateTenantInput = {};
    if (orgName !== tenant.organizationName) input.organizationName = orgName;
    if (website !== (tenant.website || '')) input.website = website;
    if (orgSize !== (tenant.organizationSize || '')) input.organizationSize = orgSize as UpdateTenantInput['organizationSize'];
    if (JSON.stringify(selectedAreas) !== JSON.stringify(tenant.therapeuticAreas)) {
      input.therapeuticAreas = selectedAreas;
    }

    if (Object.keys(input).length === 0) {
      setSaving(false);
      return;
    }

    const result = await updateTenant(tenant.id, input);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadTenant();
    } else {
      setError(result.error || 'Failed to save');
    }
    setSaving(false);
  }

  function toggleArea(area: TherapeuticArea) {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-slate-dim text-center">No organization found.</p>
      </div>
    );
  }

  const isOwner = tenant.ownerId === user?.uid;
  const pricing = TIER_PRICING[tenant.tier];
  const limits = TIER_LIMITS[tenant.tier];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/nucleus/organization" className="text-slate-dim hover:text-slate-light transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-headline text-gold">Organization Settings</h1>
          <p className="text-sm text-slate-dim">{tenant.organizationName}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10">
          <Check className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-400">Settings saved successfully</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-slate-light flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan" />
              General
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Organization details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-dim text-xs">Organization Name</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-nex-dark border-nex-light text-slate-light"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-dim text-xs">Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-nex-dark border-nex-light text-slate-light"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-dim text-xs">Organization Size</Label>
              <Select value={orgSize} onValueChange={setOrgSize}>
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light max-w-xs">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  {['1-10', '11-50', '51-200', '201-1000', '1000+'].map(s => (
                    <SelectItem key={s} value={s} className="text-slate-light">{s} employees</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-dim text-xs">Therapeutic Areas</Label>
              <div className="flex flex-wrap gap-2">
                {THERAPEUTIC_AREAS.map(area => (
                  <button
                    key={area.value}
                    onClick={() => toggleArea(area.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border transition-all',
                      selectedAreas.includes(area.value)
                        ? 'border-cyan text-cyan bg-cyan/10'
                        : 'border-nex-light text-slate-dim hover:border-slate-dim'
                    )}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
              {selectedAreas.length === 0 && (
                <p className="text-[10px] text-red-400">Select at least one therapeutic area</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving || selectedAreas.length === 0}
                className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing & Subscription */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-slate-light flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-cyan" />
              Billing & Subscription
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Manage your PRPaaS subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan */}
            <div className="p-4 rounded-lg border border-nex-light bg-nex-dark">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-light">Current Plan</p>
                  <p className="text-xs text-slate-dim capitalize">{tenant.tier} Tier</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gold">{pricing?.label || 'Custom'}</p>
                  <p className="text-[10px] text-slate-dim">billed monthly</p>
                </div>
              </div>

              {/* Tier Limits Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="text-center p-2 rounded bg-nex-surface">
                  <p className="text-lg font-bold text-slate-light">{limits.maxPrograms}</p>
                  <p className="text-[10px] text-slate-dim">Programs</p>
                </div>
                <div className="text-center p-2 rounded bg-nex-surface">
                  <p className="text-lg font-bold text-slate-light">{limits.maxTeamMembers}</p>
                  <p className="text-[10px] text-slate-dim">Team Members</p>
                </div>
                <div className="text-center p-2 rounded bg-nex-surface">
                  <p className="text-lg font-bold text-slate-light">{limits.storageQuotaGb} GB</p>
                  <p className="text-[10px] text-slate-dim">Storage</p>
                </div>
                <div className="text-center p-2 rounded bg-nex-surface">
                  <p className="text-lg font-bold text-slate-light">{limits.apiRateLimitRpm}</p>
                  <p className="text-[10px] text-slate-dim">API RPM</p>
                </div>
              </div>

              {/* Estimated Annual Cost */}
              {pricing && pricing.monthly > 0 && (
                <div className="mt-4 pt-3 border-t border-nex-light">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-dim">Estimated annual cost</span>
                    <span className="text-slate-light font-medium">
                      ${(pricing.monthly * 12).toLocaleString()}/year
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-dim">Cost per program slot</span>
                    <span className="text-slate-light font-medium">
                      ${Math.round(pricing.monthly / limits.maxPrograms).toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-dim">Cost per team member slot</span>
                    <span className="text-slate-light font-medium">
                      ${Math.round(pricing.monthly / limits.maxTeamMembers).toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tier Comparison */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-nex-light">
                    <th className="text-left py-2 pr-3 text-slate-dim font-normal">Feature</th>
                    {Object.entries(TIER_PRICING).map(([tier, info]) => (
                      <th key={tier} className={cn(
                        'text-center py-2 px-2 font-medium',
                        tier === tenant.tier ? 'text-cyan' : 'text-slate-dim'
                      )}>
                        {info.stripe}
                        {tier === tenant.tier && <span className="block text-[10px] text-cyan">(Current)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2 pr-3 text-slate-dim">Monthly</td>
                    {Object.entries(TIER_PRICING).map(([tier, info]) => (
                      <td key={tier} className={cn('text-center py-2', tier === tenant.tier ? 'text-slate-light font-medium' : 'text-slate-dim')}>
                        {info.label}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2 pr-3 text-slate-dim">Programs</td>
                    {Object.entries(TIER_LIMITS).map(([tier, l]) => (
                      <td key={tier} className={cn('text-center py-2', tier === tenant.tier ? 'text-slate-light font-medium' : 'text-slate-dim')}>
                        {l.maxPrograms}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2 pr-3 text-slate-dim">Members</td>
                    {Object.entries(TIER_LIMITS).map(([tier, l]) => (
                      <td key={tier} className={cn('text-center py-2', tier === tenant.tier ? 'text-slate-light font-medium' : 'text-slate-dim')}>
                        {l.maxTeamMembers}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2 pr-3 text-slate-dim">Storage</td>
                    {Object.entries(TIER_LIMITS).map(([tier, l]) => (
                      <td key={tier} className={cn('text-center py-2', tier === tenant.tier ? 'text-slate-light font-medium' : 'text-slate-dim')}>
                        {l.storageQuotaGb} GB
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-slate-dim">ML Compute</td>
                    {Object.entries(TIER_LIMITS).map(([tier, l]) => (
                      <td key={tier} className={cn('text-center py-2', tier === tenant.tier ? 'text-slate-light font-medium' : 'text-slate-dim')}>
                        {l.mlComputeEnabled ? 'Yes' : '--'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stripe Portal */}
            <div className="flex items-center gap-3">
              <StripePortalButton userId={user?.uid || ''} />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <ApiKeysCard tenantId={tenant.id} userId={user?.uid || ''} tier={tenant.tier} />

        {/* Danger Zone */}
        {isOwner && (
          <Card className="bg-nex-surface border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-slate-dim">
                Irreversible actions that affect your entire organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div>
                  <p className="text-sm font-medium text-slate-light">Deactivate Organization</p>
                  <p className="text-xs text-slate-dim">
                    All programs will be archived. Team members will lose access. This cannot be undone.
                  </p>
                </div>
                <DeactivateDialog tenantId={tenant.id} userId={user?.uid || ''} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

