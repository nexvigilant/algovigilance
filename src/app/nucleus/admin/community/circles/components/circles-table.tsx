'use client';

import Link from 'next/link';
import { Eye, Edit, Trash2, MoreVertical, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SmartForum } from '@/types/community';

interface CirclesTableProps {
  loading: boolean;
  filteredCircles: SmartForum[];
  onManage: (circle: SmartForum) => void;
  onStatusChange: (circleId: string, status: 'active' | 'archived' | 'draft') => void;
  onDelete: (circleId: string, name: string) => void;
}

export function CirclesTable({
  loading,
  filteredCircles,
  onManage,
  onStatusChange,
  onDelete,
}: CirclesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : filteredCircles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-dim">No circles found</p>
          </div>
        ) : (
          <Table aria-label="Community circles">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCircles.map((circle) => (
                <TableRow key={circle.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{circle.name}</div>
                      <div className="line-clamp-1 text-sm text-slate-dim">
                        {circle.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{circle.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {circle.metadata?.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge className="border-green-500/30 bg-green-500/20 text-green-500">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {circle.membership?.memberCount || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {circle.stats?.postCount || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm" title="View">
                        <Link href={`/nucleus/community/circles/${circle.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Manage"
                        onClick={() => onManage(circle)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/nucleus/admin/community/circles/${circle.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </Link>
                          </DropdownMenuItem>
                          {circle.metadata?.isArchived ? (
                            <DropdownMenuItem
                              onClick={() => onStatusChange(circle.id, 'active')}
                            >
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => onStatusChange(circle.id, 'archived')}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(circle.id, circle.name)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
