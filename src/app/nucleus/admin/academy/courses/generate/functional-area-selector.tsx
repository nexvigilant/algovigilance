'use client';

import { type ComponentType, useState, useEffect } from 'react';
import { Shield, FlaskConical, FileCheck, Sparkles, ArrowRight } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFunctionalAreas } from '../../ksb-management/actions';
import { getPVDomains } from '../../pv-domains/actions';
import { getEPAs, getCPAs } from '@/lib/actions/framework-compat';
import type { FunctionalArea } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/functional-area-selector');

interface FunctionalAreaSelectorProps {
  onSelectArea: (areaId: string) => void;
  onSelectCustom: () => void;
}

// Icon mapping
const areaIcons: Record<string, ComponentType<{ className?: string }>> = {
  Shield,
  FlaskConical,
  FileCheck,
};

export function FunctionalAreaSelector({ onSelectArea, onSelectCustom }: FunctionalAreaSelectorProps) {
  const [areas, setAreas] = useState<FunctionalArea[]>([]);
  const [actualCounts, setActualCounts] = useState<{
    domains: number;
    epas: number;
    cpas: number;
  }>({ domains: 0, epas: 0, cpas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [areasData, domains, epas, cpas] = await Promise.all([
          getFunctionalAreas(),
          getPVDomains(),
          getEPAs(),
          getCPAs(),
        ]);
        setAreas(areasData);
        setActualCounts({
          domains: domains.length,
          epas: epas.length,
          cpas: cpas.length,
        });
      } catch (error) {
        log.error('Error loading functional areas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <VoiceLoading context="academy" variant="spinner" message="Loading functional areas..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2">
          Generate Capability Pathway
        </h1>
        <p className="text-muted-foreground">
          Choose a functional area to generate from our established framework, or create a custom pathway from scratch.
        </p>
      </div>

      {/* Functional Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Established Functional Areas */}
        {areas.map((area) => {
          const IconComponent = areaIcons[area.icon] || Shield;
          const isActive = area.status === 'active';

          return (
            <Card
              key={area.area_id}
              className={`bg-nex-surface border border-nex-light rounded-lg flex flex-col ${!isActive ? 'opacity-60' : 'cursor-pointer hover:border-primary/50 transition-colors'}`}
              onClick={() => isActive && onSelectArea(area.area_id)}
            >
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <IconComponent className="h-8 w-8 text-primary" />
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Coming Soon'}
                  </Badge>
                </div>
                <CardTitle>{area.area_name}</CardTitle>
                <CardDescription>
                  Generate pathways aligned with our established competency framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.domains : area.total_domains}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Domains</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.epas : area.total_epas}
                    </div>
                    <div className="text-[10px] text-muted-foreground">EPAs</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {area.area_id === 'pharmacovigilance' ? actualCounts.cpas : area.total_cpas}
                    </div>
                    <div className="text-[10px] text-muted-foreground">CPAs</div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!isActive}
                  variant={isActive ? 'default' : 'secondary'}
                >
                  {isActive ? (
                    <>
                      Browse & Generate
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Coming Soon'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Custom Topic Card */}
        <Card
          className="bg-nex-surface border border-nex-light rounded-lg flex flex-col cursor-pointer hover:border-cyan-500/50 transition-colors"
          onClick={onSelectCustom}
        >
          <CardHeader className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <Sparkles className="h-8 w-8 text-cyan-500" />
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-600">
                Custom
              </Badge>
            </div>
            <CardTitle>Custom Topic</CardTitle>
            <CardDescription>
              Create a pathway from scratch for topics outside the existing framework
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Info */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Define your own topic</li>
                <li>• Set audience & duration</li>
                <li>• AI generates KSBs</li>
              </ul>
            </div>

            <Button className="w-full circuit-button">
              Start Custom
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          <strong>Framework-based generation</strong> produces higher quality pathways with pre-validated KSBs and competency alignment.
        </p>
      </div>
    </div>
  );
}
