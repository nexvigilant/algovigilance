'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FolderOpen, FileText, Clock, RotateCcw } from 'lucide-react';
import type { BrainSession, BrainArtifact } from '@/types/nexcore';
import { brainSessionsList, brainSessionLoad } from '@/lib/nexcore-api';

export function BrainViewer() {
  const [sessions, setSessions] = useState<BrainSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<BrainArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<BrainArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await brainSessionsList();
      setSessions(data.sessions || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const loadSession = async (id: string) => {
    setSelectedSession(id);
    setLoadingArtifacts(true);
    setSelectedArtifact(null);
    try {
      const data = await brainSessionLoad(id);
      setArtifacts(data.artifacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session');
    } finally {
      setLoadingArtifacts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        <span className="ml-2 text-slate-dim">Loading sessions...</span>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <Card className="bg-white/[0.06] border border-red-500/50">
        <CardContent className="py-6 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-slate-dim">Ensure nexcore-api is running on port 3030</p>
          <Button onClick={fetchSessions} variant="outline" className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Sessions List */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-dim mb-3 flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Sessions ({sessions.length})
        </h2>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded border transition-all text-sm ${
                selectedSession === session.id
                  ? 'bg-cyan/10 border-cyan/50 text-cyan'
                  : 'bg-white/[0.06] border-white/[0.12] text-white hover:border-cyan/30'
              }`}
            >
              <div className="font-medium truncate">{session.name || session.id.slice(0, 8)}</div>
              <div className="text-xs text-slate-dim flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {new Date(session.created_at).toLocaleDateString()}
                <span className="ml-auto">{session.artifact_count} artifacts</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {loadingArtifacts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-cyan" />
          </div>
        ) : selectedSession ? (
          <>
            {/* Artifacts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setSelectedArtifact(artifact)}
                  className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                    selectedArtifact?.id === artifact.id
                      ? 'bg-gold/10 border-gold/50 text-gold'
                      : 'bg-white/[0.06] border-white/[0.12] text-slate-dim hover:border-gold/30'
                  }`}
                >
                  <FileText className="h-3 w-3 inline mr-1" />
                  {artifact.name}
                  <span className="ml-1 text-slate-dim">v{artifact.version}</span>
                </button>
              ))}
            </div>

            {/* Artifact Content */}
            {selectedArtifact ? (
              <Card className="bg-white/[0.06] border border-white/[0.12]">
                <CardHeader>
                  <CardTitle className="text-sm text-gold flex items-center justify-between">
                    <span>{selectedArtifact.name}</span>
                    <span className="text-xs text-slate-dim font-normal">
                      {selectedArtifact.artifact_type} · v{selectedArtifact.version}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono text-slate-300 bg-black/40 rounded p-4 overflow-auto max-h-[500px] whitespace-pre-wrap">
                    {selectedArtifact.content}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/[0.06] border border-white/[0.12]">
                <CardContent className="py-12 text-center text-slate-dim text-sm">
                  Select an artifact to view its content
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-white/[0.06] border border-white/[0.12]">
            <CardContent className="py-12 text-center text-slate-dim text-sm">
              Select a session to view its artifacts
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
