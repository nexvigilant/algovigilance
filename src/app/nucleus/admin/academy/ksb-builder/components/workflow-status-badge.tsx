'use client';

import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  Loader2,
  Eye,
  CheckCircle,
  Archive,
} from 'lucide-react';
import type { KSBContentStatus } from '@/types/pv-curriculum';

interface WorkflowStatusBadgeProps {
  status: KSBContentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  KSBContentStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon: typeof FileEdit;
  }
> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    className: 'border-gray-300 text-gray-600',
    icon: FileEdit,
  },
  generating: {
    label: 'Generating',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Loader2,
  },
  review: {
    label: 'In Review',
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Eye,
  },
  published: {
    label: 'Published',
    variant: 'default',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: Archive,
  },
};

export function WorkflowStatusBadge({
  status,
  showIcon = true,
  size = 'sm',
}: WorkflowStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {showIcon && (
        <Icon
          className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 ${
            status === 'generating' ? 'animate-spin' : ''
          }`}
        />
      )}
      {config.label}
    </Badge>
  );
}

export default WorkflowStatusBadge;
