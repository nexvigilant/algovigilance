'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Grid3X3, Target, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPVDomains } from '../../pv-domains/actions';
import { getEPAs, getCPAs, type EPA, type CPA } from '@/lib/actions/framework-compat';
import type { PVDomain } from '@/types/pv-curriculum';
import type { ComponentType } from './component-type-selector';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/framework-item-selector');

interface FrameworkItemSelectorProps {
  areaId: string;
  areaName: string;
  componentType: ComponentType;
  onSelect: (item: SelectedItem) => void;
  onBack: () => void;
}

export interface SelectedItem {
  type: ComponentType;
  id: string;
  name: string;
  description: string;
  metadata: {
    ksbCount?: number;
    primaryDomains?: string[];
    keyEPAs?: string[];
    careerStage?: string;
    tier?: string;
  };
}

const PROFICIENCY_LEVELS = [
  { value: 'all', label: 'All Levels (Comprehensive)' },
  { value: 'L1-L2', label: 'Foundation (L1-L2)' },
  { value: 'L3', label: 'Competent (L3)' },
  { value: 'L4', label: 'Proficient (L4)' },
  { value: 'L5', label: 'Expert (L5)' },
];

export function FrameworkItemSelector({
  areaId: _areaId,
  areaName,
  componentType,
  onSelect,
  onBack,
}: FrameworkItemSelectorProps) {
  const [domains, setDomains] = useState<PVDomain[]>([]);
  const [epas, setEPAs] = useState<EPA[]>([]);
  const [cpas, setCPAs] = useState<CPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (componentType === 'domain') {
          const data = await getPVDomains();
          setDomains(data);
        } else if (componentType === 'epa') {
          const data = await getEPAs();
          setEPAs(data);
        } else if (componentType === 'cpa') {
          const data = await getCPAs();
          setCPAs(data);
        }
      } catch (error) {
        log.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [componentType]);

  const getTypeConfig = () => {
    switch (componentType) {
      case 'domain':
        return {
          icon: Grid3X3,
          title: 'Select Domain',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500/10',
        };
      case 'epa':
        return {
          icon: Target,
          title: 'Select EPA',
          color: 'text-purple-600',
          bgColor: 'bg-purple-500/10',
        };
      case 'cpa':
        return {
          icon: ClipboardList,
          title: 'Select CPA',
          color: 'text-orange-600',
          bgColor: 'bg-orange-500/10',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const handleContinue = () => {
    if (!selectedId) return;

    let item: SelectedItem | null = null;

    if (componentType === 'domain') {
      const domain = domains.find(d => d.id === selectedId);
      if (domain) {
        item = {
          type: 'domain',
          id: domain.id,
          name: domain.name,
          description: domain.definition,
          metadata: {
            ksbCount: domain.totalKSBs,
          },
        };
      }
    } else if (componentType === 'epa') {
      const epa = epas.find(e => e.id === selectedId);
      if (epa) {
        item = {
          type: 'epa',
          id: epa.id,
          name: epa.name,
          description: epa.definition,
          metadata: {
            primaryDomains: epa.primaryDomains,
            careerStage: epa.careerStage,
            tier: epa.tier,
          },
        };
      }
    } else if (componentType === 'cpa') {
      const cpa = cpas.find(c => c.id === selectedId);
      if (cpa) {
        item = {
          type: 'cpa',
          id: cpa.id,
          name: cpa.name,
          description: cpa.summary,
          metadata: {
            primaryDomains: cpa.primaryDomains,
            keyEPAs: cpa.keyEPAs,
            careerStage: cpa.careerStage,
          },
        };
      }
    }

    if (item) {
      onSelect(item);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <VoiceLoading context="academy" variant="spinner" message="Loading framework items..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Component Type
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{areaName}</Badge>
          <Badge variant="secondary" className={config.bgColor}>
            <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
            {componentType.toUpperCase()}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline mb-2">
          {config.title}
        </h1>
        <p className="text-muted-foreground">
          Choose the {componentType} you want to generate a capability pathway for.
        </p>
      </div>

      {/* Proficiency Level Filter (for EPA/CPA) */}
      {(componentType === 'epa' || componentType === 'cpa') && (
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">
            Target Proficiency Level
          </label>
          <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFICIENCY_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Item List */}
      <ScrollArea className="h-[400px] rounded-lg border">
        <div className="p-4 space-y-3">
          {componentType === 'domain' && domains.map(domain => (
            <ItemCard
              key={domain.id}
              id={domain.id}
              name={domain.name}
              description={domain.definition}
              selected={selectedId === domain.id}
              onSelect={() => setSelectedId(domain.id)}
              badges={[
                { label: `${domain.totalKSBs} KSBs`, variant: 'secondary' },
                { label: `K:${domain.stats.knowledge} S:${domain.stats.skills} B:${domain.stats.behaviors}`, variant: 'outline' },
              ]}
            />
          ))}

          {componentType === 'epa' && epas.map(epa => (
            <ItemCard
              key={epa.id}
              id={epa.id}
              name={epa.name}
              description={epa.definition}
              selected={selectedId === epa.id}
              onSelect={() => setSelectedId(epa.id)}
              badges={[
                { label: epa.tier === 'core' ? 'Core' : 'Executive', variant: epa.tier === 'core' ? 'default' : 'secondary' },
                { label: epa.careerStage, variant: 'outline' },
              ]}
              metadata={`${epa.primaryDomains.length} Primary Domains`}
            />
          ))}

          {componentType === 'cpa' && cpas.map(cpa => (
            <ItemCard
              key={cpa.id}
              id={cpa.id}
              name={cpa.name}
              description={cpa.summary}
              selected={selectedId === cpa.id}
              onSelect={() => setSelectedId(cpa.id)}
              badges={[
                { label: cpa.focusArea, variant: 'secondary' },
                { label: cpa.careerStage, variant: 'outline' },
              ]}
              metadata={`${cpa.keyEPAs.length} Key EPAs • ${cpa.primaryDomains.length} Domains`}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Continue Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedId}
          className="circuit-button min-w-[200px]"
        >
          Configure Generation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Item Card Sub-component
interface ItemCardProps {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  badges?: { label: string; variant: 'default' | 'secondary' | 'outline' }[];
  metadata?: string;
}

function ItemCard({ id, name, description, selected, onSelect, badges, metadata }: ItemCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'hover:border-primary/50 hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {id}
            </Badge>
            {badges?.map((badge, idx) => (
              <Badge key={idx} variant={badge.variant} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
          {metadata && (
            <p className="text-xs text-muted-foreground mt-2">{metadata}</p>
          )}
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 ml-4" />
        )}
      </div>
    </div>
  );
}
