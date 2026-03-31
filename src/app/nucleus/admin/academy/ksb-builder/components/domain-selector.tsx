'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getDomains, getFunctionalAreas, type DomainInfo, type FunctionalAreaInfo } from '@/lib/actions/ksb-builder';

interface DomainSelectorProps {
  value: string;
  onChange: (domainId: string) => void;
  disabled?: boolean;
}

export function DomainSelector({ value, onChange, disabled }: DomainSelectorProps) {
  const [functionalAreas, setFunctionalAreas] = useState<FunctionalAreaInfo[]>([]);
  const [selectedFunctionalArea, setSelectedFunctionalArea] = useState<string>('');
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load functional areas on mount
  useEffect(() => {
    async function loadFunctionalAreas() {
      setLoadingAreas(true);
      setError(null);

      const result = await getFunctionalAreas();

      if (result.success && result.functionalAreas) {
        setFunctionalAreas(result.functionalAreas);
        // Auto-select first active functional area
        const activeArea = result.functionalAreas.find(fa => fa.status === 'active');
        if (activeArea) {
          setSelectedFunctionalArea(activeArea.id);
        }
      } else {
        setError(result.error || 'Failed to load functional areas');
      }

      setLoadingAreas(false);
    }

    loadFunctionalAreas();
  }, []);

  // Load domains when functional area changes
  useEffect(() => {
    async function loadDomains() {
      if (!selectedFunctionalArea) {
        setDomains([]);
        return;
      }

      setLoadingDomains(true);
      setError(null);

      const result = await getDomains(selectedFunctionalArea);

      if (result.success && result.domains) {
        setDomains(result.domains);
        // Auto-select first domain if none selected
        if (result.domains.length > 0 && !value) {
          onChange(result.domains[0].id);
        }
      } else {
        setError(result.error || 'Failed to load domains');
      }

      setLoadingDomains(false);
    }

    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunctionalArea]);

  // Reset domain selection when functional area changes
  const handleFunctionalAreaChange = (faId: string) => {
    setSelectedFunctionalArea(faId);
    onChange(''); // Clear domain selection
  };

  if (loadingAreas) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading functional areas...</span>
        </div>
      </div>
    );
  }

  if (error && !selectedFunctionalArea) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-red-200 rounded-md bg-red-50">
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  // Group domains by cluster if available
  const groupedDomains = domains.reduce((acc, domain) => {
    const cluster = domain.cluster || 'Other';
    if (!acc[cluster]) {
      acc[cluster] = [];
    }
    acc[cluster].push(domain);
    return acc;
  }, {} as Record<string, DomainInfo[]>);

  const clusterOrder = [
    'Clinical Development & Operations',
    'Pharmacovigilance & Drug Safety',
    'Regulatory & Medical Affairs',
    'Data Sciences & Digital Innovation',
    'Commercial, Market Access & Patient Engagement',
    'Other',
  ];

  return (
    <div className="space-y-3">
      {/* Functional Area Selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Functional Area
        </label>
        <Select
          value={selectedFunctionalArea}
          onValueChange={handleFunctionalAreaChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select functional area" />
          </SelectTrigger>
          <SelectContent>
            {functionalAreas.map((fa) => (
              <SelectItem
                key={fa.id}
                value={fa.id}
                disabled={fa.status === 'coming_soon'}
              >
                <div className="flex items-center gap-2">
                  <span>{fa.name}</span>
                  {fa.status === 'coming_soon' && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Domain Selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Domain
        </label>
        {loadingDomains ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading domains...</span>
          </div>
        ) : domains.length === 0 ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <span className="text-sm text-muted-foreground">
              {selectedFunctionalArea ? 'No domains found' : 'Select a functional area first'}
            </span>
          </div>
        ) : (
          <Select value={value} onValueChange={onChange} disabled={disabled || !selectedFunctionalArea}>
            <SelectTrigger>
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent>
              {clusterOrder.map((cluster) => {
                const clusterDomains = groupedDomains[cluster];
                if (!clusterDomains || clusterDomains.length === 0) return null;

                return (
                  <div key={cluster}>
                    {Object.keys(groupedDomains).length > 1 && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                        {cluster}
                      </div>
                    )}
                    {clusterDomains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {domain.id}
                          </Badge>
                          <span className="truncate">{domain.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export default DomainSelector;
