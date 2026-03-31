'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Rocket,
  ChevronLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
  Network,
  Eye,
  HeartHandshake,
  Loader2,
  Calendar,
  MessageSquare,
  Target
} from 'lucide-react';
import {
  ACTION_PLAN_TEMPLATES,
  NAVIGATOR_SECTIONS,
  HIDDEN_MARKET_PRINCIPLES,
  NETWORKING_SCRIPTS
} from '../hidden-job-market-data';

interface AllResponses {
  networkMapping: Record<string, string>;
  visibility: Record<string, string>;
  relationships: Record<string, string>;
}

interface ActionPlanStepProps {
  allResponses: AllResponses;
  onBack: () => void;
  onComplete: () => void;
}

interface GeneratedOutput {
  templateId: string;
  content: string;
}

export function ActionPlanStep({ allResponses, onBack, onComplete }: ActionPlanStepProps) {
  const [activeTemplate, setActiveTemplate] = useState('30-day-plan');
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

    const outputs: GeneratedOutput[] = ACTION_PLAN_TEMPLATES.map(template => ({
      templateId: template.id,
      content: generateContent(template.id, allResponses)
    }));

    setGeneratedOutputs(outputs);

    const edited: Record<string, string> = {};
    outputs.forEach(o => {
      edited[o.templateId] = o.content;
    });
    setEditedContent(edited);

    setIsGenerating(false);
  };

  const generateContent = (templateId: string, responses: AllResponses): string => {
    const networkPoints = Object.values(responses.networkMapping).filter(v => v.trim().length > 0);
    const visibilityPoints = Object.values(responses.visibility).filter(v => v.trim().length > 0);
    const relationshipPoints = Object.values(responses.relationships).filter(v => v.trim().length > 0);

    switch (templateId) {
      case '30-day-plan':
        return `30-DAY HIDDEN JOB MARKET ACTION PLAN
${'='.repeat(50)}

WEEK 1: ACTIVATE YOUR NETWORK
□ Reach out to 5 people from your inner circle
□ Update your LinkedIn profile with specific positioning
□ Identify 3 target companies to research
□ Review your list of potential advocates

WEEK 2: BUILD VISIBILITY
□ Publish one piece of content (article, post, or comment)
□ Research upcoming speaking opportunities
□ Join or re-engage with a professional association
□ Schedule coffee/calls with 2 connectors

WEEK 3: DEVELOP RELATIONSHIPS
□ Make 2 introductions for others (give before you ask)
□ Send value-add messages to 5 contacts (share articles, congratulate wins)
□ Identify 3 people to move from "contact" to "advocate"
□ Plan your outreach messages for Week 4

WEEK 4: STRATEGIC ASKS
□ Make 2-3 strategic asks based on your preparation
□ Follow up on all Week 1-3 outreach
□ Document what's working and adjust
□ Set goals for next 30 days

NETWORKING NOTES FROM YOUR RESPONSES:
${networkPoints.length > 0 ? networkPoints.map((p, i) => `${i + 1}. ${p.substring(0, 100)}...`).join('\n') : '• Complete the assessment to generate personalized notes'}

VISIBILITY STRATEGY NOTES:
${visibilityPoints.length > 0 ? visibilityPoints.map((p, i) => `${i + 1}. ${p.substring(0, 100)}...`).join('\n') : '• Complete the assessment to generate personalized notes'}

RELATIONSHIP DEVELOPMENT NOTES:
${relationshipPoints.length > 0 ? relationshipPoints.map((p, i) => `${i + 1}. ${p.substring(0, 100)}...`).join('\n') : '• Complete the assessment to generate personalized notes'}`;

      case 'network-tracker':
        return `NETWORK RELATIONSHIP TRACKER
${'='.repeat(50)}

INNER CIRCLE (Advocates - Contact Monthly)
| Name | Company | Last Contact | Next Action | Notes |
|------|---------|--------------|-------------|-------|
| [Add from your responses] | | | | |
| | | | | |
| | | | | |

CONNECTORS (Contact Quarterly)
| Name | Company | Last Contact | Next Action | Notes |
|------|---------|--------------|-------------|-------|
| [Add from your responses] | | | | |
| | | | | |
| | | | | |

TARGET COMPANY CONTACTS
| Company | Contact | Relationship | Next Action | Status |
|---------|---------|--------------|-------------|--------|
| [Add from your responses] | | | | |
| | | | | |
| | | | | |

RELATIONSHIP MAINTENANCE TRIGGERS:
• New job announcements → Congratulate
• Publications/presentations → Comment and share
• Industry news relevant to their work → Forward with note
• Quarterly: General check-in for top 20 contacts
• Annually: Career update to broader network

FROM YOUR NETWORK MAPPING:
${networkPoints.length > 0 ? networkPoints.join('\n\n') : '• Complete the Network Mapping section to populate this tracker'}`;

      case 'outreach-scripts':
        return `OUTREACH MESSAGE TEMPLATES
${'='.repeat(50)}

1. RECONNECTION MESSAGE
${NETWORKING_SCRIPTS.reconnection.template}

Notes: ${NETWORKING_SCRIPTS.reconnection.notes.join(' | ')}

---

2. INTRODUCTION REQUEST
${NETWORKING_SCRIPTS.introductionRequest.template}

Notes: ${NETWORKING_SCRIPTS.introductionRequest.notes.join(' | ')}

---

3. VALUE OFFER MESSAGE
${NETWORKING_SCRIPTS.valueOffer.template}

Notes: ${NETWORKING_SCRIPTS.valueOffer.notes.join(' | ')}

---

PERSONALIZATION NOTES FROM YOUR RESPONSES:

Your Positioning (use in outreach):
${visibilityPoints.length > 0 ? visibilityPoints[0]?.substring(0, 200) + '...' : '• Complete Visibility section to generate positioning'}

Your Value to Offer:
${relationshipPoints.length > 0 ? relationshipPoints[0]?.substring(0, 200) + '...' : '• Complete Relationships section to identify value offers'}`;

      case 'visibility-calendar':
        return `VISIBILITY BUILDING CALENDAR
${'='.repeat(50)}

CONTENT PLAN (Monthly Cadence)
Week 1: Share industry insight or commentary
Week 2: Engage with others' content (thoughtful comments)
Week 3: Original content (article, case reflection, lesson learned)
Week 4: Professional update or milestone sharing

SPEAKING OPPORTUNITIES TO PURSUE:
□ Conference: [DIA, ISOP, ICPE - add specific dates]
□ Webinar: [Company or association opportunities]
□ Internal: [Company PV days, department meetings]
□ Association: [Chapter meetings, working groups]

ASSOCIATION INVOLVEMENT:
□ Committee participation: [Specific committee goals]
□ Event attendance: [Key events for next 6 months]
□ Leadership roles: [Opportunities to pursue]

CONTENT IDEAS FROM YOUR RESPONSES:
${visibilityPoints.length > 0 ? visibilityPoints.map((p, i) => `${i + 1}. ${p.substring(0, 150)}...`).join('\n') : '• Complete Visibility section to generate content ideas'}

POSITIONING STATEMENT:
${visibilityPoints.length > 0 ? `"${visibilityPoints[0]?.substring(0, 200)}..."` : '• Define what you want to be known for'}

MINDSET REMINDER:
"${HIDDEN_MARKET_PRINCIPLES.mindsetShift.from}" → "${HIDDEN_MARKET_PRINCIPLES.mindsetShift.to}"`;

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
    const content = ACTION_PLAN_TEMPLATES.map(template => {
      const output = editedContent[template.id] || '';
      return `=== ${template.name} ===\n\n${output}\n\n`;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hidden-job-market-action-plan.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCompletionStats = () => {
    const sections = [
      { id: 'networkMapping', key: 'network-mapping' },
      { id: 'visibility', key: 'visibility' },
      { id: 'relationships', key: 'relationships' }
    ] as const;

    return sections.map(s => {
      const responses = allResponses[s.id];
      const section = NAVIGATOR_SECTIONS.find(sec => sec.id === s.key) ?? NAVIGATOR_SECTIONS[0];
      const filledCount = Object.values(responses).filter(v => v.trim().length >= 30).length;
      return {
        id: s.key,
        title: section.title,
        filled: filledCount,
        total: section.prompts.length
      };
    });
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-xl">
          <Rocket className="h-8 w-8 text-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Your Action Plan</h2>
          <p className="text-muted-foreground mt-1">
            Concrete steps to access the hidden job market
          </p>
        </div>
      </div>

      {/* Section Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(stat => {
          const icons = {
            'network-mapping': Network,
            visibility: Eye,
            relationships: HeartHandshake
          };
          const Icon = icons[stat.id as keyof typeof icons];
          const colors = {
            'network-mapping': 'text-cyan',
            visibility: 'text-purple-400',
            relationships: 'text-gold'
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

      {/* Mindset Reminder */}
      <Card className="bg-gold/5 border-gold/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gold">
            <Target className="h-4 w-4" />
            {HIDDEN_MARKET_PRINCIPLES.mindsetShift.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            <p className="line-through mb-1">From: {HIDDEN_MARKET_PRINCIPLES.mindsetShift.from}</p>
            <p className="text-foreground font-semibold">To: {HIDDEN_MARKET_PRINCIPLES.mindsetShift.to}</p>
          </div>
        </CardContent>
      </Card>

      {/* Output Templates */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Action Plans</CardTitle>
              <CardDescription>
                Select a format, customize, then copy or download
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
              <p className="text-muted-foreground">Generating your action plans...</p>
            </div>
          ) : (
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className="grid grid-cols-4 mb-4">
                {ACTION_PLAN_TEMPLATES.map(template => {
                  const icons = {
                    '30-day-plan': Calendar,
                    'network-tracker': Network,
                    'outreach-scripts': MessageSquare,
                    'visibility-calendar': Eye
                  };
                  const Icon = icons[template.id as keyof typeof icons] || Calendar;

                  return (
                    <TabsTrigger key={template.id} value={template.id} className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {template.name.split(' ')[0]}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {ACTION_PLAN_TEMPLATES.map(template => (
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
                    className="min-h-[350px] bg-nex-dark border-nex-border font-mono text-sm"
                    rows={18}
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
          Back to Relationships
        </Button>
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-cyan to-purple-500 text-white hover:opacity-90"
        >
          Complete Assessment
          <Rocket className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
