'use client';

import { X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpotlightPost } from '../actions';

interface SpotlightsTabProps {
  loading: boolean;
  activeSpotlights: SpotlightPost[];
  onRemove: (spotlight: SpotlightPost) => void;
}

export function SpotlightsTab({ loading, activeSpotlights, onRemove }: SpotlightsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-light">Spotlight Posts</CardTitle>
        <CardDescription className="text-slate-dim">
          Manage featured and trending posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : activeSpotlights.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-dim">
              No active spotlights. Add posts to spotlight from the Posts section.
            </p>
          </div>
        ) : (
          <Table aria-label="Spotlight posts">
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Circle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSpotlights.map((spotlight) => (
                <TableRow key={spotlight.id}>
                  <TableCell>
                    <div className="max-w-xs truncate font-medium">{spotlight.title}</div>
                  </TableCell>
                  <TableCell>{spotlight.authorName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{spotlight.circleName}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        spotlight.spotlightType === 'featured'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : spotlight.spotlightType === 'trending'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-purple-500/20 text-purple-500'
                      }
                    >
                      {spotlight.spotlightType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{spotlight.startDate.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(spotlight)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
