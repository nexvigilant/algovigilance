'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuditEvent {
  event_id: string;
  tenant_id: string;
  user_id: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  action: string;
  timestamp: string;
  details: Record<string, unknown> | null;
}

interface GdprRequest {
  request_id: string;
  request_type: string;
  subject_email: string;
  status: string;
  deadline: string;
  created_at: string;
  days_remaining: number;
}

interface ConsentRecord {
  consent_type: string;
  granted: boolean;
  granted_at: string | null;
  description: string;
}

interface Soc2Category {
  category: string;
  score: number;
  controls_total: number;
  controls_met: number;
  status: string;
}

interface Soc2Scorecard {
  overall_score: number;
  categories: Soc2Category[];
  controls_total: number;
  controls_compliant: number;
  controls_partial: number;
  last_audit_date: string;
  next_audit_date: string;
}

interface ExportScreenResult {
  screening_id: string;
  compound_identifier: string;
  destination_country: string;
  risk_level: string;
  cleared: boolean;
  flags: string[];
  details: string;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    Received: 'bg-yellow-500/20 text-yellow-400',
    Processing: 'bg-blue-500/20 text-blue-400',
    Completed: 'bg-emerald-500/20 text-emerald-400',
    Denied: 'bg-red-500/20 text-red-400',
  };
  return <Badge className={colors[status] ?? 'bg-slate-500/20 text-slate-400'}>{status}</Badge>;
}

function riskBadge(level: string) {
  const colors: Record<string, string> = {
    Low: 'bg-emerald-500/20 text-emerald-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    High: 'bg-red-500/20 text-red-400',
    Blocked: 'bg-red-700/30 text-red-300',
  };
  return <Badge className={colors[level] ?? 'bg-slate-500/20 text-slate-400'}>{level}</Badge>;
}

export default function CompliancePage() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GdprRequest[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [scorecard, setScorecard] = useState<Soc2Scorecard | null>(null);
  const [exportResult, setExportResult] = useState<ExportScreenResult | null>(null);
  const [compoundId, setCompoundId] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [auditRes, gdprRes, consentRes, soc2Res] = await Promise.all([
          fetch('/api/nexcore/api/v1/compliance/audit/query'),
          fetch('/api/nexcore/api/v1/compliance/gdpr/requests'),
          fetch('/api/nexcore/api/v1/compliance/gdpr/consent'),
          fetch('/api/nexcore/api/v1/compliance/soc2/scorecard'),
        ]);
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditEvents(data.events ?? []);
        }
        if (gdprRes.ok) {
          const data = await gdprRes.json();
          setGdprRequests(data.requests ?? []);
        }
        if (consentRes.ok) {
          const data = await consentRes.json();
          setConsents(data.records ?? []);
        }
        if (soc2Res.ok) setScorecard(await soc2Res.json());
      } catch {
        // API not running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function screenExport() {
    if (!compoundId || !country) return;
    try {
      const res = await fetch('/api/nexcore/api/v1/compliance/export/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compound_identifier: compoundId, destination_country: country }),
      });
      if (res.ok) setExportResult(await res.json());
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-light">Compliance Center</h1>
        <p className="text-slate-dim text-sm mt-1">
          Audit trails, GDPR management, export controls, and SOC 2 compliance
        </p>
      </header>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="export">Export Control</TabsTrigger>
          <TabsTrigger value="soc2">SOC 2</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((e) => (
                    <TableRow key={e.event_id}>
                      <TableCell className="text-xs">{new Date(e.timestamp).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{e.event_type}</Badge></TableCell>
                      <TableCell className="text-xs">{e.user_id}</TableCell>
                      <TableCell className="text-xs">{e.resource_type}/{e.resource_id}</TableCell>
                      <TableCell className="text-xs">{e.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Subject Requests</CardTitle>
              <Button size="sm">New Request</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gdprRequests.map((r) => (
                    <TableRow key={r.request_id}>
                      <TableCell>{r.request_type}</TableCell>
                      <TableCell className="text-xs">{r.subject_email}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.days_remaining > 0 ? (
                          <span className={r.days_remaining < 7 ? 'text-red-400' : ''}>{r.days_remaining}d</span>
                        ) : (
                          <span className="text-slate-dim">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.map((c) => (
                <div key={c.consent_type} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="font-medium text-sm">{c.consent_type.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs text-slate-dim mt-1">{c.description}</p>
                  </div>
                  <Switch checked={c.granted} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Control Screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Compound identifier"
                  value={compoundId}
                  onChange={(e) => setCompoundId(e.target.value)}
                  className="max-w-xs"
                />
                <Input
                  placeholder="Country code (e.g., US, DE)"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={screenExport}>Screen</Button>
              </div>
              {exportResult && (
                <div className="p-4 rounded-lg bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{exportResult.compound_identifier}</span>
                    <span className="text-slate-dim">to</span>
                    <span className="font-medium">{exportResult.destination_country}</span>
                    {riskBadge(exportResult.risk_level)}
                    {exportResult.cleared ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400">Cleared</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400">Blocked</Badge>
                    )}
                  </div>
                  {exportResult.flags.length > 0 && (
                    <ul className="text-xs text-slate-dim space-y-1">
                      {exportResult.flags.map((f, i) => (
                        <li key={i}>- {f}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-slate-dim">{exportResult.details}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soc2">
          {scorecard && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SOC 2 Type II Compliance Scorecard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-amber-400">
                        {(scorecard.overall_score * 100).toFixed(0)}%
                      </div>
                      <p className="text-xs text-slate-dim">Overall Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{scorecard.controls_compliant}</div>
                      <p className="text-xs text-slate-dim">Controls Met</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{scorecard.controls_partial}</div>
                      <p className="text-xs text-slate-dim">Partial</p>
                    </div>
                    <div className="text-xs text-slate-dim">
                      <p>Last audit: {scorecard.last_audit_date}</p>
                      <p>Next audit: {scorecard.next_audit_date}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {scorecard.categories.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{cat.category}</span>
                          <span className="text-slate-dim">
                            {cat.controls_met}/{cat.controls_total} controls
                          </span>
                        </div>
                        <Progress value={cat.score * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
