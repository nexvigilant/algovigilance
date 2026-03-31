'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, RefreshCw, Search, ExternalLink, Award, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllCertificates, toggleCertificateRevocation, getCertificateStats, type CertificateWithDetails } from './actions';
import { toDateFromSerialized, type SerializedTimestamp } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('certificates/page');
const STATUS_FILTER_VALUES = ['all', 'active', 'revoked'] as const;

type CertificateStatusFilter = (typeof STATUS_FILTER_VALUES)[number];
type CertificateDateInput = SerializedTimestamp | Date | string | number | null | undefined;

function isCertificateStatusFilter(value: string): value is CertificateStatusFilter {
  return (STATUS_FILTER_VALUES as readonly string[]).includes(value);
}

export default function CertificateManagementPage() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<CertificateStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revoked: 0,
    issuedThisMonth: 0,
  });

  // Fetch certificates
  async function fetchCertificates() {
    setLoading(true);
    setError(null);

    try {
      const [certsResult, statsResult] = await Promise.all([
        getAllCertificates({ status: statusFilter, searchTerm }),
        getCertificateStats(),
      ]);

      if (!certsResult.success) {
        setError(certsResult.error || 'Failed to fetch certificates');
        return;
      }

      if (!statsResult.success) {
        log.error('Failed to fetch stats:', statsResult.error);
      } else if (statsResult.stats) {
        setStats(statsResult.stats);
      }

      setCertificates(certsResult.certificates || []);
      setFilteredCertificates(certsResult.certificates || []);
    } catch (err) {
      log.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCertificates(certificates);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = certificates.filter(cert =>
      cert.certificateNumber.toLowerCase().includes(searchLower) ||
      cert.userName?.toLowerCase().includes(searchLower) ||
      cert.userEmail?.toLowerCase().includes(searchLower) ||
      cert.courseName?.toLowerCase().includes(searchLower)
    );
    setFilteredCertificates(filtered);
  }, [searchTerm, certificates]);

  // Toggle revocation
  async function handleToggleRevocation(certificateId: string, currentlyRevoked: boolean) {
    setError(null);
    setSuccess(null);

    try {
      // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Refresh must run after successful status mutation.
      const result = await toggleCertificateRevocation(certificateId, !currentlyRevoked);

      if (!result.success) {
        setError(result.error || 'Failed to update certificate');
        return;
      }

      setSuccess(currentlyRevoked ? 'Certificate reactivated' : 'Certificate revoked');

      // Refresh data
      await fetchCertificates();
    } catch (err) {
      log.error('Error toggling revocation:', err);
      setError('Failed to update certificate');
    }
  }

  // Format date
  function formatDate(timestamp: CertificateDateInput): string {
    if (!timestamp) return 'N/A';
    const date =
      timestamp instanceof Date
        ? timestamp
        : typeof timestamp === 'string' || typeof timestamp === 'number'
          ? new Date(timestamp)
          : toDateFromSerialized(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nucleus/admin/academy">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Academy Admin
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Certificate Management</h1>
            <p className="text-slate-dim">
              View and manage all issued capability verifications
            </p>
          </div>
          <Button onClick={fetchCertificates} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Total Certificates</CardDescription>
            <CardTitle className="text-3xl text-slate-light">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-slate-dim">
              <Award className="mr-1 h-3 w-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Active</CardDescription>
            <CardTitle className="text-3xl text-green-400 text-slate-light">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-slate-dim">
              <CheckCircle className="mr-1 h-3 w-3" />
              Valid certificates
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">Revoked</CardDescription>
            <CardTitle className="text-3xl text-red-400 text-slate-light">{stats.revoked}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-slate-dim">
              <XCircle className="mr-1 h-3 w-3" />
              Invalidated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-dim">This Month</CardDescription>
            <CardTitle className="text-3xl text-cyan-400 text-slate-light">{stats.issuedThisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-slate-dim">
              <Award className="mr-1 h-3 w-3" />
              Recently issued
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-500/10 text-green-400">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-slate-light">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
                <Input
                  placeholder="Search by certificate number, user name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (isCertificateStatusFilter(value)) {
                    setStatusFilter(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certificates</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="revoked">Revoked Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-light">Certificates ({filteredCertificates.length})</CardTitle>
          <CardDescription className="text-slate-dim">
            All issued capability verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-dim">
              Loading certificates...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-slate-dim">
              {searchTerm ? 'No certificates match your search' : 'No certificates found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Issued certificates">
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate #</TableHead>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificateNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.userName || 'Unknown'}</div>
                          <div className="text-xs text-slate-dim">{cert.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={cert.courseName}>
                          {cert.courseName || 'Unknown Course'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                      <TableCell>
                        {cert.isRevoked ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/verify/${cert.certificateNumber}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant={cert.isRevoked ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => handleToggleRevocation(cert.id, cert.isRevoked)}
                          >
                            {cert.isRevoked ? (
                              <>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Reactivate
                              </>
                            ) : (
                              <>
                                <Ban className="mr-1 h-4 w-4" />
                                Revoke
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
