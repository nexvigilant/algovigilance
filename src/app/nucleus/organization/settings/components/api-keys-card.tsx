'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeyRecord,
  type ApiKeyCreated,
} from '@/lib/actions/api-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertCircle } from 'lucide-react';

export function ApiKeysCard({ tenantId, userId, tier }: { tenantId: string; userId: string; tier: string }) {
  const [keys, setKeys] = useState<Omit<ApiKeyRecord, 'keyHash'>[]>([]);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const result = await listApiKeys(tenantId);
    if (result.success && result.keys) {
      setKeys(result.keys);
    }
  }, [tenantId]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleCreate() {
    if (!keyName.trim()) return;
    setCreating(true);
    setError(null);

    const result = await createApiKey(tenantId, userId, keyName.trim(), 'live');
    if (result.success && result.key) {
      setNewKey(result.key);
      setKeyName('');
      setShowCreate(false);
      loadKeys();
    } else {
      setError(result.error || 'Failed to create key');
    }
    setCreating(false);
  }

  async function handleRevoke(keyId: string) {
    await revokeApiKey(tenantId, keyId);
    loadKeys();
  }

  const isAcademic = tier === 'academic';
  const activeKeys = keys.filter(k => k.status === 'active');

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Key className="h-5 w-5 text-cyan" />
          API Keys
        </CardTitle>
        <CardDescription className="text-slate-dim">
          {isAcademic
            ? 'API access requires Biotech tier or higher'
            : `Manage programmatic access (${activeKeys.length} active)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAcademic ? (
          <div className="text-center py-6 border border-dashed border-nex-light rounded-lg">
            <Key className="mx-auto h-8 w-8 text-slate-dim mb-2" />
            <p className="text-sm text-slate-dim">Upgrade to Biotech tier to enable API access</p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Newly created key (shown once) */}
            {newKey && (
              <Alert className="border-gold/30 bg-gold/10">
                <Key className="h-4 w-4 text-gold" />
                <AlertDescription className="space-y-2">
                  <p className="text-gold font-medium text-sm">Key created — copy it now, it won&apos;t be shown again</p>
                  <code className="block bg-nex-dark p-2 rounded text-xs text-slate-light font-mono break-all">
                    {newKey.key}
                  </code>
                  <p className="text-[10px] text-slate-dim">
                    Rate limit: {newKey.rateLimit} RPM | Environment: {newKey.environment}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setNewKey(null)} className="border-nex-light text-slate-dim text-xs">
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Key list */}
            {activeKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-nex-dark">
                <div>
                  <p className="text-sm font-medium text-slate-light">{k.name}</p>
                  <p className="text-xs text-slate-dim font-mono">{k.prefix}...  |  {k.rateLimit} RPM</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(k.id)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  Revoke
                </Button>
              </div>
            ))}

            {/* Revoked keys */}
            {keys.filter(k => k.status === 'revoked').length > 0 && (
              <p className="text-[10px] text-slate-dim">
                {keys.filter(k => k.status === 'revoked').length} revoked key(s) hidden
              </p>
            )}

            {/* Create form */}
            {showCreate ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Key name (e.g., Production API)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-nex-dark border-nex-light text-slate-light text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !keyName.trim()}
                  className="border-cyan text-cyan hover:bg-cyan/10 bg-transparent whitespace-nowrap"
                >
                  {creating ? '...' : 'Create'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-nex-light text-slate-dim">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreate(true)}
                className="border-nex-light text-slate-dim hover:text-slate-light w-full"
              >
                <Key className="h-4 w-4 mr-1" />
                Generate API Key
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
