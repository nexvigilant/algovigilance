"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  ProgramResource,
  ResourceCategory,
} from "@/types/academy-program";
import { RESOURCE_CATEGORY_LABELS } from "@/types/academy-program";

interface ResourcesPanelProps {
  resources: ProgramResource[];
}

export function ResourcesPanel({ resources }: ResourcesPanelProps) {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  // Group by category
  const grouped = resources.reduce<Record<string, ProgramResource[]>>(
    (acc, r) => {
      const cat = r.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(r);
      return acc;
    },
    {},
  );

  const categories = Object.keys(grouped) as ResourceCategory[];

  if (categories.length === 0) return null;

  return (
    <Tabs defaultValue={categories[0]} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-nex-surface/30 p-1">
        {categories.map((cat) => (
          <TabsTrigger
            key={cat}
            value={cat}
            className="text-xs data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan"
          >
            {RESOURCE_CATEGORY_LABELS[cat]} ({grouped[cat].length})
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((cat) => (
        <TabsContent key={cat} value={cat} className="mt-4 space-y-3">
          {grouped[cat].map((resource) => (
            <div
              key={resource.id}
              className="rounded-xl border border-nex-border bg-nex-surface/30 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedResource(
                    expandedResource === resource.id ? null : resource.id,
                  )
                }
                aria-expanded={expandedResource === resource.id}
                aria-label={`${expandedResource === resource.id ? "Collapse" : "Expand"} resource: ${resource.title}`}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-nex-surface/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-cyan/60 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white">
                    {resource.title}
                  </h4>
                  <p className="text-xs text-slate-light/60 mt-0.5 truncate">
                    {resource.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-slate-light/20 text-slate-light/50"
                  >
                    {resource.sections.length} sections
                  </Badge>
                  {expandedResource === resource.id ? (
                    <ChevronDown className="h-4 w-4 text-slate-light/40" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-light/40" />
                  )}
                </div>
              </button>

              {expandedResource === resource.id && (
                <div className="border-t border-nex-border px-4 pb-4 space-y-4">
                  {resource.sections.map((section, i) => (
                    <div key={i} className="pt-3">
                      <h5 className="text-xs font-medium text-white mb-2">
                        {i + 1}. {section.title}
                      </h5>
                      {section.components.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-light/40">
                            Components
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {section.components.map((comp, j) => (
                              <Badge
                                key={j}
                                variant="outline"
                                className="text-[10px] border-nex-border text-slate-light/70 px-1.5 py-0"
                              >
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {section.implementationSteps.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-light/40">
                            Steps
                          </span>
                          <ol className="mt-1 space-y-1">
                            {section.implementationSteps.map((step, j) => (
                              <li
                                key={j}
                                className="text-[11px] text-slate-light/60 flex gap-2"
                              >
                                <span className="text-cyan/40 font-mono flex-shrink-0">
                                  {j + 1}.
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}

                  {resource.relatedModuleIds.length > 0 && (
                    <div className="pt-2 border-t border-nex-border/50">
                      <span className="text-[10px] text-slate-light/40">
                        Related modules: {resource.relatedModuleIds.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
