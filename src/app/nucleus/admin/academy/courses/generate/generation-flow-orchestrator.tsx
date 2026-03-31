'use client';

import { useState, useEffect } from 'react';
import { FunctionalAreaSelector } from './functional-area-selector';
import { ComponentTypeSelector, type ComponentType } from './component-type-selector';
import { FrameworkItemSelector, type SelectedItem } from './framework-item-selector';
import { FrameworkConfigForm } from './framework-config-form';
import { GenerateFormClient } from './generate-form-client';
import { getPVDomains } from '../../pv-domains/actions';
import { getEPAs, getCPAs } from '@/lib/actions/framework-compat';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/generation-flow-orchestrator');

type FlowStep =
  | 'select-area'
  | 'select-type'
  | 'select-item'
  | 'configure'
  | 'custom';

interface GenerationFlowOrchestratorProps {
  initialMode?: 'custom';
}

export function GenerationFlowOrchestrator({ initialMode }: GenerationFlowOrchestratorProps) {
  const [step, setStep] = useState<FlowStep>(initialMode === 'custom' ? 'custom' : 'select-area');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedAreaName, setSelectedAreaName] = useState<string>('');
  const [componentType, setComponentType] = useState<ComponentType | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [counts, setCounts] = useState({ domains: 0, epas: 0, cpas: 0 });

  // Load counts when area is selected
  useEffect(() => {
    if (selectedAreaId === 'pharmacovigilance') {
      loadCounts();
    }
  }, [selectedAreaId]);

  async function loadCounts() {
    try {
      const [domains, epas, cpas] = await Promise.all([
        getPVDomains(),
        getEPAs(),
        getCPAs(),
      ]);
      setCounts({
        domains: domains.length,
        epas: epas.length,
        cpas: cpas.length,
      });
    } catch (error) {
      log.error('Error loading counts:', error);
    }
  }

  // Step 1: Select Functional Area
  if (step === 'select-area') {
    return (
      <FunctionalAreaSelector
        onSelectArea={(areaId) => {
          setSelectedAreaId(areaId);
          // Get area name based on ID
          const areaNames: Record<string, string> = {
            pharmacovigilance: 'Pharmacovigilance',
            clinical_operations: 'Clinical Operations',
            regulatory_affairs: 'Regulatory Affairs',
          };
          setSelectedAreaName(areaNames[areaId] || areaId);
          setStep('select-type');
        }}
        onSelectCustom={() => setStep('custom')}
      />
    );
  }

  // Step 2: Select Component Type (Domain/EPA/CPA)
  if (step === 'select-type' && selectedAreaId) {
    return (
      <ComponentTypeSelector
        areaName={selectedAreaName}
        counts={counts}
        onSelect={(type) => {
          setComponentType(type);
          setStep('select-item');
        }}
        onBack={() => {
          setSelectedAreaId(null);
          setStep('select-area');
        }}
      />
    );
  }

  // Step 3: Select Specific Item
  if (step === 'select-item' && selectedAreaId && componentType) {
    return (
      <FrameworkItemSelector
        areaId={selectedAreaId}
        areaName={selectedAreaName}
        componentType={componentType}
        onSelect={(item) => {
          setSelectedItem(item);
          setStep('configure');
        }}
        onBack={() => {
          setComponentType(null);
          setStep('select-type');
        }}
      />
    );
  }

  // Step 4: Configure Generation
  if (step === 'configure' && selectedItem) {
    return (
      <FrameworkConfigForm
        selectedItem={selectedItem}
        onBack={() => {
          setSelectedItem(null);
          setStep('select-item');
        }}
      />
    );
  }

  // Custom Topic Mode
  if (step === 'custom') {
    return <GenerateFormClient />;
  }

  // Fallback
  return null;
}
