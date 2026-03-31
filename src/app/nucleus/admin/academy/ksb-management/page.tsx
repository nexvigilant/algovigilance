'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FlaskConical, FileCheck, Layers } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFunctionalAreas } from './actions';
import type { FunctionalArea } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
const log = logger.scope('ksb-management/page');

// Icon mapping for functional areas
const areaIcons = {
  Shield,
  FlaskConical,
  FileCheck,
  Layers,
};

export default function KSBManagementPage() {
  const [functionalAreas, setFunctionalAreas] = useState<FunctionalArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFunctionalAreas() {
      try {
        setLoading(true);
        const areas = await getFunctionalAreas();
        setFunctionalAreas(areas);
      } catch (error) {
        log.error('Error loading functional areas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFunctionalAreas();
  }, []);

  if (loading) {
    return (
      <VoiceLoading
        context="admin"
        variant="fullpage"
        message="Loading competency framework..."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">KSB Management</h1>
          <p className="text-slate-dim">
            Knowledge, Skills, and Behaviors tracking system aligned with the Universal Competency Framework
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
              className={`bg-nex-surface border border-nex-light rounded-lg relative ${
                !isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
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
                    <div className="text-2xl font-bold text-cyan">
                      {area.stats.total_ksbs}
                    </div>
                    <div className="text-xs text-slate-dim">Total KSBs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {area.stats.published_count}
                    </div>
                    <div className="text-xs text-slate-dim">Published</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {area.stats.draft_count}
                    </div>
                    <div className="text-xs text-slate-dim">Pending Review</div>
                  </div>
                </div>

                {/* KSB Type Breakdown */}
                <div className="flex gap-2 mb-4 text-sm">
                  <div className="flex-1 bg-blue-100 dark:bg-blue-900/20 rounded px-2 py-1 text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {area.stats.knowledge_count}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Knowledge</div>
                  </div>
                  <div className="flex-1 bg-purple-100 dark:bg-purple-900/20 rounded px-2 py-1 text-center">
                    <div className="font-semibold text-purple-700 dark:text-purple-300">
                      {area.stats.skills_count}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Skills</div>
                  </div>
                  <div className="flex-1 bg-orange-100 dark:bg-orange-900/20 rounded px-2 py-1 text-center">
                    <div className="font-semibold text-orange-700 dark:text-orange-300">
                      {area.stats.behaviors_count}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Behaviors</div>
                  </div>
                </div>

                {/* Framework Metadata */}
                <div className="text-xs text-slate-dim mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span>Domains:</span>
                    <span className="font-medium">{area.total_domains}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EPAs:</span>
                    <span className="font-medium">{area.total_epas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPAs:</span>
                    <span className="font-medium">{area.total_cpas}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  asChild
                  className="w-full"
                  disabled={!isActive}
                >
                  <Link href={`/nucleus/admin/academy/ksb-management/${area.area_id}`}>
                    {isActive ? 'Browse KSBs' : 'Coming Soon'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-8 rounded-lg border bg-nex-surface p-6">
        <h2 className="text-lg font-semibold mb-2">About KSB Management</h2>
        <p className="text-slate-dim mb-4">
          The KSB Management system organizes Knowledge, Skills, and Behaviors by functional area,
          with full integration to the Universal Competency Framework (Domains, EPAs, and CPAs).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Knowledge</h3>
            <p className="text-slate-dim">
              What practitioners need to know - concepts, principles, and theoretical foundations
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Skills</h3>
            <p className="text-slate-dim">
              What practitioners need to do - practical abilities and technical competencies
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-1">Behaviors</h3>
            <p className="text-slate-dim">
              How practitioners should act - professional conduct and soft skills
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
