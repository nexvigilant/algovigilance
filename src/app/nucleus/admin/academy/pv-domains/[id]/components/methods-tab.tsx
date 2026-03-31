import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ClipboardCheck, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assessmentCategoryConfig, getAssessmentCategory } from './constants';
import type { AssessmentMethod } from '@/types/pv-curriculum';
import type { ProficiencyLevel } from '@/types/pv-framework';

interface MethodsTabProps {
  methods: AssessmentMethod[];
  assessmentLevelFilter: 'all' | ProficiencyLevel;
  onLevelFilterChange: (value: 'all' | ProficiencyLevel) => void;
}

export function MethodsTab({ methods, assessmentLevelFilter, onLevelFilterChange }: MethodsTabProps) {
  // Filter methods by level if filter is set
  const filteredMethods = assessmentLevelFilter === 'all'
    ? methods
    : methods.filter(m => m.applicableLevels.includes(assessmentLevelFilter));

  // Group by consolidated category
  const groupedByType = filteredMethods.reduce((acc, method) => {
    const category = getAssessmentCategory(method.assessmentType);
    if (!acc[category]) acc[category] = [];
    acc[category].push(method);
    return acc;
  }, {} as Record<string, AssessmentMethod[]>);

  // Get all unique levels for filter
  const allLevels = [...new Set(methods.flatMap(m => m.applicableLevels))].sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-light">
              <ClipboardCheck className="h-5 w-5 text-cyan-600" />
              Assessment Methods
            </CardTitle>
            <CardDescription className="text-slate-dim">
              {filteredMethods.length} assessment method{filteredMethods.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-dim" />
            <Select value={assessmentLevelFilter} onValueChange={(value) => onLevelFilterChange(value as 'all' | ProficiencyLevel)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {allLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedByType).length === 0 ? (
          <p className="text-sm text-slate-dim text-center py-4">
            No assessment methods found for the selected filter.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedByType).map(([category, typeMethods]) => {
              const config = assessmentCategoryConfig[category] || assessmentCategoryConfig['default'];
              const Icon = config.icon;

              // Group methods by their original assessment type within this category
              const methodsByType = typeMethods.reduce((acc, method) => {
                if (!acc[method.assessmentType]) acc[method.assessmentType] = [];
                acc[method.assessmentType].push(method);
                return acc;
              }, {} as Record<string, AssessmentMethod[]>);

              // Sort assessment types by level indicators in their names
              const sortedTypes = Object.keys(methodsByType).sort((a, b) => {
                const getOrder = (name: string) => {
                  if (name.includes('L1-L2') || name.includes('Foundation')) return 1;
                  if (name.includes('L3-L4') || name.includes('Professional')) return 2;
                  if (name.includes('L5+') || name.includes('Expert')) return 3;
                  return 4;
                };
                return getOrder(a) - getOrder(b);
              });

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold">{category}</span>
                        <span className="text-sm text-slate-dim ml-2">
                          ({typeMethods.length})
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple" className="w-full pl-4 border-l-2 border-muted">
                      {sortedTypes.map(assessmentType => {
                        const typeMethodsList = methodsByType[assessmentType];
                        const typeLevels = [...new Set(typeMethodsList.flatMap(m => m.applicableLevels))].sort();
                        return (
                          <AccordionItem key={assessmentType} value={`${category}-${assessmentType}`}>
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium">{assessmentType}</span>
                                <span className="text-xs text-slate-dim">
                                  ({typeMethodsList.length})
                                </span>
                                <div className="flex gap-1 ml-auto mr-2">
                                  {typeLevels.map(level => (
                                    <Badge key={level} variant="outline" className="text-xs">
                                      {level}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                {typeMethodsList.map(method => (
                                  <div key={method.id} className="border rounded-lg p-4 bg-muted/30">
                                    <div className="mb-3">
                                      <p className="text-sm text-slate-dim">{method.purpose}</p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-semibold text-cyan-600">Frequency</span>
                                        <p className="text-slate-dim">{method.frequency}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-cyan-600">Evidence Required</span>
                                        <p className="text-slate-dim">{method.evidenceRequired}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-cyan-600">Passing Criteria</span>
                                        <p className="text-slate-dim">{method.passingCriteria}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-cyan-600">Assessor Qualifications</span>
                                        <p className="text-slate-dim">{method.assessorQualifications}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
