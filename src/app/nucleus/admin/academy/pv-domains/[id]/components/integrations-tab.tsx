import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowUpDown, GitBranch } from 'lucide-react';
import type { DomainIntegrationWithContext } from '../../actions';

interface IntegrationsTabProps {
  integrations: DomainIntegrationWithContext[];
  domainId: string;
}

export function IntegrationsTab({ integrations, domainId }: IntegrationsTabProps) {
  // Categorize by actual flow direction (from bidirectional query)
  const inboundIntegrations = integrations.filter(i => i.flowDirection === 'inbound');
  const outboundIntegrations = integrations.filter(i => i.flowDirection === 'outbound');

  // Further categorize by relationship type
  const synergies = integrations.filter(i =>
    i.direction.toLowerCase().includes('synergy')
  );
  const _aiGateways = integrations.filter(i =>
    i.direction.toLowerCase().includes('ai') ||
    i.direction.toLowerCase().includes('gateway')
  );

  // Group integrations by prerequisite level
  const groupByLevel = (items: DomainIntegrationWithContext[]) => {
    const grouped: Record<string, DomainIntegrationWithContext[]> = {};
    items.forEach(item => {
      const level = item.prerequisiteLevel || 'General';
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(item);
    });
    return grouped;
  };

  const inboundByLevel = groupByLevel(inboundIntegrations);
  const outboundByLevel = groupByLevel(outboundIntegrations);

  // Sort levels
  const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++', 'General'];
  const sortLevels = (levels: string[]) =>
    levels.sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b));

  return (
    <div className="space-y-6">
      {/* Visual Flow Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-sm text-slate-dim mb-1">Dependencies (In)</div>
              <div className="text-2xl font-bold text-blue-600">{inboundIntegrations.length}</div>
            </div>
            <div className="flex items-center gap-2 text-slate-dim">
              <span>→</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-slate-dim mb-1">Current Domain</div>
              <div className="text-2xl font-bold">{domainId}</div>
            </div>
            <div className="flex items-center gap-2 text-slate-dim">
              <span>→</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-slate-dim mb-1">Dependencies (Out)</div>
              <div className="text-2xl font-bold text-green-600">{outboundIntegrations.length}</div>
            </div>
            {synergies.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-slate-dim">
                  <span>↔</span>
                </div>
                <div className="text-center flex-1">
                  <div className="text-sm text-slate-dim mb-1">Synergies</div>
                  <div className="text-2xl font-bold text-purple-600">{synergies.length}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Accordion for Dependencies */}
      <Accordion type="multiple" className="w-full">
        {/* Inbound Dependencies */}
        {inboundIntegrations.length > 0 && (
          <AccordionItem value="dependencies-in">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <ArrowUpDown className="h-4 w-4 text-blue-600 rotate-90" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold">Dependencies (In)</span>
                  <span className="text-sm text-slate-dim ml-2">
                    ({inboundIntegrations.length})
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-slate-dim mb-4 pl-4">
                Capabilities from other domains that this domain depends on
              </p>
              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-blue-200">
                {sortLevels(Object.keys(inboundByLevel)).map(level => {
                  const levelItems = inboundByLevel[level];
                  return (
                    <AccordionItem key={level} value={`in-${level}`}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {level}
                          </Badge>
                          <span className="text-sm">
                            {levelItems.length} integration{levelItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {levelItems.map(integration => (
                            <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="flex-shrink-0 mt-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {integration.relatedDomain}
                                </Badge>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{integration.integrationPoint}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {integration.direction}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-dim">
                                  {integration.dataProcessExchange}
                                </p>
                                {integration.notes && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    &larr; {integration.notes}
                                  </p>
                                )}
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
        )}

        {/* Outbound Dependencies */}
        {outboundIntegrations.length > 0 && (
          <AccordionItem value="dependencies-out">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <ArrowUpDown className="h-4 w-4 text-green-600 -rotate-90" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold">Dependencies (Out)</span>
                  <span className="text-sm text-slate-dim ml-2">
                    ({outboundIntegrations.length})
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-slate-dim mb-4 pl-4">
                Other domains that depend on capabilities from this domain
              </p>
              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-green-200">
                {sortLevels(Object.keys(outboundByLevel)).map(level => {
                  const levelItems = outboundByLevel[level];
                  return (
                    <AccordionItem key={level} value={`out-${level}`}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {level}
                          </Badge>
                          <span className="text-sm">
                            {levelItems.length} integration{levelItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {levelItems.map(integration => (
                            <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="flex-shrink-0 mt-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {integration.relatedDomain}
                                </Badge>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{integration.integrationPoint}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {integration.direction}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-dim">
                                  {integration.dataProcessExchange}
                                </p>
                                {integration.notes && (
                                  <p className="text-xs text-green-600 mt-1">
                                    → {integration.notes}
                                  </p>
                                )}
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
        )}

        {/* Synergies */}
        {synergies.length > 0 && (
          <AccordionItem value="synergies">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <GitBranch className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold">Mutual Synergies</span>
                  <span className="text-sm text-slate-dim ml-2">
                    ({synergies.length})
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-slate-dim mb-4 pl-4">
                Domains that enhance each other when developed together
              </p>
              <div className="space-y-3 pl-4">
                {synergies.map(integration => (
                  <div key={integration.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-shrink-0 mt-1">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {integration.relatedDomain}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{integration.integrationPoint}</span>
                        {integration.prerequisiteLevel && (
                          <Badge variant="outline" className="text-xs">
                            {integration.prerequisiteLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-dim">
                        {integration.dataProcessExchange}
                      </p>
                      {integration.notes && (
                        <p className="text-xs text-purple-600 mt-1">
                          ↔ {integration.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-dim">
            No domain integrations defined yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
