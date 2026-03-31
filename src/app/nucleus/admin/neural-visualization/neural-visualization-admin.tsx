'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Zap,
  ChevronLeft,
  Settings,
  Eye,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const NeuralManifoldVisualization = dynamic(
  () => import('@/components/visualizations/neural-manifold/NeuralManifoldVisualization'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    ),
  }
);

const SparseCodingCalculator = dynamic(
  () => import('@/components/sparse-coding/SparseCodingCalculator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    ),
  }
);

interface ComponentStatus {
  name: string;
  path: string;
  status: 'active' | 'beta' | 'deprecated';
  lastUpdated: string;
  description: string;
  academyIntegration: boolean;
  previewPath: string;
}

const COMPONENT_STATUS: ComponentStatus[] = [
  {
    name: 'Sparse Coding Calculator',
    path: '/components/SparseCodingCalculator.tsx',
    status: 'active',
    lastUpdated: '2024-12-01',
    description:
      'Thermodynamic analysis tool comparing sparse vs dense neural coding efficiency using Landauer principle and Shannon entropy calculations.',
    academyIntegration: true,
    previewPath: '/design-system/sparse-coding',
  },
  {
    name: 'Neural Manifold Visualization',
    path: '/components/NeuralManifoldVisualization.tsx',
    status: 'active',
    lastUpdated: '2024-12-01',
    description:
      'Three.js 3D visualization of high-dimensional neural state space with 4 visualization modes.',
    academyIntegration: false,
    previewPath: '/design-system/neural-manifold',
  },
  {
    name: 'Neural Circuit Background',
    path: '/components/effects/neural-circuit/',
    status: 'active',
    lastUpdated: '2024-11-15',
    description:
      'Canvas 2D animation simulating neural signal transmission for page backgrounds.',
    academyIntegration: false,
    previewPath: '/design-system',
  },
];

export function NeuralVisualizationAdmin() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [highlightDemo, setHighlightDemo] = useState<string | undefined>();

  return (
    <div className="min-h-screen bg-nex-deep">
      {/* Header */}
      <header className="border-b border-nex-light bg-nex-surface/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/nucleus/admin"
              className="flex items-center gap-2 text-sm text-slate-dim hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Admin Dashboard
            </Link>
            <div className="h-6 w-px bg-nex-light" />
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan" />
              <span className="font-medium text-white">
                Neural Visualization Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/nucleus/academy/interactive/sparse-coding">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Academy Module
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6 bg-nex-surface">
            <TabsTrigger value="overview" className="gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sparse-coding" className="gap-2">
              <Zap className="h-4 w-4" />
              Sparse Coding
            </TabsTrigger>
            <TabsTrigger value="manifold" className="gap-2">
              <Brain className="h-4 w-4" />
              Neural Manifold
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Component Status Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {COMPONENT_STATUS.map((component) => (
                <Card
                  key={component.name}
                  className="border-nex-light bg-nex-surface"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">
                        {component.name}
                      </CardTitle>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          component.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : component.status === 'beta'
                              ? 'bg-gold/20 text-gold'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {component.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-dim">
                      {component.description}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-dim">Path:</span>
                        <code className="text-cyan">{component.path}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-dim">Last Updated:</span>
                        <span className="text-white">{component.lastUpdated}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-dim">Academy Integration:</span>
                        {component.academyIntegration ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-slate-dim" />
                        )}
                      </div>
                    </div>
                    <Link href={component.previewPath}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Links */}
            <Card className="border-cyan/20 bg-nex-surface">
              <CardHeader>
                <CardTitle className="text-white">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Link href="/nucleus/academy/interactive/sparse-coding">
                    <div className="flex items-center gap-3 rounded-lg bg-nex-deep/50 p-4 transition-colors hover:bg-nex-deep">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10">
                        <Zap className="h-5 w-5 text-cyan" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Academy: Sparse Coding Module
                        </p>
                        <p className="text-sm text-slate-dim">
                          Interactive learning experience with guided walkthrough
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/design-system/sparse-coding">
                    <div className="flex items-center gap-3 rounded-lg bg-nex-deep/50 p-4 transition-colors hover:bg-nex-deep">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                        <Settings className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Design System: Component Preview
                        </p>
                        <p className="text-sm text-slate-dim">
                          Standalone calculator without learning wrapper
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sparse-coding" className="space-y-6">
            {/* Highlight Demo Controls */}
            <Card className="border-nex-light bg-nex-surface">
              <CardHeader>
                <CardTitle className="text-white">
                  Highlight Section Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-dim">
                  Test the guided walkthrough highlighting by selecting a section:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: undefined, label: 'None' },
                    { id: 'brain-power', label: 'Brain Power' },
                    { id: 'activation-sliders', label: 'Activation Sliders' },
                    { id: 'efficiency-comparison', label: 'Efficiency Comparison' },
                    { id: 'landauer-table', label: 'Landauer Table' },
                  ].map((section) => (
                    <Button
                      key={section.label}
                      variant={highlightDemo === section.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHighlightDemo(section.id)}
                      className={
                        highlightDemo === section.id
                          ? 'bg-cyan text-nex-deep'
                          : ''
                      }
                    >
                      {section.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calculator Preview */}
            <Card className="border-nex-light bg-nex-surface">
              <CardHeader>
                <CardTitle className="text-white">Calculator Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto">
                  <SparseCodingCalculator highlightSection={highlightDemo} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manifold" className="space-y-6">
            <Card className="border-nex-light bg-nex-surface">
              <CardHeader>
                <CardTitle className="text-white">
                  Neural Manifold Visualization Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <NeuralManifoldVisualization />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
