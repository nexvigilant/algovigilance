'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    CheckCheck,
    Loader2,
    AlertTriangle,
    Eye,
    EyeOff,
} from 'lucide-react';
import type { GuardianApiKey, GuardianCreateKeyResponse, GuardianListKeysResponse } from '@/types/nexcore';
import { logger } from '@/lib/logger';

const log = logger.scope('ApiKeys');

export function ApiKeys() {
    const [keys, setKeys] = useState<GuardianApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [showRevealedKey, setShowRevealedKey] = useState(false);

    const fetchKeys = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/nexcore/guardian/keys');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `Failed to load keys (${res.status})`);
            }
            const data = await res.json() as GuardianListKeysResponse;
            setKeys(data.keys ?? []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load API keys';
            log.error('Failed to fetch API keys', err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchKeys();
    }, [fetchKeys]);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        setIsCreating(true);
        setCreateError(null);
        setRevealedKey(null);
        setShowRevealedKey(false);
        try {
            const res = await fetch('/api/nexcore/guardian/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `Failed to create key (${res.status})`);
            }
            const data = await res.json() as GuardianCreateKeyResponse;
            setRevealedKey(data.api_key);
            setShowRevealedKey(true);
            setNewKeyName('');
            await fetchKeys();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create API key';
            log.error('Failed to create API key', err);
            setCreateError(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        setRevokingId(keyId);
        try {
            const res = await fetch(`/api/nexcore/guardian/keys/${keyId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `Failed to revoke key (${res.status})`);
            }
            setKeys((prev) => prev.filter((k) => k.key_id !== keyId));
            if (revealedKey !== null && copiedKeyId === keyId) {
                setRevealedKey(null);
            }
        } catch (err) {
            log.error('Failed to revoke API key', err);
            setError(err instanceof Error ? err.message : 'Failed to revoke key');
        } finally {
            setRevokingId(null);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKeyId(id);
            setTimeout(() => setCopiedKeyId(null), 2000);
        } catch {
            // Clipboard API unavailable — silently ignore
        }
    };

    return (
        <div className="space-y-6">
            {/* Create new key */}
            <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
                    <Key className="h-3.5 w-3.5 text-cyan/60" />
                    <span className="intel-label">Create API Key</span>
                    <div className="h-px flex-1 bg-nex-light/20" />
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Key name (e.g. production-app)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                            className="bg-black/20 border-nex-light/40 text-white font-mono text-sm"
                        />
                        <Button
                            onClick={() => void handleCreate()}
                            disabled={isCreating || !newKeyName.trim()}
                            className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest shrink-0"
                        >
                            {isCreating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Create
                                </>
                            )}
                        </Button>
                    </div>
                    {createError && (
                        <p className="text-sm text-red-400/80 font-mono">{createError}</p>
                    )}
                </div>
            </div>

            {/* Revealed key — shown once after creation */}
            {revealedKey !== null && (
                <Alert className="border-gold/30 bg-gold/5">
                    <AlertTriangle className="h-4 w-4 text-gold" />
                    <AlertDescription className="space-y-2">
                        <p className="text-xs font-mono text-gold/80">
                            Copy this key now — it will not be shown again.
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono text-white bg-black/30 px-3 py-2 rounded border border-nex-light/20 break-all">
                                {showRevealedKey ? revealedKey : '•'.repeat(Math.min(revealedKey.length, 48))}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRevealedKey((v) => !v)}
                                className="text-slate-dim/60 hover:text-white h-8 w-8 p-0 shrink-0"
                                aria-label={showRevealedKey ? 'Hide key' : 'Show key'}
                            >
                                {showRevealedKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleCopy(revealedKey, 'revealed')}
                                className="text-cyan/60 hover:text-cyan h-8 w-8 p-0 shrink-0"
                                aria-label="Copy API key"
                            >
                                {copiedKeyId === 'revealed' ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Key list */}
            <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
                    <Key className="h-3.5 w-3.5 text-cyan/60" />
                    <span className="intel-label">Active Keys</span>
                    <div className="h-px flex-1 bg-nex-light/20" />
                    {!isLoading && (
                        <span className="text-[10px] font-mono text-slate-dim/40">
                            {keys.length} key{keys.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-dim/40">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-mono">Loading keys...</span>
                    </div>
                ) : error !== null ? (
                    <div className="flex items-center gap-2 p-4 text-red-400/80">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-mono">{error}</span>
                    </div>
                ) : keys.length === 0 ? (
                    <p className="text-center text-xs font-mono text-slate-dim/40 py-10">
                        No API keys yet. Create one above.
                    </p>
                ) : (
                    <ul className="divide-y divide-nex-light/10">
                        {keys.map((key) => (
                            <li key={key.key_id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-mono text-white truncate">
                                            {key.name ?? key.key_id}
                                        </span>
                                        <Badge
                                            variant={key.active ? 'default' : 'secondary'}
                                            className={
                                                key.active
                                                    ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 text-[9px] font-mono'
                                                    : 'bg-red-500/10 text-red-400/80 border border-red-500/20 text-[9px] font-mono'
                                            }
                                        >
                                            {key.active ? 'ACTIVE' : 'REVOKED'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-dim/40">
                                        <span>{key.prefix}••••••••</span>
                                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                                        {key.last_used !== undefined && (
                                            <span>Last used {new Date(key.last_used).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void handleRevoke(key.key_id)}
                                    disabled={revokingId === key.key_id || !key.active}
                                    className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 shrink-0"
                                    aria-label={`Revoke key ${key.name ?? key.key_id}`}
                                >
                                    {revokingId === key.key_id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
