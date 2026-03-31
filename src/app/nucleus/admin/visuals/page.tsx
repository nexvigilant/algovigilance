'use client';

import { useState, useEffect } from 'react';
import {
  type NeuralCircuitConfig,
  DEFAULT_CONFIG,
} from '@/components/effects/deprecated/neural-circuit/NeuralCircuitBackground';
import { getVisualSettings, saveVisualSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw } from 'lucide-react';

export default function VisualSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<NeuralCircuitConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const settings = await getVisualSettings();
      // Merge with defaults to ensure all fields are present
      setConfig({ ...DEFAULT_CONFIG, ...settings });
    } catch (error) {
      toast({ title: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveVisualSettings(config);
      if (result.success) {
        toast({ title: 'Settings saved successfully', variant: 'success' });
      } else {
        toast({ title: 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig(DEFAULT_CONFIG);
    toast({ title: 'Reset to defaults (unsaved)' });
  }

  const updateConfig = (
    key: keyof NeuralCircuitConfig,
    value: number | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visual Settings</h1>
          <p className="text-muted-foreground">
            Customize the Neural Circuit background parameters.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Network Structure</CardTitle>
            <CardDescription>
              Control the density and layout of the neural grid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grid Size ({config.gridSize}px)</Label>
              <Slider
                value={[config.gridSize]}
                min={50}
                max={200}
                step={5}
                onValueChange={([v]) => updateConfig('gridSize', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Grid Jitter ({config.gridJitter}px)</Label>
              <Slider
                value={[config.gridJitter]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => updateConfig('gridJitter', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Connections ({config.maxConnections})</Label>
              <Slider
                value={[config.maxConnections]}
                min={1}
                max={8}
                step={1}
                onValueChange={([v]) => updateConfig('maxConnections', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Soma Chance ({Math.round(config.somaChance * 100)}%)
              </Label>
              <Slider
                value={[config.somaChance]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => updateConfig('somaChance', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal Activity</CardTitle>
            <CardDescription>
              Manage signal propagation and speed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Signal Speed Min ({config.signalSpeedMin})</Label>
              <Slider
                value={[config.signalSpeedMin]}
                min={0.001}
                max={0.05}
                step={0.001}
                onValueChange={([v]) => updateConfig('signalSpeedMin', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Signal Speed Max ({config.signalSpeedMax})</Label>
              <Slider
                value={[config.signalSpeedMax]}
                min={0.001}
                max={0.05}
                step={0.001}
                onValueChange={([v]) => updateConfig('signalSpeedMax', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Propagation Chance ({Math.round(config.propagationChance * 100)}
                %)
              </Label>
              <Slider
                value={[config.propagationChance]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => updateConfig('propagationChance', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Spontaneous Rate ({config.spontaneousRate})</Label>
              <Slider
                value={[config.spontaneousRate]}
                min={0}
                max={0.2}
                step={0.005}
                onValueChange={([v]) => updateConfig('spontaneousRate', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Active Signals ({config.maxActiveSignals})</Label>
              <Slider
                value={[config.maxActiveSignals]}
                min={10}
                max={200}
                step={10}
                onValueChange={([v]) => updateConfig('maxActiveSignals', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Style</CardTitle>
            <CardDescription>Adjust sizes and visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trace Width ({config.traceWidth}px)</Label>
              <Slider
                value={[config.traceWidth]}
                min={0.5}
                max={5}
                step={0.1}
                onValueChange={([v]) => updateConfig('traceWidth', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Myelin Width ({config.myelinWidth}px)</Label>
              <Slider
                value={[config.myelinWidth]}
                min={0}
                max={15}
                step={0.5}
                onValueChange={([v]) => updateConfig('myelinWidth', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Glow Radius ({config.glowRadius}px)</Label>
              <Slider
                value={[config.glowRadius]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => updateConfig('glowRadius', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Grid</Label>
              <Switch
                checked={config.enableGrid}
                onCheckedChange={(v) => updateConfig('enableGrid', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
