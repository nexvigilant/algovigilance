'use client';

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Eye,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import type { ContentStatus, IntelligenceListItem } from '@/types/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';
import { STATUS_COLORS, TYPE_ICONS } from './constants';

interface IntelligenceContentTableProps {
  items: IntelligenceListItem[];
  loading: boolean;
  actionLoading: string | null;
  hasActiveFilters: boolean;
  onEdit: (id: string) => void;
  onView: (slug: string) => void;
  onToggleFeatured: (id: string) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export function IntelligenceContentTable({
  items,
  loading,
  actionLoading,
  hasActiveFilters,
  onEdit,
  onView,
  onToggleFeatured,
  onStatusChange,
  onDelete,
  onCreateNew,
}: IntelligenceContentTableProps) {
  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader>
        <CardTitle className="text-lg text-slate-light">
          Content ({items.length})
        </CardTitle>
        <CardDescription>
          Manage your Intelligence hub content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <VoiceLoading context="admin" variant="spinner" message="Loading content..." />
        ) : items.length === 0 ? (
          <VoiceEmptyState
            title="No content found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Create your first piece of content'
            }
            icon="FileText"
            action={
              !hasActiveFilters
                ? { label: 'Create Content', onClick: onCreateNew }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Intelligence content management table">
              <TableHeader>
                <TableRow className="border-nex-light hover:bg-transparent">
                  <TableHead className="text-slate-dim">Title</TableHead>
                  <TableHead className="text-slate-dim">Type</TableHead>
                  <TableHead className="text-slate-dim">Status</TableHead>
                  <TableHead className="text-slate-dim">Author</TableHead>
                  <TableHead className="text-slate-dim">Updated</TableHead>
                  <TableHead className="text-slate-dim w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-nex-light hover:bg-nex-dark/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.featured && (
                          <Star className="h-4 w-4 text-gold fill-gold" />
                        )}
                        <div>
                          <div className="font-medium text-slate-light line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-dim">{item.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-dim">
                        {TYPE_ICONS[item.type]}
                        <span className="capitalize">
                          {CONTENT_TYPE_CONFIG[item.type]?.label || item.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[item.status]}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-dim">{item.author}</TableCell>
                    <TableCell className="text-slate-dim text-sm">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(item.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onView(item.slug)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleFeatured(item.id)}
                          >
                            {item.featured ? (
                              <>
                                <StarOff className="h-4 w-4 mr-2" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onStatusChange(item.id, 'draft')}
                            disabled={item.status === 'draft'}
                          >
                            Set as Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(item.id, 'review')}
                            disabled={item.status === 'review'}
                          >
                            Set as Review
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(item.id, 'published')}
                            disabled={item.status === 'published'}
                          >
                            Publish
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(item.id, 'archived')}
                            disabled={item.status === 'archived'}
                          >
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(item.id)}
                            className="text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
