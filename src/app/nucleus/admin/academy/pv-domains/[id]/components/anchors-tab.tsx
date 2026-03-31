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
import type { ActivityAnchor } from '@/types/pv-curriculum';

interface AnchorsTabProps {
  anchors: ActivityAnchor[];
}

function highlightActionVerb(text: string) {
  const words = text.split(' ');
  if (words.length === 0) return text;

  const verb = words[0];
  const rest = words.slice(1).join(' ');

  return (
    <>
      <span className="text-cyan-500 font-semibold">{verb}</span>
      {rest && ` ${rest}`}
    </>
  );
}

export function AnchorsTab({ anchors }: AnchorsTabProps) {
  const groupedAnchors = anchors.reduce((acc, anchor) => {
    const key = anchor.proficiencyLevel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(anchor);
    return acc;
  }, {} as Record<string, ActivityAnchor[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-slate-light">Activity Anchors by Proficiency Level</CardTitle>
        <CardDescription className="text-slate-dim">{anchors.length} total anchors</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedAnchors).map(([level, items]) => (
            <AccordionItem key={level} value={level}>
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{level}</Badge>
                  <span>{items[0]?.levelName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {items.length} anchors
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {items.map(anchor => (
                    <div key={anchor.id} className="border-l-2 border-primary pl-4">
                      <p className="font-medium mb-2">{highlightActionVerb(anchor.activityDescription)}</p>
                      {anchor.observableBehaviors.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-slate-dim">Observable Behaviors:</span>
                          <ul className="list-disc list-inside text-sm text-slate-dim">
                            {anchor.observableBehaviors.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {anchor.evidenceTypes.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-slate-dim">Evidence Types:</span>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {anchor.evidenceTypes.map((e, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {e}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
