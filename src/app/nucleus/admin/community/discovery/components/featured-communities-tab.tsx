'use client';

import { Search, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SmartForum } from '@/types/community';

interface FeaturedCommunitiesTabProps {
  loading: boolean;
  filteredCircles: SmartForum[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onToggleFeatured: (circleId: string, currentStatus: boolean) => void;
}

export function FeaturedCommunitiesTab({
  loading,
  filteredCircles,
  searchTerm,
  onSearchChange,
  onToggleFeatured,
}: FeaturedCommunitiesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-light">Featured Communities</CardTitle>
        <CardDescription className="text-slate-dim">
          Select communities to appear in the &quot;Featured&quot; section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
            <Input
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table aria-label="Featured communities">
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Featured</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCircles.map((circle) => (
                <TableRow key={circle.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {circle.name}
                        {circle.metadata?.isFeatured && (
                          <Sparkles className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <div className="line-clamp-1 text-sm text-slate-dim">
                        {circle.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{circle.category}</Badge>
                  </TableCell>
                  <TableCell>{circle.membership?.memberCount || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={circle.metadata?.isFeatured || false}
                        onCheckedChange={() =>
                          onToggleFeatured(
                            circle.id,
                            circle.metadata?.isFeatured || false
                          )
                        }
                      />
                      <span className="text-sm text-slate-dim">
                        {circle.metadata?.isFeatured ? 'Featured' : 'Standard'}
                      </span>
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
