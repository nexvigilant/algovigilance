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
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type {
  SynthesisConfig,
  SynthesisConstraint,
  SynthesisEvaluationCriterion,
} from '@/types/pv-curriculum';

interface SynthesisBuilderProps {
  config: SynthesisConfig;
  onChange: (config: SynthesisConfig) => void;
}

const outputFormats = [
  { value: 'narrative', label: 'Narrative' },
  { value: 'structured', label: 'Structured Document' },
  { value: 'form', label: 'Form/Template' },
  { value: 'analysis', label: 'Analysis Report' },
  { value: 'recommendation', label: 'Recommendation' },
];

const constraintTypes = [
  { value: 'include', label: 'Must Include' },
  { value: 'exclude', label: 'Must Exclude' },
  { value: 'format', label: 'Format Requirement' },
  { value: 'length', label: 'Length Requirement' },
  { value: 'terminology', label: 'Terminology Requirement' },
];

export function SynthesisBuilder({ config, onChange }: SynthesisBuilderProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['constraints', 'criteria']);

  const updateConfig = (updates: Partial<SynthesisConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Constraint management
  const addConstraint = () => {
    const newConstraint: SynthesisConstraint = {
      type: 'include',
      description: '',
      required: true,
    };
    updateConfig({
      constraints: [...config.constraints, newConstraint],
    });
  };

  const updateConstraint = (index: number, updates: Partial<SynthesisConstraint>) => {
    const newConstraints = [...config.constraints];
    newConstraints[index] = { ...newConstraints[index], ...updates };
    updateConfig({ constraints: newConstraints });
  };

  const removeConstraint = (index: number) => {
    updateConfig({
      constraints: config.constraints.filter((_, i) => i !== index),
    });
  };

  // Criteria management
  const addCriterion = () => {
    const newCriterion: SynthesisEvaluationCriterion = {
      name: '',
      description: '',
      weight: 0.25,
      rubric: {
        excellent: '',
        good: '',
        needsImprovement: '',
      },
    };
    updateConfig({
      evaluationCriteria: [...config.evaluationCriteria, newCriterion],
    });
  };

  const updateCriterion = (index: number, updates: Partial<SynthesisEvaluationCriterion>) => {
    const newCriteria = [...config.evaluationCriteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    updateConfig({ evaluationCriteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    updateConfig({
      evaluationCriteria: config.evaluationCriteria.filter((_, i) => i !== index),
    });
  };

  const totalWeight = config.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      {/* Prompt Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Synthesis Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Task Prompt</Label>
            <Textarea
              id="prompt"
              value={config.prompt}
              onChange={(e) => updateConfig({ prompt: e.target.value })}
              placeholder="Describe what the learner should create or synthesize..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={config.outputFormat}
                onValueChange={(value) =>
                  updateConfig({
                    outputFormat: value as SynthesisConfig['outputFormat'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Length: {config.maxLength || 'Unlimited'}</Label>
              <Slider
                value={[config.maxLength || 0]}
                onValueChange={([value]) => updateConfig({ maxLength: value || undefined })}
                min={0}
                max={5000}
                step={100}
              />
              <p className="text-xs text-muted-foreground">0 = unlimited</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exampleOutput">Example Output (Optional)</Label>
            <Textarea
              id="exampleOutput"
              value={config.exampleOutput || ''}
              onChange={(e) => updateConfig({ exampleOutput: e.target.value || undefined })}
              placeholder="Provide an example of what good output looks like..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Constraints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Constraints ({config.constraints.length})
          </CardTitle>
          <Button onClick={addConstraint} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Constraint
          </Button>
        </CardHeader>
        <CardContent>
          {config.constraints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No constraints defined. Add constraints to guide learner submissions.
            </p>
          ) : (
            <div className="space-y-3">
              {config.constraints.map((constraint, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={constraint.type}
                          onValueChange={(value) =>
                            updateConstraint(index, {
                              type: value as SynthesisConstraint['type'],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {constraintTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={constraint.required}
                            onCheckedChange={(checked) =>
                              updateConstraint(index, { required: checked })
                            }
                          />
                          <Label className="text-sm">
                            {constraint.required ? 'Required' : 'Optional'}
                          </Label>
                        </div>
                      </div>

                      <Input
                        value={constraint.description}
                        onChange={(e) =>
                          updateConstraint(index, { description: e.target.value })
                        }
                        placeholder="Describe the constraint..."
                      />
                    </div>

                    <Button
                      onClick={() => removeConstraint(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Criteria */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Evaluation Criteria ({config.evaluationCriteria.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total weight: {(totalWeight * 100).toFixed(0)}%{' '}
              {totalWeight !== 1 && (
                <span className="text-yellow-600">(should equal 100%)</span>
              )}
            </p>
          </div>
          <Button onClick={addCriterion} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Criterion
          </Button>
        </CardHeader>
        <CardContent>
          {config.evaluationCriteria.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No evaluation criteria defined. Add criteria for AI-powered assessment.
            </p>
          ) : (
            <Accordion
              type="multiple"
              value={expandedSections}
              onValueChange={setExpandedSections}
              className="space-y-2"
            >
              {config.evaluationCriteria.map((criterion, index) => (
                <AccordionItem
                  key={index}
                  value={`criterion-${index}`}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="truncate max-w-[200px]">
                        {criterion.name || 'Unnamed Criterion'}
                      </span>
                      <Badge variant="secondary">
                        {(criterion.weight * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Criterion Name</Label>
                        <Input
                          value={criterion.name}
                          onChange={(e) =>
                            updateCriterion(index, { name: e.target.value })
                          }
                          placeholder="e.g., Accuracy, Completeness, Clarity"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={criterion.description}
                          onChange={(e) =>
                            updateCriterion(index, { description: e.target.value })
                          }
                          placeholder="What this criterion evaluates..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Weight: {(criterion.weight * 100).toFixed(0)}%
                        </Label>
                        <Slider
                          value={[criterion.weight * 100]}
                          onValueChange={([value]) =>
                            updateCriterion(index, { weight: value / 100 })
                          }
                          min={5}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <Label className="text-sm font-medium">Rubric</Label>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-green-600">Excellent</Label>
                            <Textarea
                              value={criterion.rubric.excellent}
                              onChange={(e) =>
                                updateCriterion(index, {
                                  rubric: { ...criterion.rubric, excellent: e.target.value },
                                })
                              }
                              placeholder="Describes excellent performance..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-yellow-600">Good</Label>
                            <Textarea
                              value={criterion.rubric.good}
                              onChange={(e) =>
                                updateCriterion(index, {
                                  rubric: { ...criterion.rubric, good: e.target.value },
                                })
                              }
                              placeholder="Describes good performance..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-red-600">Needs Improvement</Label>
                            <Textarea
                              value={criterion.rubric.needsImprovement}
                              onChange={(e) =>
                                updateCriterion(index, {
                                  rubric: { ...criterion.rubric, needsImprovement: e.target.value },
                                })
                              }
                              placeholder="Describes areas for improvement..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <Button
                          onClick={() => removeCriterion(index)}
                          variant="outline"
                          className="text-red-600"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Criterion
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

export default SynthesisBuilder;
