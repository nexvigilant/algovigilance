'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Timestamp } from 'firebase/firestore';
import { useRegulatoryData } from '@/hooks/use-regulatory-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  TrendingUp,
  Filter,
  RefreshCw,
  BookOpen,
  Shield,
  Building,
  Clock,
  Loader2,
} from 'lucide-react';
import type {
  RegulatorySourceType,
  ImpactLevel,
  RegulatoryDocument,
} from '@/types/regulatory';

// Placeholder data for initial UI
const PLACEHOLDER_DOCUMENTS: RegulatoryDocument[] = [
  {
    id: '1',
    title:
      'Draft Guidance: Pharmacovigilance Considerations for Cell and Gene Therapy Products',
    sourceType: 'guidance',
    publishedDate: Timestamp.fromDate(new Date('2024-01-15')),
    status: 'draft',
    commentDeadline: Timestamp.fromDate(new Date('2024-04-15')),
    summary:
      'New guidance addressing unique safety monitoring requirements for advanced therapy products.',
    fdaCenter: 'CBER',
    productAreas: ['biologics'],
    therapeuticAreas: ['oncology', 'rare_diseases'],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    viewCount: 0,
    bookmarkCount: 0,
    documentUrl: '#',
    keywords: [],
    complianceAreas: [],
    aiAnalysis: {
      impactAssessment: 'high',
      executiveSummary: 'Placeholder summary',
      keyChanges: [],
      affectedParties: [],
      actionItems: [],
      relatedDocuments: [],
      generatedAt: Timestamp.now(),
    },
  },
  {
    id: '2',
    title: 'Warning Letter: ABC Pharma - CGMP Violations',
    sourceType: 'warning_letter',
    publishedDate: Timestamp.fromDate(new Date('2024-01-12')),
    status: 'active',
    summary:
      'Data integrity and laboratory control violations identified during inspection.',
    fdaCenter: 'CDER',
    productAreas: ['drugs'],
    complianceAreas: ['cgmp', 'data_integrity'],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    viewCount: 0,
    bookmarkCount: 0,
    documentUrl: '#',
    keywords: [],
    therapeuticAreas: [],
    aiAnalysis: {
      impactAssessment: 'medium',
      executiveSummary: 'Placeholder summary',
      keyChanges: [],
      affectedParties: [],
      actionItems: [],
      relatedDocuments: [],
      generatedAt: Timestamp.now(),
    },
  },
  {
    id: '3',
    title:
      'Safety Communication: Risk of Serious Allergic Reactions with Drug X',
    sourceType: 'safety_communication',
    publishedDate: Timestamp.fromDate(new Date('2024-01-10')),
    status: 'active',
    summary:
      'New safety information regarding anaphylaxis risk requiring label update.',
    fdaCenter: 'CDER',
    productAreas: ['drugs'],
    therapeuticAreas: ['immunology'],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    viewCount: 0,
    bookmarkCount: 0,
    documentUrl: '#',
    keywords: [],
    complianceAreas: [],
    aiAnalysis: {
      impactAssessment: 'high',
      executiveSummary: 'Placeholder summary',
      keyChanges: [],
      affectedParties: [],
      actionItems: [],
      relatedDocuments: [],
      generatedAt: Timestamp.now(),
    },
  },
];

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const SOURCE_ICONS: Record<RegulatorySourceType, typeof FileText> = {
  guidance: BookOpen,
  warning_letter: AlertTriangle,
  form_483: Shield,
  safety_communication: Bell,
  recall: AlertTriangle,
  advisory_meeting: Building,
  federal_register: FileText,
};

export function RegulatoryDashboard() {
  const { user: _user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('feed');

  // Fetch real regulatory data from openFDA
  const { documents, isLoading, error, stats, refresh } = useRegulatoryData({
    autoFetch: true,
    limit: 30,
  });

  // Combine placeholder and real data for display
  const displayDocuments =
    documents.length > 0 ? documents : PLACEHOLDER_DOCUMENTS;

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Regulatory Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered FDA monitoring with personalized alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
            <Badge variant="destructive" className="ml-2">
              3
            </Badge>
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Deadlines
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search guidances, warning letters, safety communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feed">
            <TrendingUp className="mr-2 h-4 w-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="guidances">
            <BookOpen className="mr-2 h-4 w-4" />
            Guidances
          </TabsTrigger>
          <TabsTrigger value="enforcement">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Enforcement
          </TabsTrigger>
          <TabsTrigger value="safety">
            <Shield className="mr-2 h-4 w-4" />
            Safety
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
              </CardContent>
            </Card>
          </div>

          {/* Document Feed */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="mb-2 h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              // Error state
              <Card className="border-destructive">
                <CardContent className="py-6 text-center">
                  <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-destructive" />
                  <h3 className="mb-2 font-semibold">Error Loading Data</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" onClick={refresh}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Document list
              displayDocuments.map((doc) => {
                const Icon = SOURCE_ICONS[doc.sourceType] || FileText;
                const publishedDate = new Date(
                  doc.publishedDate.seconds * 1000
                );
                const impactLevel =
                  doc.aiAnalysis?.impactAssessment || 'medium';

                return (
                  <Card
                    key={doc.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base leading-tight">
                              {doc.title}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2">
                              <span>{doc.fdaCenter}</span>
                              <span>•</span>
                              <span>{publishedDate.toLocaleDateString()}</span>
                              {doc.commentDeadline && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center text-yellow-600">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Comments due{' '}
                                    {new Date(
                                      doc.commentDeadline.seconds * 1000
                                    ).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={IMPACT_COLORS[impactLevel]}>
                          {impactLevel} impact
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {doc.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doc.productAreas?.map((area) => (
                          <Badge
                            key={area}
                            variant="outline"
                            className="text-xs"
                          >
                            {area}
                          </Badge>
                        ))}
                        {doc.therapeuticAreas?.map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="text-xs"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Data Source Info */}
          {documents.length > 0 && stats && (
            <Card className="border-dashed bg-muted/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Showing {documents.length} documents from openFDA
                    {stats.lastUpdated &&
                      ` (updated ${new Date(stats.lastUpdated).toLocaleDateString()})`}
                  </span>
                  <span>
                    Total: {stats.drugRecalls.toLocaleString()} drug recalls,{' '}
                    {stats.deviceRecalls.toLocaleString()} device recalls
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guidances" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Guidance Documents</h3>
              <p className="text-sm text-muted-foreground">
                Draft and final FDA guidances will appear here with AI-generated
                summaries.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enforcement" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Enforcement Actions</h3>
              <p className="text-sm text-muted-foreground">
                Warning letters, Form 483s, and recalls will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Safety Communications</h3>
              <p className="text-sm text-muted-foreground">
                MedWatch alerts and drug safety communications will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
