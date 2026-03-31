'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
// Switch import removed - not currently used in UI
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import type { TriageConfig, TriageDecision, TriageOption } from '@/types/pv-curriculum';

interface TriageBuilderProps {
  config: TriageConfig;
  onChange: (config: TriageConfig) => void;
}

export function TriageBuilder({ config, onChange }: TriageBuilderProps) {
  const [expandedDecisions, setExpandedDecisions] = useState<string[]>([]);

  // Helper to update config
  const updateConfig = (updates: Partial<TriageConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Decision management
  const addDecision = () => {
    const newDecision: TriageDecision = {
      id: `decision-${Date.now()}`,
      prompt: '',
      options: [
        { id: `opt-${Date.now()}-1`, label: 'Option 1', description: '' },
        { id: `opt-${Date.now()}-2`, label: 'Option 2', description: '' },
      ],
      correctOptionId: '',
      rationale: '',
      followUp: '',
    };

    updateConfig({
      decisions: [...config.decisions, newDecision],
    });

    setExpandedDecisions([...expandedDecisions, newDecision.id]);
  };

  const updateDecision = (index: number, updates: Partial<TriageDecision>) => {
    const newDecisions = [...config.decisions];
    newDecisions[index] = { ...newDecisions[index], ...updates };
    updateConfig({ decisions: newDecisions });
  };

  const removeDecision = (index: number) => {
    updateConfig({
      decisions: config.decisions.filter((_, i) => i !== index),
    });
  };

  // Option management
  const addOption = (decisionIndex: number) => {
    const decision = config.decisions[decisionIndex];
    const newOption: TriageOption = {
      id: `opt-${Date.now()}`,
      label: `Option ${decision.options.length + 1}`,
      description: '',
    };

    updateDecision(decisionIndex, {
      options: [...decision.options, newOption],
    });
  };

  const updateOption = (
    decisionIndex: number,
    optionIndex: number,
    updates: Partial<TriageOption>
  ) => {
    const decision = config.decisions[decisionIndex];
    const newOptions = [...decision.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    updateDecision(decisionIndex, { options: newOptions });
  };

  const removeOption = (decisionIndex: number, optionIndex: number) => {
    const decision = config.decisions[decisionIndex];
    const removedOptionId = decision.options[optionIndex].id;
    const newOptions = decision.options.filter((_, i) => i !== optionIndex);

    // Clear correct answer if it was the removed option
    const correctId = decision.correctOptionId === removedOptionId ? '' : decision.correctOptionId;

    updateDecision(decisionIndex, {
      options: newOptions,
      correctOptionId: correctId,
    });
  };

  const setCorrectOption = (decisionIndex: number, optionId: string) => {
    updateDecision(decisionIndex, { correctOptionId: optionId });
  };

  return (
    <div className="space-y-6">
      {/* Scenario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenario Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scenario">Scenario Description</Label>
            <Textarea
              id="scenario"
              value={config.scenario}
              onChange={(e) => updateConfig({ scenario: e.target.value })}
              placeholder="Describe the scenario context for all decisions..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time per Decision (seconds): {config.timeConstraint}</Label>
              <Slider
                value={[config.timeConstraint]}
                onValueChange={([value]) => updateConfig({ timeConstraint: value })}
                min={15}
                max={120}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Weights must sum to 1.0 (100%). Current:{' '}
            {(
              (config.scoringWeights.accuracy +
                config.scoringWeights.speed +
                config.scoringWeights.justification) *
              100
            ).toFixed(0)}
            %
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Accuracy: {(config.scoringWeights.accuracy * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[config.scoringWeights.accuracy * 100]}
                onValueChange={([value]) =>
                  updateConfig({
                    scoringWeights: {
                      ...config.scoringWeights,
                      accuracy: value / 100,
                    },
                  })
                }
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Speed: {(config.scoringWeights.speed * 100).toFixed(0)}%</Label>
              <Slider
                value={[config.scoringWeights.speed * 100]}
                onValueChange={([value]) =>
                  updateConfig({
                    scoringWeights: {
                      ...config.scoringWeights,
                      speed: value / 100,
                    },
                  })
                }
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Justification: {(config.scoringWeights.justification * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[config.scoringWeights.justification * 100]}
                onValueChange={([value]) =>
                  updateConfig({
                    scoringWeights: {
                      ...config.scoringWeights,
                      justification: value / 100,
                    },
                  })
                }
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Decisions ({config.decisions.length})
          </CardTitle>
          <Button onClick={addDecision} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Decision
          </Button>
        </CardHeader>
        <CardContent>
          {config.decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No decisions yet. Click "Add Decision" to create one.
            </p>
          ) : (
            <Accordion
              type="multiple"
              value={expandedDecisions}
              onValueChange={setExpandedDecisions}
              className="space-y-2"
            >
              {config.decisions.map((decision, decisionIndex) => (
                <AccordionItem
                  key={decision.id}
                  value={decision.id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{decisionIndex + 1}</Badge>
                      <span className="truncate max-w-[300px]">
                        {decision.prompt || 'Untitled Decision'}
                      </span>
                      {decision.correctOptionId && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Decision Prompt */}
                      <div className="space-y-2">
                        <Label>Decision Prompt</Label>
                        <Textarea
                          value={decision.prompt}
                          onChange={(e) =>
                            updateDecision(decisionIndex, { prompt: e.target.value })
                          }
                          placeholder="What decision does the user need to make?"
                          rows={2}
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Options</Label>
                          <Button
                            onClick={() => addOption(decisionIndex)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {decision.options.map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className={`p-3 border rounded-lg space-y-2 ${
                                decision.correctOptionId === option.id
                                  ? 'border-green-500 bg-green-50'
                                  : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={option.label}
                                    onChange={(e) =>
                                      updateOption(decisionIndex, optionIndex, {
                                        label: e.target.value,
                                      })
                                    }
                                    placeholder="Option label"
                                  />
                                  <Input
                                    value={option.description || ''}
                                    onChange={(e) =>
                                      updateOption(decisionIndex, optionIndex, {
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Description (optional)"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    onClick={() =>
                                      setCorrectOption(decisionIndex, option.id)
                                    }
                                    size="sm"
                                    variant={
                                      decision.correctOptionId === option.id
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    {decision.correctOptionId === option.id
                                      ? 'Correct'
                                      : 'Set Correct'}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      removeOption(decisionIndex, optionIndex)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600"
                                    disabled={decision.options.length <= 2}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rationale */}
                      <div className="space-y-2">
                        <Label>Rationale</Label>
                        <Textarea
                          value={decision.rationale}
                          onChange={(e) =>
                            updateDecision(decisionIndex, { rationale: e.target.value })
                          }
                          placeholder="Explain why the correct answer is correct..."
                          rows={2}
                        />
                      </div>

                      {/* Follow-up */}
                      <div className="space-y-2">
                        <Label>Follow-up (Optional)</Label>
                        <Textarea
                          value={decision.followUp || ''}
                          onChange={(e) =>
                            updateDecision(decisionIndex, { followUp: e.target.value })
                          }
                          placeholder="Additional context shown after answering..."
                          rows={2}
                        />
                      </div>

                      {/* Remove Decision */}
                      <div className="pt-2 border-t">
                        <Button
                          onClick={() => removeDecision(decisionIndex)}
                          variant="outline"
                          className="text-red-600"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Decision
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

export default TriageBuilder;
