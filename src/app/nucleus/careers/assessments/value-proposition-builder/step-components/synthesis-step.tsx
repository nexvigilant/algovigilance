'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  ChevronLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
  Users,
  Brain,
  Award,
  HandHelping,
  Loader2
} from 'lucide-react';
import { OUTPUT_TEMPLATES, NECS_DIMENSIONS } from '../value-proposition-data';

interface AllResponses {
  networks: Record<string, string>;
  expertise: Record<string, string>;
  credibility: Record<string, string>;
  support: Record<string, string>;
}

interface SynthesisStepProps {
  allResponses: AllResponses;
  onBack: () => void;
  onComplete: () => void;
}

interface GeneratedOutput {
  templateId: string;
  content: string;
}

export function SynthesisStep({ allResponses, onBack, onComplete }: SynthesisStepProps) {
  const [activeTemplate, setActiveTemplate] = useState('linkedin-summary');
  const [, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Generate initial outputs
  useEffect(() => {
    generateAllOutputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAllOutputs = async () => {
    setIsGenerating(true);

    // Simulate AI generation (in production, call API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const outputs: GeneratedOutput[] = OUTPUT_TEMPLATES.map(template => ({
      templateId: template.id,
      content: generateContent(template.id, allResponses)
    }));

    setGeneratedOutputs(outputs);

    // Initialize edited content with generated content
    const edited: Record<string, string> = {};
    outputs.forEach(o => {
      edited[o.templateId] = o.content;
    });
    setEditedContent(edited);

    setIsGenerating(false);
  };

  const generateContent = (templateId: string, responses: AllResponses): string => {
    // Extract key points from responses
    const networkPoints = Object.values(responses.networks).filter(v => v.trim().length > 0);
    const expertisePoints = Object.values(responses.expertise).filter(v => v.trim().length > 0);
    const credibilityPoints = Object.values(responses.credibility).filter(v => v.trim().length > 0);
    const supportPoints = Object.values(responses.support).filter(v => v.trim().length > 0);

    // Build summaries
    const networkSummary = networkPoints.length > 0
      ? networkPoints[0].substring(0, 100)
      : 'Extensive professional network in pharmacovigilance';
    const expertiseSummary = expertisePoints.length > 0
      ? expertisePoints[0].substring(0, 100)
      : 'Deep expertise in drug safety and regulatory compliance';
    const credibilitySummary = credibilityPoints.length > 0
      ? credibilityPoints[0].substring(0, 100)
      : 'Proven track record of delivering results';
    const supportSummary = supportPoints.length > 0
      ? supportPoints[0].substring(0, 100)
      : 'Committed to supporting organizational growth';

    switch (templateId) {
      case 'linkedin-summary':
        return `Pharmacovigilance professional with proven expertise in drug safety and regulatory compliance.

${expertiseSummary}...

My network spans ${networkPoints.length > 0 ? 'regulatory authorities, industry partners, and academic institutions' : 'key stakeholders across the pharmaceutical ecosystem'}, enabling me to connect organizations with the right people at the right time.

${credibilitySummary}...

As an advisor and mentor, I help organizations navigate complex safety challenges while building internal capabilities. ${supportSummary}...

Open to advisory opportunities in drug safety, regulatory strategy, and pharmacovigilance program development.`;

      case 'board-bio':
        return `Pharmacovigilance leader with ${expertiseSummary.substring(0, 50)}... ${credibilitySummary.substring(0, 50)}... Brings unique network value through ${networkSummary.substring(0, 40)}... Provides ongoing advisory support through ${supportSummary.substring(0, 40)}...`;

      case 'elevator-pitch':
        return `I'm a pharmacovigilance expert who helps organizations build robust safety programs. My specialty is ${expertiseSummary.substring(0, 60)}... I bring ${networkSummary.substring(0, 40)}... and a track record of ${credibilitySummary.substring(0, 40)}...`;

      case 'necs-breakdown':
        return `NETWORKS
${networkPoints.map(p => `• ${p.substring(0, 80)}...`).join('\n') || '• Professional network details to be added'}

EXPERTISE
${expertisePoints.map(p => `• ${p.substring(0, 80)}...`).join('\n') || '• Expertise details to be added'}

CREDIBILITY
${credibilityPoints.map(p => `• ${p.substring(0, 80)}...`).join('\n') || '• Credibility details to be added'}

SUPPORT
${supportPoints.map(p => `• ${p.substring(0, 80)}...`).join('\n') || '• Support offerings to be added'}`;

      default:
        return '';
    }
  };

  const handleCopy = async (templateId: string) => {
    const content = editedContent[templateId] || '';
    await navigator.clipboard.writeText(content);
    setCopied(templateId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const content = OUTPUT_TEMPLATES.map(template => {
      const output = editedContent[template.id] || '';
      return `=== ${template.name} ===\n\n${output}\n\n`;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'necs-value-proposition.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCompletionStats = () => {
    const dimensions = ['networks', 'expertise', 'credibility', 'support'] as const;
    return dimensions.map(dim => {
      const responses = allResponses[dim];
      const filledCount = Object.values(responses).filter(v => v.trim().length >= 20).length;
      const dimension = NECS_DIMENSIONS.find(d => d.id === dim) ?? NECS_DIMENSIONS[0];
      return {
        id: dim,
        title: dimension.title,
        filled: filledCount,
        total: dimension.prompts.length
      };
    });
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-xl">
          <Sparkles className="h-8 w-8 text-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Your Value Proposition</h2>
          <p className="text-muted-foreground mt-1">
            Generated from your NECS inputs - edit and export
          </p>
        </div>
      </div>

      {/* NECS Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(stat => {
          const icons = {
            networks: Users,
            expertise: Brain,
            credibility: Award,
            support: HandHelping
          };
          const Icon = icons[stat.id as keyof typeof icons];
          const colors = {
            networks: 'text-cyan',
            expertise: 'text-purple-400',
            credibility: 'text-gold',
            support: 'text-green-400'
          };

          return (
            <Card key={stat.id} className="bg-nex-surface border-nex-border">
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${colors[stat.id as keyof typeof colors]}`} />
                <p className="text-xs font-semibold text-foreground">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.filled}/{stat.total}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Output Templates */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Outputs</CardTitle>
              <CardDescription>
                Select a format, edit as needed, then copy or download
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateAllOutputs}
                disabled={isGenerating}
                className="border-nex-border"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Regenerate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-nex-border"
              >
                <Download className="h-4 w-4" />
                <span className="ml-2">Download All</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan mb-4" />
              <p className="text-muted-foreground">Generating your value propositions...</p>
            </div>
          ) : (
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className="grid grid-cols-4 mb-4">
                {OUTPUT_TEMPLATES.map(template => (
                  <TabsTrigger key={template.id} value={template.id} className="text-xs">
                    {template.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {OUTPUT_TEMPLATES.map(template => (
                <TabsContent key={template.id} value={template.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.useCase}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Max {template.maxLength} words
                    </Badge>
                  </div>

                  <Textarea
                    value={editedContent[template.id] || ''}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      [template.id]: e.target.value
                    })}
                    className="min-h-[200px] bg-nex-dark border-nex-border font-mono text-sm"
                    rows={10}
                  />

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {(editedContent[template.id] || '').split(/\s+/).filter(Boolean).length} words
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(template.id)}
                      className="border-cyan text-cyan hover:bg-cyan/10"
                    >
                      {copied === template.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-nex-border text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-cyan to-purple-500 text-white hover:opacity-90"
        >
          Complete Assessment
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
