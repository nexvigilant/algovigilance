'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileEdit,
  Loader2,
  Eye,
  CheckCircle,
  Archive,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getDomains, getKSBsForBuilder, getDomainWorkflowStats } from '@/lib/actions/ksb-builder';
import { WorkflowStatusBadge } from '../components/workflow-status-badge';
import { WorkflowActions } from '../components/workflow-actions';
import type { CapabilityComponent, KSBContentStatus } from '@/types/pv-curriculum';
import type { DomainInfo } from '@/lib/actions/ksb-builder';

export default function ReviewQueueClient() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [ksbs, setKsbs] = useState<CapabilityComponent[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<KSBContentStatus, number>;
    readyForProduction: number;
    linkedToLibrary: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<KSBContentStatus | 'all'>('review');

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadKSBs();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  const loadDomains = async () => {
    const result = await getDomains();
    if (result.success && result.domains) {
      setDomains(result.domains);
      if (result.domains.length > 0) {
        setSelectedDomain(result.domains[0].id);
      }
    }
    setLoading(false);
  };

  const loadKSBs = async () => {
    setLoading(true);
    const result = await getKSBsForBuilder(selectedDomain);
    if (result.success && result.ksbs) {
      setKsbs(result.ksbs);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getDomainWorkflowStats(selectedDomain);
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const handleRefresh = () => {
    loadKSBs();
    loadStats();
  };

  const filteredKSBs = ksbs.filter((ksb) => {
    if (activeTab === 'all') return true;
    return (ksb.status || 'draft') === activeTab;
  });

  const statusCounts = {
    all: ksbs.length,
    draft: ksbs.filter((k) => (k.status || 'draft') === 'draft').length,
    generating: ksbs.filter((k) => k.status === 'generating').length,
    review: ksbs.filter((k) => k.status === 'review').length,
    published: ksbs.filter((k) => k.status === 'published').length,
    archived: ksbs.filter((k) => k.status === 'archived').length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Review Queue</h1>
          <p className="text-muted-foreground">
            Manage KSB content workflow and review submissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.id}: {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Draft</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Generating</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.generating}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">In Review</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-700">
                {stats.byStatus.review}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Published</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.published}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">Archived</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.archived}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({statusCounts.draft})
          </TabsTrigger>
          <TabsTrigger value="review" className="text-yellow-700">
            Review ({statusCounts.review})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({statusCounts.published})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({statusCounts.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <VoiceLoading context="academy" variant="spinner" message="Loading KSBs..." />
          ) : filteredKSBs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No KSBs in {activeTab === 'all' ? 'this domain' : `${activeTab} status`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredKSBs.map((ksb) => (
                  <Card key={ksb.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {ksb.id}
                            </Badge>
                            <WorkflowStatusBadge status={ksb.status || 'draft'} />
                            <Badge variant="secondary" className="text-xs capitalize">
                              {ksb.type}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm truncate">{ksb.itemName}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {ksb.itemDescription?.substring(0, 100)}
                            {(ksb.itemDescription?.length || 0) > 100 ? '...' : ''}
                          </p>
                          {ksb.workflow && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>v{ksb.workflow.version || 1}</span>
                              {ksb.workflow.generatedAt && (
                                <span>
                                  Generated:{' '}
                                  {new Date(ksb.workflow.generatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {user && (
                            <WorkflowActions
                              domainId={selectedDomain}
                              ksbId={ksb.id}
                              currentStatus={ksb.status || 'draft'}
                              userId={user.uid}
                              onStatusChange={handleRefresh}
                            />
                          )}
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/nucleus/admin/academy/ksb-builder?domain=${selectedDomain}&ksb=${ksb.id}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
