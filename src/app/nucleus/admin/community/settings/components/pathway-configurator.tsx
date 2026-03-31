'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Route,
  Plus,
  Trash2,
  Save,
  Link2,
  ShieldCheck,
  Loader2,
  Users,
  Sparkles,
} from 'lucide-react';
import { customToast } from '@/components/voice';
import {
  getPathwaySettings,
  updatePathwayMappings,
  toggleDynamicSidebar,
  getAvailableCircles,
  getAvailablePathways,
  type PathwayMapping,
  type PathwayConfiguratorSettings,
} from '../actions';

import { logger } from '@/lib/logger';
const log = logger.scope('pathway-configurator');

interface AvailableCircle {
  id: string;
  name: string;
  visibility: string;
}

interface AvailablePathway {
  id: string;
  name: string;
  domain: string;
}

export function PathwayConfigurator() {
  const [settings, setSettings] = useState<PathwayConfiguratorSettings | null>(null);
  const [circles, setCircles] = useState<AvailableCircle[]>([]);
  const [pathways, setPathways] = useState<AvailablePathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New mapping form state
  const [newMapping, setNewMapping] = useState<Partial<PathwayMapping>>({
    pathwayId: '',
    pathwayName: '',
    circleIds: [],
    requiredTrustLevel: 'standard',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsData, circlesData, pathwaysData] = await Promise.all([
        getPathwaySettings(),
        getAvailableCircles(),
        getAvailablePathways(),
      ]);
      setSettings(settingsData);
      setCircles(circlesData);
      setPathways(pathwaysData);
    } catch (error) {
      log.error('Error loading pathway configurator data:', error);
      customToast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDynamicSidebar(enabled: boolean) {
    try {
      const result = await toggleDynamicSidebar(enabled);
      if (result.success) {
        setSettings(prev => prev ? { ...prev, enableDynamicSidebar: enabled } : null);
        customToast.success(`Dynamic sidebar ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        customToast.error(result.error || 'Failed to toggle');
      }
    } catch (error) {
      customToast.error('Failed to toggle dynamic sidebar');
    }
  }

  async function handleAddMapping() {
    if (!newMapping.pathwayId || newMapping.circleIds?.length === 0) {
      customToast.error('Please select a pathway and at least one circle');
      return;
    }

    const pathway = pathways.find(p => p.id === newMapping.pathwayId);
    if (!pathway) return;

    const mapping: PathwayMapping = {
      pathwayId: newMapping.pathwayId,
      pathwayName: pathway.name,
      circleIds: newMapping.circleIds || [],
      requiredTrustLevel: newMapping.requiredTrustLevel || 'standard',
      isActive: newMapping.isActive ?? true,
    };

    const updatedMappings = [...(settings?.mappings || []), mapping];

    setSaving(true);
    try {
      const result = await updatePathwayMappings(updatedMappings);
      if (result.success) {
        setSettings(prev => prev ? { ...prev, mappings: updatedMappings } : null);
        setDialogOpen(false);
        setNewMapping({
          pathwayId: '',
          pathwayName: '',
          circleIds: [],
          requiredTrustLevel: 'standard',
          isActive: true,
        });
        customToast.success('Pathway mapping added');
      } else {
        customToast.error(result.error || 'Failed to add mapping');
      }
    } catch (error) {
      customToast.error('Failed to add mapping');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMapping(pathwayId: string) {
    const updatedMappings = settings?.mappings.filter(m => m.pathwayId !== pathwayId) || [];

    setSaving(true);
    try {
      const result = await updatePathwayMappings(updatedMappings);
      if (result.success) {
        setSettings(prev => prev ? { ...prev, mappings: updatedMappings } : null);
        customToast.success('Pathway mapping removed');
      } else {
        customToast.error(result.error || 'Failed to remove mapping');
      }
    } catch (error) {
      customToast.error('Failed to remove mapping');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleMappingActive(pathwayId: string) {
    const updatedMappings = settings?.mappings.map(m =>
      m.pathwayId === pathwayId ? { ...m, isActive: !m.isActive } : m
    ) || [];

    setSaving(true);
    try {
      const result = await updatePathwayMappings(updatedMappings);
      if (result.success) {
        setSettings(prev => prev ? { ...prev, mappings: updatedMappings } : null);
      } else {
        customToast.error(result.error || 'Failed to update mapping');
      }
    } catch (error) {
      customToast.error('Failed to update mapping');
    } finally {
      setSaving(false);
    }
  }

  const handleCircleToggle = (circleId: string) => {
    setNewMapping(prev => {
      const currentCircles = prev.circleIds || [];
      const isSelected = currentCircles.includes(circleId);
      return {
        ...prev,
        circleIds: isSelected
          ? currentCircles.filter(id => id !== circleId)
          : [...currentCircles, circleId],
      };
    });
  };

  const getTrustLevelBadge = (level: string) => {
    switch (level) {
      case 'verified':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Verified</Badge>;
      case 'expert':
        return <Badge className="bg-gold/15 text-gold border-gold/30">Expert</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-dim">Standard</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan" />
            Dynamic Sidebar Navigation
          </CardTitle>
          <CardDescription>
            Enable pathway-based navigation links in the community sidebar based on user trust levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Dynamic Sidebar</Label>
              <p className="text-sm text-muted-foreground">
                Users will see pathway-specific links based on their verification status
              </p>
            </div>
            <Switch
              checked={settings?.enableDynamicSidebar || false}
              onCheckedChange={handleToggleDynamicSidebar}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mappings Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Pathway-to-Circle Mappings
            </CardTitle>
            <CardDescription>
              Map capability pathways to circles for targeted navigation
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Pathway Mapping</DialogTitle>
                <DialogDescription>
                  Link a capability pathway to one or more circles
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Pathway Selection */}
                <div className="space-y-2">
                  <Label>Capability Pathway</Label>
                  <Select
                    value={newMapping.pathwayId}
                    onValueChange={(val) => setNewMapping(prev => ({ ...prev, pathwayId: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pathway..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pathways.map(pathway => (
                        <SelectItem key={pathway.id} value={pathway.id}>
                          <div className="flex items-center gap-2">
                            <span>{pathway.name}</span>
                            <span className="text-xs text-muted-foreground">({pathway.domain})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Circle Selection */}
                <div className="space-y-2">
                  <Label>Linked Circles</Label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                    {circles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No circles available</p>
                    ) : (
                      circles.map(circle => (
                        <div key={circle.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={circle.id}
                            checked={newMapping.circleIds?.includes(circle.id)}
                            onCheckedChange={() => handleCircleToggle(circle.id)}
                          />
                          <label
                            htmlFor={circle.id}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {circle.name}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {circle.visibility}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Trust Level */}
                <div className="space-y-2">
                  <Label>Required Trust Level</Label>
                  <Select
                    value={newMapping.requiredTrustLevel}
                    onValueChange={(val: 'standard' | 'verified' | 'expert') =>
                      setNewMapping(prev => ({ ...prev, requiredTrustLevel: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (All Users)</SelectItem>
                      <SelectItem value="verified">Verified Practitioners</SelectItem>
                      <SelectItem value="expert">Expert Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMapping} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Create Mapping
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {settings?.mappings.length === 0 ? (
            <div className="py-8 text-center">
              <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No pathway mappings configured</p>
              <p className="text-sm text-muted-foreground">
                Add a mapping to link capability pathways with community circles
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pathway</TableHead>
                  <TableHead>Linked Circles</TableHead>
                  <TableHead>Trust Level</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings?.mappings.map(mapping => (
                  <TableRow key={mapping.pathwayId}>
                    <TableCell className="font-medium">{mapping.pathwayName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mapping.circleIds.map(circleId => {
                          const circle = circles.find(c => c.id === circleId);
                          return (
                            <Badge key={circleId} variant="secondary" className="text-xs">
                              <Users className="mr-1 h-3 w-3" />
                              {circle?.name || circleId}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getTrustLevelBadge(mapping.requiredTrustLevel)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={mapping.isActive}
                        onCheckedChange={() => handleToggleMappingActive(mapping.pathwayId)}
                        disabled={saving}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMapping(mapping.pathwayId)}
                        disabled={saving}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-cyan/30 bg-cyan/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-cyan">
            <ShieldCheck className="h-4 w-4" />
            Safety Audit Active
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            All pathway mapping changes are logged to the Guardian Audit Trail for transparency
            and compliance tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
