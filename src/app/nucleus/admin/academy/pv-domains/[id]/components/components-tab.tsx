'use client';

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
import { typeConfig, type SortOption } from './constants';
import { FilterBar } from './filter-bar';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface ComponentsTabProps {
  components: CapabilityComponent[];
  typeFilter: string | null;
  setTypeFilter: (value: string | null) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function ComponentsTab({
  components,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
}: ComponentsTabProps) {
  // Filter components by type and search query
  const filteredComponents = components.filter(c => {
    const matchesType = !typeFilter || c.type === typeFilter;
    const matchesSearch = !searchQuery ||
      c.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Sort components
  const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];
  const bloomOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  const sortedComponents = [...filteredComponents].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.itemName.localeCompare(b.itemName);
      case 'name-desc':
        return b.itemName.localeCompare(a.itemName);
      case 'level':
        return levelOrder.indexOf(a.proficiencyLevel) - levelOrder.indexOf(b.proficiencyLevel);
      case 'bloom':
        return bloomOrder.indexOf(a.bloomLevel.toLowerCase()) - bloomOrder.indexOf(b.bloomLevel.toLowerCase());
      case 'section':
      default:
        return (a.majorSection || '').localeCompare(b.majorSection || '');
    }
  });

  // Determine grouping based on filter and sort
  const getGroupedComponents = () => {
    if (typeFilter && sortBy === 'section') {
      return sortedComponents.reduce((acc, comp) => {
        const key = comp.section || comp.majorSection || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(comp);
        return acc;
      }, {} as Record<string, CapabilityComponent[]>);
    } else if (sortBy === 'section') {
      return sortedComponents.reduce((acc, comp) => {
        const key = comp.majorSection || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(comp);
        return acc;
      }, {} as Record<string, CapabilityComponent[]>);
    } else {
      return { 'All Components': sortedComponents };
    }
  };

  const groupedComponents = getGroupedComponents();

  const getTypeCardTitle = () => {
    if (!typeFilter) return null;
    const titles: Record<string, string> = {
      knowledge: 'Core Knowledge Components',
      skill: 'Core Skill Components',
      behavior: 'Core Behavior Components',
      ai_integration: 'AI Integration Components',
    };
    return titles[typeFilter] || 'Components';
  };

  const typeCardTitle = getTypeCardTitle();

  return (
    <>
      <FilterBar
        components={components}
        filteredComponents={filteredComponents}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Grouped Components */}
      <div className="space-y-6">
        {typeFilter && typeCardTitle ? (
          /* When filtering by type, show single card with accordion sub-sections */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-light">{typeCardTitle}</CardTitle>
              <CardDescription className="text-slate-dim">{filteredComponents.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedComponents).map(([section, items]) => (
                  <AccordionItem key={section} value={section}>
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        {section}
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {items.map(comp => {
                          const config = typeConfig[comp.type] || typeConfig.knowledge;
                          const Icon = config.icon;
                          return (
                            <div
                              key={comp.id}
                              className={`p-3 rounded-lg border ${config.bg}`}
                            >
                              <div className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{comp.itemName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {comp.proficiencyLevel}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {comp.bloomLevel}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-dim">
                                    {comp.itemDescription}
                                  </p>
                                  {comp.keywords.length > 0 && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      {comp.keywords.slice(0, 5).map(kw => (
                                        <Badge key={kw} variant="outline" className="text-xs">
                                          {kw}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ) : (
          /* When viewing all, show separate cards per majorSection */
          Object.entries(groupedComponents).map(([section, items]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-lg text-slate-light">{section}</CardTitle>
                <CardDescription className="text-slate-dim">{items.length} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map(comp => {
                    const config = typeConfig[comp.type] || typeConfig.knowledge;
                    const Icon = config.icon;
                    return (
                      <div
                        key={comp.id}
                        className={`p-3 rounded-lg border ${config.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comp.itemName}</span>
                              <Badge variant="outline" className="text-xs">
                                {comp.proficiencyLevel}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {comp.bloomLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-dim">
                              {comp.itemDescription}
                            </p>
                            {comp.keywords.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {comp.keywords.slice(0, 5).map(kw => (
                                  <Badge key={kw} variant="outline" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
