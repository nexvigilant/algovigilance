'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, XCircle, Link2 } from 'lucide-react';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface CoverageIndicatorProps {
  ksb: CapabilityComponent;
  showDetails?: boolean;
}

export function CoverageIndicator({ ksb, showDetails = false }: CoverageIndicatorProps) {
  const isLinked = !!ksb.ksbLibraryId;
  const coverage = ksb.coverage;
  const isReady = coverage?.readyForProduction ?? false;
  const quality = coverage?.researchQuality ?? 0;

  // Determine status
  let status: 'ready' | 'partial' | 'missing';
  let statusColor: string;
  let Icon: typeof CheckCircle2;

  if (!isLinked) {
    status = 'missing';
    statusColor = 'text-gray-400';
    Icon = XCircle;
  } else if (isReady) {
    status = 'ready';
    statusColor = 'text-green-500';
    Icon = CheckCircle2;
  } else {
    status = 'partial';
    statusColor = 'text-yellow-500';
    Icon = AlertCircle;
  }

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div className="font-medium">
        {status === 'ready' && 'Ready for Production'}
        {status === 'partial' && 'Needs Attention'}
        {status === 'missing' && 'Not Linked'}
      </div>
      {isLinked && (
        <>
          <div>Library ID: {ksb.ksbLibraryId}</div>
          <div>Quality: {quality}%</div>
          {coverage?.missingRequirements && coverage.missingRequirements.length > 0 && (
            <div className="text-yellow-300">
              Missing: {coverage.missingRequirements.join(', ')}
            </div>
          )}
        </>
      )}
      {!isLinked && (
        <div className="text-gray-300">Link this KSB to the library to enable generation</div>
      )}
    </div>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Icon className={`h-4 w-4 ${statusColor}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Icon className={`h-4 w-4 ${statusColor}`} />
              {isLinked && (
                <Badge variant="outline" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  {quality}%
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default CoverageIndicator;
