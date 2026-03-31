import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Wrench, BookOpen, Sparkles, Target, ClipboardCheck,
} from 'lucide-react';
import type { PVDomain } from '@/types/pv-curriculum';

interface DomainHeaderProps {
  domain: PVDomain;
}

export function DomainHeader({ domain }: DomainHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
            {domain.id}
          </Badge>
          <Badge variant="secondary">{domain.totalKSBs} KSBs</Badge>
        </div>
        <h1 className="text-3xl font-bold font-headline mb-3 text-gold">{domain.name}</h1>
        <p className="text-slate-dim mb-4">{domain.definition}</p>

        {domain.educationalRationale && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-light">Educational Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-dim">{domain.educationalRationale}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
        <Card>
          <CardContent className="pt-4 text-center">
            <Brain className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xl font-bold">{domain.stats.knowledge}</div>
            <div className="text-xs text-slate-dim">Knowledge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Wrench className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold">{domain.stats.skills}</div>
            <div className="text-xs text-slate-dim">Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-xl font-bold">{domain.stats.behaviors}</div>
            <div className="text-xs text-slate-dim">Behaviors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-xl font-bold">{domain.stats.aiIntegration}</div>
            <div className="text-xs text-slate-dim">AI</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <div className="text-xl font-bold">{domain.stats.activityAnchors}</div>
            <div className="text-xs text-slate-dim">Anchors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-cyan-600" />
            <div className="text-xl font-bold">{domain.stats.assessmentMethods}</div>
            <div className="text-xs text-slate-dim">Methods</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
