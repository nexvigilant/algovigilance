'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Types ──────────────────────────

interface ModelInfo {
  id: string;
  name: string;
  model_type: string;
  version: string;
  status: string;
  is_platform_model: boolean;
  description: string;
  benchmark_score: number;
  usage_count: number;
  created_at: string;
  properties_predicted: string[];
}

interface PropertyPrediction {
  property: string;
  value: number;
  unit: string;
  confidence: number;
  uncertainty: number;
  classification: string | null;
}

interface PredictResponse {
  prediction_id: string;
  model_id: string;
  model_version: string;
  compound: string;
  predictions: PropertyPrediction[];
  confidence: number;
  inference_time_ms: number;
  cost_cents: number;
}

interface TrainingJobInfo {
  job_id: string;
  model_type: string;
  status: string;
  progress_percent: number;
  current_epoch: number;
  total_epochs: number;
  best_loss: number | null;
  best_validation_score: number | null;
  started_at: string;
  completed_at: string | null;
}

interface TrainingStatus {
  active_jobs: TrainingJobInfo[];
  completed_recent: TrainingJobInfo[];
  queue_depth: number;
}

interface ActiveLearningSuggestion {
  compound_id: string;
  smiles: string;
  uncertainty_score: number;
  expected_information_gain: number;
  suggested_assay: string;
  reason: string;
  priority: number;
}

interface ALResponse {
  suggestions: ActiveLearningSuggestion[];
  model_id: string;
  strategy: string;
  total_unlabeled_pool: number;
}

interface DatasetBreakdown {
  dataset_type: string;
  data_points: number;
  quality_score: number;
  last_updated: string;
}

interface AggregationStats {
  total_data_points: number;
  contributing_tenants: number;
  anonymization_method: string;
  privacy_budget_epsilon: number;
  privacy_budget_delta: number;
  data_quality_score: number;
  last_aggregation: string;
  next_scheduled: string;
  breakdown: DatasetBreakdown[];
}

// ── Helpers ──────────────────────────

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    Production: 'bg-emerald-500/20 text-emerald-400',
    Training: 'bg-blue-500/20 text-blue-400',
    Queued: 'bg-yellow-500/20 text-yellow-400',
    Completed: 'bg-emerald-500/20 text-emerald-400',
    Failed: 'bg-red-500/20 text-red-400',
  };
  return <Badge className={colors[status] ?? 'bg-slate-500/20 text-slate-400'}>{status}</Badge>;
}

function classificationBadge(c: string | null) {
  if (!c) return null;
  const colors: Record<string, string> = {
    High: 'bg-emerald-500/20 text-emerald-400',
    Moderate: 'bg-yellow-500/20 text-yellow-400',
    'Low Risk': 'bg-emerald-500/20 text-emerald-400',
    Low: 'bg-red-500/20 text-red-400',
  };
  return <Badge className={colors[c] ?? 'bg-slate-500/20 text-slate-400'}>{c}</Badge>;
}

// ── Page ──────────────────────────

export default function MLPlatformPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [training, setTraining] = useState<TrainingStatus | null>(null);
  const [alSuggestions, setAlSuggestions] = useState<ALResponse | null>(null);
  const [aggregation, setAggregation] = useState<AggregationStats | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [compound, setCompound] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [modelsRes, trainingRes, alRes, aggRes] = await Promise.all([
          fetch('/api/nexcore/api/v1/ml/models'),
          fetch('/api/nexcore/api/v1/ml/training/status'),
          fetch('/api/nexcore/api/v1/ml/active-learning/suggestions'),
          fetch('/api/nexcore/api/v1/ml/aggregation/stats'),
        ]);
        if (modelsRes.ok) {
          const data = await modelsRes.json();
          setModels(data.models ?? []);
          if (data.models?.length > 0) setSelectedModel(data.models[0].id);
        }
        if (trainingRes.ok) setTraining(await trainingRes.json());
        if (alRes.ok) setAlSuggestions(await alRes.json());
        if (aggRes.ok) setAggregation(await aggRes.json());
      } catch {
        // API not running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function runPrediction() {
    if (!compound || !selectedModel) return;
    try {
      const res = await fetch('/api/nexcore/api/v1/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: selectedModel, compound }),
      });
      if (res.ok) setPrediction(await res.json());
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading ML platform...</div>
      </div>
    );
  }

  const productionModels = models.filter((m) => m.status === 'Production');
  const platformModels = models.filter((m) => m.is_platform_model);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-light">ML Platform</h1>
        <p className="text-slate-dim text-sm mt-1">
          Model catalog, predictions, training pipelines, and federated data aggregation
        </p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim">Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-light">{models.length}</div>
            <p className="text-xs text-slate-dim">{productionModels.length} in production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim">Platform Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{platformModels.length}</div>
            <p className="text-xs text-slate-dim">Trained on aggregated data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim">Training Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{training?.queue_depth ?? 0}</div>
            <p className="text-xs text-slate-dim">{training?.active_jobs.length ?? 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {aggregation ? (aggregation.total_data_points / 1000).toFixed(0) + 'K' : '--'}
            </div>
            <p className="text-xs text-slate-dim">
              {aggregation?.contributing_tenants ?? 0} contributing tenants
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Model Catalog</TabsTrigger>
          <TabsTrigger value="predict">Run Prediction</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="active-learning">Active Learning</TabsTrigger>
          <TabsTrigger value="data">Data Aggregation</TabsTrigger>
        </TabsList>

        {/* Model Catalog */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <Card key={model.id} className={model.is_platform_model ? 'border-cyan-500/20' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{model.id} &middot; {model.version}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {statusBadge(model.status)}
                      {model.is_platform_model && (
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-xs">Platform</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-slate-dim">{model.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-dim">
                    <span>Type: <span className="text-slate-light">{model.model_type}</span></span>
                    <span>Score: <span className="text-amber-400">{(model.benchmark_score * 100).toFixed(0)}%</span></span>
                    <span>Uses: <span className="text-slate-light">{model.usage_count.toLocaleString()}</span></span>
                  </div>
                  {model.benchmark_score > 0 && (
                    <Progress value={model.benchmark_score * 100} className="h-1" />
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {model.properties_predicted.map((p) => (
                      <Badge key={p} className="bg-slate-700/50 text-slate-300 text-xs">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predict */}
        <TabsContent value="predict" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Prediction</CardTitle>
              <CardDescription>Submit a compound (SMILES) for property prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-light"
                >
                  {productionModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="SMILES (e.g., CC(=O)Oc1ccccc1C(=O)O)"
                  value={compound}
                  onChange={(e) => setCompound(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runPrediction()}
                  className="flex-1"
                />
                <Button onClick={runPrediction} disabled={!compound || !selectedModel}>
                  Predict
                </Button>
              </div>

              {prediction && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline">{prediction.model_id}</Badge>
                    <span className="text-slate-dim">{prediction.model_version}</span>
                    <span className="text-slate-dim">{prediction.inference_time_ms}ms</span>
                    <span className="text-amber-400">${(prediction.cost_cents / 100).toFixed(2)}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Classification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prediction.predictions.map((p) => (
                        <TableRow key={p.property}>
                          <TableCell className="font-medium">{p.property}</TableCell>
                          <TableCell>{p.value.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-dim text-xs">{p.unit}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={p.confidence * 100} className="h-1 w-16" />
                              <span className="text-xs">{(p.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{classificationBadge(p.classification)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training */}
        <TabsContent value="training" className="space-y-4">
          {training && (
            <>
              {training.active_jobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Training Jobs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {training.active_jobs.map((job) => (
                      <div key={job.job_id} className="p-3 rounded-lg bg-slate-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{job.job_id}</span>
                            <Badge variant="outline" className="text-xs">{job.model_type}</Badge>
                            {statusBadge(job.status)}
                          </div>
                          <span className="text-xs text-slate-dim">
                            Epoch {job.current_epoch}/{job.total_epochs}
                          </span>
                        </div>
                        <Progress value={job.progress_percent} className="h-2" />
                        <div className="flex gap-4 text-xs text-slate-dim">
                          <span>Progress: {job.progress_percent.toFixed(1)}%</span>
                          {job.best_loss != null && <span>Best loss: {job.best_loss.toFixed(4)}</span>}
                          {job.best_validation_score != null && (
                            <span>Val score: {job.best_validation_score.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Completed Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Epochs</TableHead>
                        <TableHead>Val Score</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {training.completed_recent.map((job) => (
                        <TableRow key={job.job_id}>
                          <TableCell className="text-sm">{job.job_id}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{job.model_type}</Badge></TableCell>
                          <TableCell>{statusBadge(job.status)}</TableCell>
                          <TableCell>{job.total_epochs}</TableCell>
                          <TableCell className="text-amber-400">
                            {job.best_validation_score?.toFixed(2) ?? '--'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-dim">
                            {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : '--'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Active Learning */}
        <TabsContent value="active-learning" className="space-y-4">
          {alSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle>Active Learning Suggestions</CardTitle>
                <CardDescription>
                  Strategy: {alSuggestions.strategy} &middot; Model: {alSuggestions.model_id} &middot; Pool: {alSuggestions.total_unlabeled_pool.toLocaleString()} unlabeled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alSuggestions.suggestions.map((s) => (
                  <div key={s.compound_id} className="p-3 rounded-lg bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-400">#{s.priority}</Badge>
                        <span className="font-medium text-sm">{s.compound_id}</span>
                        <code className="text-xs text-slate-dim font-mono">{s.smiles}</code>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-red-400">Uncertainty: {(s.uncertainty_score * 100).toFixed(0)}%</span>
                        <span className="text-emerald-400 ml-3">Info gain: {(s.expected_information_gain * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{s.suggested_assay}</Badge>
                      <p className="text-xs text-slate-dim">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Aggregation */}
        <TabsContent value="data" className="space-y-4">
          {aggregation && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-dim">Data Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">
                      {(aggregation.data_quality_score * 100).toFixed(0)}%
                    </div>
                    <Progress value={aggregation.data_quality_score * 100} className="mt-2 h-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-dim">Privacy Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-slate-light">
                      &epsilon; = {aggregation.privacy_budget_epsilon}
                    </div>
                    <p className="text-xs text-slate-dim mt-1">
                      &delta; = {aggregation.privacy_budget_delta} &middot; {aggregation.anonymization_method}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-dim">Next Aggregation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium text-slate-light">
                      {new Date(aggregation.next_scheduled).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-slate-dim mt-1">
                      Last: {new Date(aggregation.last_aggregation).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dataset Breakdown</CardTitle>
                  <CardDescription>
                    {aggregation.total_data_points.toLocaleString()} total data points from {aggregation.contributing_tenants} tenants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aggregation.breakdown.map((ds) => (
                    <div key={ds.dataset_type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{ds.dataset_type}</span>
                        <span className="text-slate-dim">
                          {ds.data_points.toLocaleString()} points &middot; quality {(ds.quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={(ds.data_points / aggregation.total_data_points) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
