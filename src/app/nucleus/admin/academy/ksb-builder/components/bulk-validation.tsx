'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { getKSBsForDomain, validateQualityGates } from '@/lib/actions/ksb-builder';
import { PRODUCTION_THRESHOLDS } from '../constants';
import type { CapabilityComponent } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('components/bulk-validation');

interface ValidationResult {
  ksbId: string;
  ksbName: string;
  domainId: string;
  passed: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  ksb: CapabilityComponent; // Store full KSB for selection
}

interface BulkValidationProps {
  onSelectKSB?: (ksb: CapabilityComponent) => void;
}

export function BulkValidation({ onSelectKSB }: BulkValidationProps) {
  const [running, setRunning] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalKSBs, setTotalKSBs] = useState(0);

  const domains = [
    { id: 'D01', name: 'Safety Case Management' },
    { id: 'D02', name: 'Signal Detection' },
    { id: 'D03', name: 'Risk Management' },
    { id: 'D04', name: 'Regulatory Reporting' },
    { id: 'D05', name: 'Medical Writing' },
    { id: 'D06', name: 'Data Management' },
    { id: 'D07', name: 'Aggregate Reports' },
    { id: 'D08', name: 'Audit & Inspection' },
    { id: 'D09', name: 'System Validation' },
    { id: 'D10', name: 'Quality Systems' },
    { id: 'D11', name: 'Literature Surveillance' },
    { id: 'D12', name: 'Clinical Safety' },
    { id: 'D13', name: 'Product Safety' },
    { id: 'D14', name: 'Vendor Management' },
    { id: 'D15', name: 'AI in PV' },
  ];

  const runValidation = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    try {
      const domainsToValidate = selectedDomain === 'all'
        ? domains.map(d => d.id)
        : [selectedDomain];

      // First pass: count total KSBs
      let total = 0;
      const allKSBs: { ksb: CapabilityComponent; domainId: string }[] = [];

      for (const domainId of domainsToValidate) {
        const result = await getKSBsForDomain(domainId);
        if (result.success && result.ksbs) {
          result.ksbs.forEach(ksb => {
            allKSBs.push({ ksb, domainId });
          });
          total += result.ksbs.length;
        }
      }

      setTotalKSBs(total);

      // Second pass: validate each KSB
      const validationResults: ValidationResult[] = [];
      let processed = 0;

      for (const { ksb, domainId } of allKSBs) {
        const gateResult = await validateQualityGates(ksb, PRODUCTION_THRESHOLDS);

        validationResults.push({
          ksbId: ksb.id,
          ksbName: ksb.itemName,
          domainId,
          passed: gateResult.passed,
          score: gateResult.score,
          blockers: gateResult.blockers,
          warnings: gateResult.warnings,
          ksb, // Store full KSB for selection
        });

        processed++;
        setProgress(Math.round((processed / total) * 100));

        // Update results incrementally every 10 items
        if (processed % 10 === 0 || processed === total) {
          setResults([...validationResults]);
        }
      }

      setResults(validationResults);
    } catch (error) {
      log.error('Validation error:', error);
    } finally {
      setRunning(false);
    }
  };

  const exportResults = () => {
    const csv = [
      ['KSB ID', 'KSB Name', 'Domain', 'Passed', 'Score', 'Blockers', 'Warnings'].join(','),
      ...results.map(r => [
        r.ksbId,
        `"${r.ksbName.replace(/"/g, '""')}"`,
        r.domainId,
        r.passed ? 'Yes' : 'No',
        r.score,
        `"${r.blockers.join('; ').replace(/"/g, '""')}"`,
        `"${r.warnings.join('; ').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ksb-validation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Production Readiness Validation
          </h2>
          <p className="text-sm text-muted-foreground">
            Validate KSBs against production quality thresholds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {d.id} - {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runValidation} disabled={running}>
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Run Validation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress */}
      {running && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Validating KSBs...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {results.length} of {totalKSBs} processed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {results.length > 0 && !running && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Validated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passed}</div>
              <p className="text-xs text-muted-foreground">
                {results.length > 0 ? Math.round((passed / results.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <p className="text-xs text-muted-foreground">
                {results.length > 0 ? Math.round((failed / results.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}%</div>
              <p className="text-xs text-muted-foreground">
                Target: {PRODUCTION_THRESHOLDS.minCoverageScore}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && !running && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Validation Results</CardTitle>
                <CardDescription>
                  {failed} KSBs need attention before going live
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table aria-label="KSB validation results">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>KSB</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results
                    .sort((a, b) => a.score - b.score) // Show lowest scores first
                    .map((result) => (
                      <TableRow
                        key={result.ksbId}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => onSelectKSB?.(result.ksb)}
                      >
                        <TableCell>
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.domainId}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm font-medium truncate">
                              {result.ksbName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.ksbId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={result.score >= 70 ? 'default' : 'destructive'}
                          >
                            {result.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {result.blockers.length > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                {result.blockers.length} blocker{result.blockers.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {result.warnings.length > 0 && (
                              <Badge variant="outline" className="text-[10px] text-yellow-600">
                                {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Blockers Analysis */}
      {results.length > 0 && !running && failed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Common Issues
            </CardTitle>
            <CardDescription>
              Most frequent blockers preventing production readiness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                results
                  .flatMap(r => r.blockers)
                  .reduce((acc, blocker) => {
                    const key = blocker.split(':')[0].trim();
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([issue, count]) => (
                  <div key={issue} className="flex items-center justify-between">
                    <span className="text-sm">{issue}</span>
                    <Badge variant="outline">{count} KSBs</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BulkValidation;
