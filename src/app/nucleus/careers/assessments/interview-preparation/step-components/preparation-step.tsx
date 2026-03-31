'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  ChevronLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
  Globe,
  Building2,
  Network,
  Loader2,
  MessageSquare,
  Target,
  AlertCircle
} from 'lucide-react';
import { OUTPUT_TEMPLATES, RESEARCH_AREAS, INTERVIEW_PRINCIPLES } from '../due-diligence-data';

interface AllResponses {
  ecosystem: Record<string, string>;
  company: Record<string, string>;
  sector: Record<string, string>;
}

interface PreparationStepProps {
  allResponses: AllResponses;
  companyName: string;
  onBack: () => void;
  onComplete: () => void;
}

interface GeneratedOutput {
  templateId: string;
  content: string;
}

export function PreparationStep({ allResponses, companyName, onBack, onComplete }: PreparationStepProps) {
  const [activeTemplate, setActiveTemplate] = useState('preparation-brief');
  const [, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    generateAllOutputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAllOutputs = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const outputs: GeneratedOutput[] = OUTPUT_TEMPLATES.map(template => ({
      templateId: template.id,
      content: generateContent(template.id, allResponses, companyName)
    }));

    setGeneratedOutputs(outputs);

    const edited: Record<string, string> = {};
    outputs.forEach(o => {
      edited[o.templateId] = o.content;
    });
    setEditedContent(edited);

    setIsGenerating(false);
  };

  const generateContent = (templateId: string, responses: AllResponses, company: string): string => {
    const ecosystemPoints = Object.values(responses.ecosystem).filter(v => v.trim().length > 0);
    const companyPoints = Object.values(responses.company).filter(v => v.trim().length > 0);
    const sectorPoints = Object.values(responses.sector).filter(v => v.trim().length > 0);

    const displayName = company || '[Company Name]';

    switch (templateId) {
      case 'preparation-brief':
        return `INTERVIEW PREPARATION BRIEF: ${displayName}
${'='.repeat(50)}

ECOSYSTEM CONTEXT
${ecosystemPoints.length > 0 ? ecosystemPoints.map(p => `• ${p.substring(0, 150)}${p.length > 150 ? '...' : ''}`).join('\n') : '• [Research needed]'}

COMPANY OVERVIEW
${companyPoints.length > 0 ? companyPoints.map(p => `• ${p.substring(0, 150)}${p.length > 150 ? '...' : ''}`).join('\n') : '• [Research needed]'}

SECTOR LANDSCAPE
${sectorPoints.length > 0 ? sectorPoints.map(p => `• ${p.substring(0, 150)}${p.length > 150 ? '...' : ''}`).join('\n') : '• [Research needed]'}

KEY TAKEAWAYS
• Research completion: ${ecosystemPoints.length + companyPoints.length + sectorPoints.length}/12 areas
• Primary focus areas for discussion: [Add based on your research gaps]
• Potential value alignment: [Connect your NECS to their needs]`;

      case 'discussion-questions':
        return `DISCUSSION QUESTIONS FOR ${displayName}
${'='.repeat(50)}

ECOSYSTEM UNDERSTANDING
1. "I noticed [ecosystem insight]. How has that affected your PV priorities?"
2. "What trends in the industry are you watching most closely?"
3. "How do you see the regulatory landscape evolving for your products?"

COMPANY-SPECIFIC
${companyPoints.length > 0
  ? `1. "I read about [recent event]. How has that impacted your safety strategy?"
2. "What's the current structure of your drug safety function?"
3. "What would success look like for this role/engagement in the first 90 days?"`
  : '1. [Research company events to craft specific questions]\n2. [Research team structure]\n3. [Research current challenges]'}

SECTOR & COMPETITIVE
1. "How do you differentiate your safety approach from competitors?"
2. "What therapeutic area challenges are you prioritizing?"
3. "How are you thinking about [sector innovation] from a safety perspective?"

ACTIVE LISTENING PROMPTS
• "Tell me more about..."
• "What's driving that priority?"
• "How did you arrive at that approach?"
• "What would be most helpful to discuss today?"`;

      case 'value-alignment':
        return `VALUE ALIGNMENT MAP: ${displayName}
${'='.repeat(50)}

THEIR LIKELY NEEDS (based on research)
${companyPoints.length > 0
  ? `• [Infer from company research]
• [Infer from sector challenges]
• [Infer from ecosystem position]`
  : '• [Complete research to identify needs]'}

MY RELEVANT VALUE (connect to NECS)
NETWORKS: How can my connections help them?
• [List relevant network value]

EXPERTISE: What experience maps to their challenges?
• [List relevant expertise]

CREDIBILITY: What outcomes demonstrate my capability?
• [List relevant track record]

SUPPORT: What ongoing value can I provide?
• [List advisory value]

CONVERSATION HOOKS
• If they mention [challenge], I can share [relevant experience]
• If they ask about [topic], I should highlight [specific value]
• My unique differentiator for them is [specific advantage]`;

      case 'research-checklist': {
        const gaps: string[] = [];
        const complete: string[] = [];

        RESEARCH_AREAS.forEach(area => {
          area.prompts.forEach(prompt => {
            const response = responses[area.id as keyof AllResponses][prompt.id];
            if (!response || response.trim().length < 30) {
              gaps.push(`[ ] ${area.title}: ${prompt.question}`);
            } else {
              complete.push(`[x] ${area.title}: ${prompt.question}`);
            }
          });
        });

        return `RESEARCH CHECKLIST: ${displayName}
${'='.repeat(50)}

COMPLETED RESEARCH
${complete.length > 0 ? complete.join('\n') : '• No items completed yet'}

OUTSTANDING ITEMS
${gaps.length > 0 ? gaps.join('\n') : '• All items complete!'}

NEXT STEPS
• ${gaps.length > 0 ? `Complete ${gaps.length} remaining research items` : 'Research complete - review and refine'}
• Schedule research time: ___
• Meeting date: ___
• Preparation review: 30 min before meeting`;
      }

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
    a.download = `interview-prep-${companyName || 'company'}.txt`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCompletionStats = () => {
    const areas = ['ecosystem', 'company', 'sector'] as const;
    return areas.map(areaId => {
      const responses = allResponses[areaId];
      const area = RESEARCH_AREAS.find(a => a.id === areaId) ?? RESEARCH_AREAS[0];
      const filledCount = Object.values(responses).filter(v => v.trim().length >= 30).length;
      return {
        id: areaId,
        title: area.title,
        filled: filledCount,
        total: area.prompts.length
      };
    });
  };

  const stats = getCompletionStats();
  const totalCompleted = stats.reduce((sum, s) => sum + s.filled, 0);
  const totalItems = stats.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-xl">
          <FileText className="h-8 w-8 text-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Your Preparation Brief</h2>
          <p className="text-muted-foreground mt-1">
            {companyName ? `Research summary for ${companyName}` : 'Generated from your research'}
          </p>
        </div>
      </div>

      {/* Research Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(stat => {
          const icons = {
            ecosystem: Globe,
            company: Building2,
            sector: Network
          };
          const Icon = icons[stat.id as keyof typeof icons];
          const colors = {
            ecosystem: 'text-cyan',
            company: 'text-purple-400',
            sector: 'text-gold'
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

      {/* Interview Principles Reminder */}
      <Card className="bg-gold/5 border-gold/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gold">
            <MessageSquare className="h-4 w-4" />
            {INTERVIEW_PRINCIPLES.activeListening.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-2">
            {INTERVIEW_PRINCIPLES.activeListening.description}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {INTERVIEW_PRINCIPLES.activeListening.practices.slice(0, 2).map((practice, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gold">•</span>
                {practice}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Completeness Warning */}
      {totalCompleted < totalItems && (
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Research Incomplete</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ve completed {totalCompleted} of {totalItems} research areas.
                More thorough research leads to better conversations and demonstrates preparation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="text-muted-foreground">Generating your preparation materials...</p>
            </div>
          ) : (
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className="grid grid-cols-4 mb-4">
                {OUTPUT_TEMPLATES.map(template => {
                  const icons = {
                    'preparation-brief': FileText,
                    'discussion-questions': MessageSquare,
                    'value-alignment': Target,
                    'research-checklist': Check
                  };
                  const Icon = icons[template.id as keyof typeof icons] || FileText;

                  return (
                    <TabsTrigger key={template.id} value={template.id} className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {template.name.split(' ')[0]}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {OUTPUT_TEMPLATES.map(template => (
                <TabsContent key={template.id} value={template.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.useCase}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.format}
                    </Badge>
                  </div>

                  <Textarea
                    value={editedContent[template.id] || ''}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      [template.id]: e.target.value
                    })}
                    className="min-h-[300px] bg-nex-dark border-nex-border font-mono text-sm"
                    rows={15}
                  />

                  <div className="flex justify-end">
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
          Back to Sector Research
        </Button>
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-cyan to-purple-500 text-white hover:opacity-90"
        >
          Complete Preparation
          <FileText className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
