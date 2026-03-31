'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FlaskConical, FileCheck, Layers, AlertTriangle, RefreshCw } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getFunctionalAreas } from '../ksb-management/actions';
import { getPVDomains } from '../pv-domains/actions';
import { getEPAs, getCPAs } from '@/lib/actions/framework-compat';
import type { FunctionalArea } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
const log = logger.scope('framework/page');

// Icon mapping for functional areas
const areaIcons = {
  Shield,
  FlaskConical,
  FileCheck,
  Layers,
};

export default function FrameworkBrowserPage() {
  const [functionalAreas, setFunctionalAreas] = useState<FunctionalArea[]>([]);
  const [actualCounts, setActualCounts] = useState<{
    domains: number;
    epas: number;
    cpas: number;
  }>({ domains: 0, epas: 0, cpas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      // Fetch functional areas and actual counts in parallel
      const [areas, domains, epas, cpas] = await Promise.all([
        getFunctionalAreas().catch((e) => {
          log.error('Error fetching functional areas:', e);
          return [];
        }),
        getPVDomains().catch((e) => {
          log.error('Error fetching PV domains:', e);
          return [];
        }),
        getEPAs().catch((e) => {
          log.error('Error fetching EPAs:', e);
          return [];
        }),
        getCPAs().catch((e) => {
          log.error('Error fetching CPAs:', e);
          return [];
        }),
      ]);
      setFunctionalAreas(areas);
      setActualCounts({
        domains: domains.length,
        epas: epas.length,
        cpas: cpas.length,
      });

      // Check if we got data - if all arrays are empty, there might be an auth issue
      if (areas.length === 0 && domains.length === 0 && epas.length === 0 && cpas.length === 0) {
        setError('Unable to load framework data. Please ensure you are logged in as an admin.');
      }
    } catch (error) {
      log.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load framework data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <VoiceLoading
        context="admin"
        variant="fullpage"
        message="Retrieving framework data..."
      />
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nucleus/admin/academy">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Academy Admin
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Framework</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error}</p>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Framework Browser</h1>
          <p className="text-slate-dim">
            Browse Domains, EPAs, and CPAs by functional area
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/nucleus/admin/academy">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Academy Admin
          </Link>
        </Button>
      </div>

      {/* Functional Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {functionalAreas.map((area) => {
          const IconComponent = areaIcons[area.icon as keyof typeof areaIcons] || Layers;
          const isActive = area.status === 'active';

          return (
            <Card
              key={area.area_id}
              className={`bg-nex-surface border border-nex-light rounded-lg flex flex-col ${
                !isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <IconComponent className="h-8 w-8 text-cyan" />
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {area.status === 'active' ? 'Active' : 'Coming Soon'}
                  </Badge>
                </div>
                <CardTitle className="text-slate-light">{area.area_name}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.domains : area.total_domains}
                    </div>
                    <div className="text-xs text-slate-dim">Domains</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.epas : area.total_epas}
                    </div>
                    <div className="text-xs text-slate-dim">EPAs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.cpas : area.total_cpas}
                    </div>
                    <div className="text-xs text-slate-dim">CPAs</div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  asChild
                  className="w-full"
                  disabled={!isActive}
                >
                  <Link href={`/nucleus/admin/academy/framework/${area.area_id}`}>
                    {isActive ? 'Browse Framework' : 'Coming Soon'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
