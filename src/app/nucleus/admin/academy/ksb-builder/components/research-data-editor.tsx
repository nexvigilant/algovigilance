'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  Loader2,
  FileText,
  Globe,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { updateKSBResearch } from '@/lib/actions/ksb-builder';
import { useToast } from '@/hooks/use-toast';
import type { CapabilityComponent, Citation, AuthorityLevel, ResearchData } from '@/types/pv-curriculum';

interface ResearchDataEditorProps {
  ksb: CapabilityComponent;
  userId: string;
  onSave?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AUTHORITY_LEVELS: { value: AuthorityLevel; label: string; description: string }[] = [
  { value: 'regulatory', label: 'Regulatory', description: 'Official regulations (FDA, EMA, etc.)' },
  { value: 'guidance', label: 'Guidance', description: 'Regulatory guidance documents (ICH, GVP)' },
  { value: 'industry_standard', label: 'Industry Standard', description: 'Industry best practices (ISPE, DIA)' },
  { value: 'peer_reviewed', label: 'Peer Reviewed', description: 'Published research articles' },
  { value: 'expert_opinion', label: 'Expert Opinion', description: 'Expert consensus or opinion' },
  { value: 'internal', label: 'Internal', description: 'Company-specific guidance' },
];

const CITATION_TYPES = [
  'regulation',
  'guidance',
  'standard',
  'journal',
  'book',
  'website',
  'internal',
] as const;

const REGIONS = ['global', 'us', 'eu', 'uk', 'japan', 'china', 'canada', 'australia'] as const;

export function ResearchDataEditor({
  ksb,
  userId,
  onSave,
  open,
  onOpenChange,
}: ResearchDataEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Initialize form state from existing research or defaults
  const [citations, setCitations] = useState<Citation[]>(
    ksb.research?.citations || []
  );
  const [authorityLevel, setAuthorityLevel] = useState<AuthorityLevel>(
    ksb.research?.authorityLevel || 'expert_opinion'
  );
  const [geographicScope, setGeographicScope] = useState<string[]>(
    ksb.research?.geographicScope || ['global']
  );
  const [coverageAreas, setCoverageAreas] = useState({
    definition: ksb.research?.coverageAreas?.definition || false,
    regulations: ksb.research?.coverageAreas?.regulations || false,
    bestPractices: ksb.research?.coverageAreas?.bestPractices || false,
    examples: ksb.research?.coverageAreas?.examples || false,
    assessmentCriteria: ksb.research?.coverageAreas?.assessmentCriteria || false,
  });

  // New citation form
  const [newCitation, setNewCitation] = useState<Partial<Citation>>({
    type: 'guidance',
    relevanceScore: 3,
  });

  const addCitation = () => {
    if (!newCitation.title || !newCitation.source) {
      toast({
        title: 'Missing Fields',
        description: 'Title and source are required',
        variant: 'destructive',
      });
      return;
    }

    const citation: Citation = {
      id: `cit-${Date.now()}`,
      type: newCitation.type || 'guidance',
      title: newCitation.title,
      source: newCitation.source,
      identifier: newCitation.identifier,
      url: newCitation.url,
      section: newCitation.section,
      relevanceScore: newCitation.relevanceScore || 3,
      notes: newCitation.notes,
      accessedDate: new Date(),
    };

    setCitations([...citations, citation]);
    setNewCitation({ type: 'guidance', relevanceScore: 3 });
  };

  const removeCitation = (id: string) => {
    setCitations(citations.filter(c => c.id !== id));
  };

  const toggleRegion = (region: string) => {
    setGeographicScope(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const researchData: Partial<ResearchData> = {
        citations,
        authorityLevel,
        geographicScope,
        coverageAreas,
        lastResearchedAt: new Date(),
        researchedBy: userId,
        researchMethod: 'manual',
        sourceCount: citations.length,
        primarySourceCount: citations.filter(c =>
          c.type === 'regulation' || c.type === 'guidance'
        ).length,
        peerReviewedCount: citations.filter(c => c.type === 'journal').length,
      };

      const result = await updateKSBResearch(ksb.domainId, ksb.id, researchData, userId);

      if (result.success) {
        toast({
          title: 'Research Data Saved',
          description: `Updated ${citations.length} citations and coverage areas`,
        });
        onSave?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Save Failed',
          description: result.error || 'Failed to save research data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Research Data Editor
          </DialogTitle>
          <DialogDescription>
            Add citations and research context for: {ksb.itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Authority Level */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authority Level
            </Label>
            <Select value={authorityLevel} onValueChange={(v) => setAuthorityLevel(v as AuthorityLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTHORITY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex flex-col">
                      <span>{level.label}</span>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Geographic Scope */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geographic Scope
            </Label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(region => (
                <Badge
                  key={region}
                  variant={geographicScope.includes(region) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleRegion(region)}
                >
                  {region.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Coverage Areas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Coverage Areas
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(coverageAreas).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setCoverageAreas(prev => ({ ...prev, [key]: checked === true }))
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Citations */}
          <Accordion type="single" collapsible defaultValue="citations">
            <AccordionItem value="citations">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Citations ({citations.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Existing Citations */}
                  {citations.length > 0 && (
                    <div className="space-y-2">
                      {citations.map(citation => (
                        <Card key={citation.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {citation.type}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {citation.relevanceScore}/5
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mt-1 truncate">
                                {citation.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {citation.source}
                                {citation.identifier && ` [${citation.identifier}]`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeCitation(citation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Add New Citation */}
                  <Card className="p-4 bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Add Citation</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="cit-type" className="text-xs">Type</Label>
                          <Select
                            value={newCitation.type}
                            onValueChange={(v) => setNewCitation({ ...newCitation, type: v as typeof CITATION_TYPES[number] })}
                          >
                            <SelectTrigger id="cit-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CITATION_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cit-relevance" className="text-xs">Relevance (1-5)</Label>
                          <Select
                            value={String(newCitation.relevanceScore)}
                            onValueChange={(v) => setNewCitation({ ...newCitation, relevanceScore: Number(v) })}
                          >
                            <SelectTrigger id="cit-relevance">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(score => (
                                <SelectItem key={score} value={String(score)}>
                                  {score} - {score === 5 ? 'Essential' : score === 4 ? 'Important' : score === 3 ? 'Relevant' : score === 2 ? 'Supporting' : 'Background'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cit-title" className="text-xs">Title *</Label>
                        <Input
                          id="cit-title"
                          value={newCitation.title || ''}
                          onChange={(e) => setNewCitation({ ...newCitation, title: e.target.value })}
                          placeholder="Document or article title"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="cit-source" className="text-xs">Source *</Label>
                          <Input
                            id="cit-source"
                            value={newCitation.source || ''}
                            onChange={(e) => setNewCitation({ ...newCitation, source: e.target.value })}
                            placeholder="e.g., FDA, ICH, EMA"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cit-id" className="text-xs">Identifier</Label>
                          <Input
                            id="cit-id"
                            value={newCitation.identifier || ''}
                            onChange={(e) => setNewCitation({ ...newCitation, identifier: e.target.value })}
                            placeholder="e.g., E2A, 21 CFR 312.32"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cit-url" className="text-xs">URL</Label>
                        <Input
                          id="cit-url"
                          value={newCitation.url || ''}
                          onChange={(e) => setNewCitation({ ...newCitation, url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="cit-notes" className="text-xs">Notes</Label>
                        <Textarea
                          id="cit-notes"
                          value={newCitation.notes || ''}
                          onChange={(e) => setNewCitation({ ...newCitation, notes: e.target.value })}
                          placeholder="Specific sections or relevance notes"
                          rows={2}
                        />
                      </div>

                      <Button onClick={addCitation} className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Citation
                      </Button>
                    </div>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Research Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ResearchDataEditor;
