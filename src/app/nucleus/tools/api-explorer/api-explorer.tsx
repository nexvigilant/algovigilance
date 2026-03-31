'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Send,
  ChevronDown,
  ChevronRight,
  Circle,
  RotateCcw,
} from 'lucide-react';

import { NEXCORE_API_URL } from '@/lib/nexcore-config';

interface EndpointGroup {
  tag: string;
  description: string;
  endpoints: EndpointDef[];
}

interface EndpointDef {
  method: string;
  path: string;
  summary: string;
  tag: string;
}

function methodColor(m: string): string {
  switch (m.toUpperCase()) {
    case 'GET': return 'text-emerald-400';
    case 'POST': return 'text-cyan';
    case 'PUT': return 'text-yellow-400';
    case 'DELETE': return 'text-red-400';
    default: return 'text-slate-dim';
  }
}

export function ApiExplorer() {
  const [groups, setGroups] = useState<EndpointGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request state
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const loadSpec = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${NEXCORE_API_URL}/openapi.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const spec = await res.json();

      // Parse OpenAPI paths into grouped endpoints
      const endpoints: EndpointDef[] = [];
      const paths = spec.paths || {};
      for (const [path, methods] of Object.entries(paths)) {
        for (const [method, def] of Object.entries(methods as Record<string, { summary?: string; tags?: string[] }>)) {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              summary: def.summary || '',
              tag: def.tags?.[0] || 'other',
            });
          }
        }
      }

      // Group by tag
      const tagMap = new Map<string, EndpointDef[]>();
      for (const ep of endpoints) {
        const existing = tagMap.get(ep.tag) || [];
        existing.push(ep);
        tagMap.set(ep.tag, existing);
      }

      const tagInfo: Record<string, string> = {};
      for (const t of (spec.tags || [])) {
        tagInfo[t.name] = t.description || '';
      }

      const sorted = [...tagMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, eps]): EndpointGroup => ({
          tag,
          description: tagInfo[tag] || '',
          endpoints: eps.sort((a, b) => a.path.localeCompare(b.path)),
        }));

      setGroups(sorted);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load OpenAPI spec');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSpec(); }, [loadSpec]);

  const toggleTag = (tag: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const selectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setResponse(null);
    setResponseStatus(null);
    if (ep.method === 'POST') {
      // Provide a sensible default body
      if (ep.path.includes('signal/complete')) {
        setRequestBody(JSON.stringify({ a: 15, b: 100, c: 20, d: 10000 }, null, 2));
      } else if (ep.path.includes('tick') || ep.path.includes('reset')) {
        setRequestBody('{}');
      } else {
        setRequestBody('{}');
      }
    } else {
      setRequestBody('');
    }
  };

  const sendRequest = async () => {
    if (!selectedEndpoint) return;
    setSending(true);
    try {
      const url = `${NEXCORE_API_URL}${selectedEndpoint.path}`;
      const opts: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (selectedEndpoint.method === 'POST' && requestBody) {
        opts.body = requestBody;
      }
      const res = await fetch(url, opts);
      setResponseStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e) {
      setResponse(e instanceof Error ? e.message : 'Request failed');
      setResponseStatus(0);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        <span className="ml-2 text-slate-dim">Loading OpenAPI spec...</span>
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <Card className="bg-white/[0.06] border border-red-500/50">
        <CardContent className="py-6 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-slate-dim">Ensure nexcore-api is running on port 3030</p>
          <Button onClick={loadSpec} variant="outline" className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalEndpoints = groups.reduce((acc, g) => acc + g.endpoints.length, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* Endpoint List */}
      <div className="space-y-1 max-h-[700px] overflow-y-auto">
        <p className="text-xs text-slate-dim mb-3">{totalEndpoints} endpoints across {groups.length} modules</p>
        {groups.map((group) => (
          <div key={group.tag}>
            <button
              onClick={() => toggleTag(group.tag)}
              className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded text-sm"
            >
              {expandedTags.has(group.tag) ? (
                <ChevronDown className="h-3 w-3 text-slate-dim" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-dim" />
              )}
              <span className="text-gold font-medium">{group.tag}</span>
              <span className="text-xs text-slate-dim ml-auto">{group.endpoints.length}</span>
            </button>
            {expandedTags.has(group.tag) && (
              <div className="ml-5 space-y-0.5">
                {group.endpoints.map((ep) => (
                  <button
                    key={`${ep.method}-${ep.path}`}
                    onClick={() => selectEndpoint(ep)}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-all ${
                      selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method
                        ? 'bg-cyan/10 border border-cyan/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className={`font-mono font-bold w-10 ${methodColor(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="text-white truncate">{ep.path}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Request/Response */}
      <div className="space-y-4">
        {selectedEndpoint ? (
          <>
            {/* Request */}
            <Card className="bg-white/[0.06] border border-white/[0.12]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Circle className={`h-3 w-3 ${methodColor(selectedEndpoint.method)}`} />
                  <span className={`font-mono font-bold ${methodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="text-white font-mono">{selectedEndpoint.path}</span>
                </CardTitle>
                {selectedEndpoint.summary && (
                  <p className="text-xs text-slate-dim">{selectedEndpoint.summary}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEndpoint.method === 'POST' && (
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.12] rounded p-3 text-xs font-mono text-white resize-y min-h-[80px]"
                    placeholder="Request body (JSON)"
                  />
                )}
                <Button
                  onClick={sendRequest}
                  disabled={sending}
                  className="bg-cyan hover:bg-cyan/80 text-black font-semibold"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Request
                </Button>
              </CardContent>
            </Card>

            {/* Response */}
            {response !== null && (
              <Card className="bg-white/[0.06] border border-white/[0.12]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Response
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      responseStatus && responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {responseStatus}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono text-slate-300 bg-black/40 rounded p-3 overflow-auto max-h-[400px] whitespace-pre-wrap">
                    {response}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-white/[0.06] border border-white/[0.12]">
            <CardContent className="py-16 text-center text-slate-dim text-sm">
              Select an endpoint from the left panel to send requests
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
