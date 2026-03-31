'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { RedPenConfig, RedPenError } from '@/types/pv-curriculum';

interface RedPenBuilderProps {
  config: RedPenConfig;
  onChange: (config: RedPenConfig) => void;
}

const documentTypes = [
  { value: 'case_narrative', label: 'Case Narrative' },
  { value: 'safety_report', label: 'Safety Report' },
  { value: 'regulatory_submission', label: 'Regulatory Submission' },
  { value: 'sop', label: 'Standard Operating Procedure' },
  { value: 'protocol', label: 'Protocol' },
];

const errorTypes = [
  { value: 'factual', label: 'Factual Error' },
  { value: 'procedural', label: 'Procedural Error' },
  { value: 'regulatory', label: 'Regulatory Non-compliance' },
  { value: 'terminology', label: 'Terminology Issue' },
  { value: 'completeness', label: 'Completeness Issue' },
  { value: 'formatting', label: 'Formatting Error' },
];

const severityLevels = [
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'major', label: 'Major', color: 'text-orange-600' },
  { value: 'minor', label: 'Minor', color: 'text-yellow-600' },
];

export function RedPenBuilder({ config, onChange }: RedPenBuilderProps) {
  const [expandedErrors, setExpandedErrors] = useState<string[]>([]);

  const updateConfig = (updates: Partial<RedPenConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addError = () => {
    const newError: RedPenError = {
      id: `error-${Date.now()}`,
      location: '',
      errorType: 'factual',
      severity: 'major',
      explanation: '',
      correctVersion: '',
    };

    updateConfig({
      errors: [...config.errors, newError],
    });

    setExpandedErrors([...expandedErrors, newError.id]);
  };

  const updateError = (index: number, updates: Partial<RedPenError>) => {
    const newErrors = [...config.errors];
    newErrors[index] = { ...newErrors[index], ...updates };
    updateConfig({ errors: newErrors });
  };

  const removeError = (index: number) => {
    updateConfig({
      errors: config.errors.filter((_, i) => i !== index),
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={config.documentType}
              onValueChange={(value) =>
                updateConfig({
                  documentType: value as RedPenConfig['documentType'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentContent">Document Content</Label>
            <Textarea
              id="documentContent"
              value={config.documentContent}
              onChange={(e) => updateConfig({ documentContent: e.target.value })}
              placeholder="Paste or enter the document content with intentional errors..."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter the document that learners will review. Include the errors you want them to find.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Passing Score: {config.passingScore}%</Label>
            <Slider
              value={[config.passingScore]}
              onValueChange={([value]) => updateConfig({ passingScore: value })}
              min={10}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of errors learners must find to pass
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Feedback on Missed Errors</Label>
              <p className="text-xs text-muted-foreground">
                Display explanations for errors the learner didn&apos;t find
              </p>
            </div>
            <Switch
              checked={config.feedbackOnMiss}
              onCheckedChange={(checked) => updateConfig({ feedbackOnMiss: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Errors to Find ({config.errors.length})</CardTitle>
          <Button onClick={addError} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Error
          </Button>
        </CardHeader>
        <CardContent>
          {config.errors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No errors defined. Click &quot;Add Error&quot; to create one.
            </p>
          ) : (
            <Accordion
              type="multiple"
              value={expandedErrors}
              onValueChange={setExpandedErrors}
              className="space-y-2"
            >
              {config.errors.map((error, index) => (
                <AccordionItem key={error.id} value={error.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {getSeverityIcon(error.severity)}
                      <Badge variant="outline">{index + 1}</Badge>
                      <Badge variant="secondary" className="capitalize">
                        {error.errorType.replace('_', ' ')}
                      </Badge>
                      <span className="truncate max-w-[200px]">
                        {error.location || 'No location specified'}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Error Type</Label>
                          <Select
                            value={error.errorType}
                            onValueChange={(value) =>
                              updateError(index, {
                                errorType: value as RedPenError['errorType'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {errorTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Select
                            value={error.severity}
                            onValueChange={(value) =>
                              updateError(index, {
                                severity: value as RedPenError['severity'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {severityLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  <span className={level.color}>{level.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Location in Document</Label>
                        <Input
                          value={error.location}
                          onChange={(e) => updateError(index, { location: e.target.value })}
                          placeholder="Text span or identifier (e.g., 'paragraph 3' or exact text)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Explanation</Label>
                        <Textarea
                          value={error.explanation}
                          onChange={(e) => updateError(index, { explanation: e.target.value })}
                          placeholder="Explain why this is an error and its impact..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Correct Version (Optional)</Label>
                        <Textarea
                          value={error.correctVersion || ''}
                          onChange={(e) => updateError(index, { correctVersion: e.target.value })}
                          placeholder="What the correct text should be..."
                          rows={2}
                        />
                      </div>

                      <div className="pt-2 border-t">
                        <Button
                          onClick={() => removeError(index)}
                          variant="outline"
                          className="text-red-600"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Error
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RedPenBuilder;
