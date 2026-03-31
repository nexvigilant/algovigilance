'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Link2, Search, Loader2 } from 'lucide-react';
import { getKSBsForBuilder } from '@/lib/actions/ksb-builder';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface PrerequisitesSelectorProps {
  prerequisites: string[];
  onChange: (prerequisites: string[]) => void;
  currentDomain: string;
  currentKSBId?: string;
}

export function PrerequisitesSelector({
  prerequisites,
  onChange,
  currentDomain,
  currentKSBId,
}: PrerequisitesSelectorProps) {
  const [availableKSBs, setAvailableKSBs] = useState<CapabilityComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKSB, setSelectedKSB] = useState<string>('');

  useEffect(() => {
    if (currentDomain) {
      loadKSBs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDomain]);

  const loadKSBs = async () => {
    setLoading(true);
    const result = await getKSBsForBuilder(currentDomain);
    if (result.success && result.ksbs) {
      // Filter out current KSB to prevent self-reference
      const filtered = result.ksbs.filter((ksb) => ksb.id !== currentKSBId);
      setAvailableKSBs(filtered);
    }
    setLoading(false);
  };

  const addPrerequisite = (ksbId: string) => {
    if (ksbId && !prerequisites.includes(ksbId)) {
      onChange([...prerequisites, ksbId]);
    }
    setSelectedKSB('');
  };

  const removePrerequisite = (ksbId: string) => {
    onChange(prerequisites.filter((id) => id !== ksbId));
  };

  const getKSBName = (ksbId: string) => {
    const ksb = availableKSBs.find((k) => k.id === ksbId);
    return ksb?.itemName || ksbId;
  };

  const getKSBType = (ksbId: string) => {
    const ksb = availableKSBs.find((k) => k.id === ksbId);
    return ksb?.type || 'unknown';
  };

  const filteredKSBs = availableKSBs.filter(
    (ksb) =>
      !prerequisites.includes(ksb.id) &&
      (ksb.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ksb.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Prerequisites ({prerequisites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current prerequisites */}
        {prerequisites.length > 0 && (
          <div className="space-y-2">
            {prerequisites.map((prereqId) => (
              <div
                key={prereqId}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getKSBType(prereqId).charAt(0).toUpperCase()}
                  </Badge>
                  <span className="text-sm truncate max-w-[250px]">{getKSBName(prereqId)}</span>
                </div>
                <Button
                  onClick={() => removePrerequisite(prereqId)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add prerequisite */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search KSBs..."
              className="pl-8"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading KSBs...</span>
            </div>
          ) : (
            <Select value={selectedKSB} onValueChange={setSelectedKSB}>
              <SelectTrigger>
                <SelectValue placeholder="Select a prerequisite KSB" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredKSBs.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    {searchTerm
                      ? 'No matching KSBs found'
                      : availableKSBs.length === 0
                        ? 'No KSBs available in this domain'
                        : 'All KSBs already added'}
                  </div>
                ) : (
                  filteredKSBs.slice(0, 50).map((ksb) => (
                    <SelectItem key={ksb.id} value={ksb.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {ksb.type.charAt(0).toUpperCase()}
                        </Badge>
                        <span className="truncate">{ksb.itemName}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => addPrerequisite(selectedKSB)}
            size="sm"
            disabled={!selectedKSB}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Prerequisite
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Prerequisites are KSBs that learners should complete before this one.
        </p>
      </CardContent>
    </Card>
  );
}

export default PrerequisitesSelector;
