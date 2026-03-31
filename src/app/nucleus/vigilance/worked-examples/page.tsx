import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Worked Examples — Signal Investigations',
  description:
    'Complete pharmacovigilance signal investigations using the AlgoVigilance Station 8-step pipeline. Real drugs, real data, real verdicts.',
  path: '/nucleus/vigilance/worked-examples',
});

const EXAMPLES = [
  {
    slug: 'semaglutide-pancreatitis',
    drug: 'Semaglutide',
    event: 'Pancreatitis',
    prr: 6.93,
    causality: 'PROBABLE',
    onLabel: true,
    date: '2026-03-31',
    badges: ['GLP-1 RA', 'On Label', 'Strong Signal'],
  },
];

export default function WorkedExamplesPage() {
  return (
    <div className="container mx-auto min-h-[calc(100vh-4rem)] px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-cyan/10 p-2">
            <FileText className="h-8 w-8 text-cyan" />
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-gold md:text-5xl">
            Worked Examples
          </h1>
        </div>
        <p className="text-base text-slate-dim md:text-lg">
          Complete signal investigations using the AlgoVigilance Station 8-step pipeline.
          Real drugs. Real FAERS data. Real microgram verdicts.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((ex) => (
          <Link key={ex.slug} href={`/nucleus/vigilance/worked-examples/${ex.slug}`}>
            <Card className="group h-full border-nex-light bg-nex-surface transition-colors hover:border-cyan/30">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ex.badges.map((b) => (
                    <Badge key={b} variant="outline" className="border-cyan/30 text-cyan text-xs">
                      {b}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-xl text-white">
                  {ex.drug} + {ex.event}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div>
                    <p className="text-xs text-slate-dim">PRR</p>
                    <p className="text-lg font-bold text-gold">{ex.prr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Causality</p>
                    <p className="text-lg font-bold text-gold">{ex.causality}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Label</p>
                    <p className="text-lg font-bold text-white">{ex.onLabel ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-dim">{ex.date}</span>
                  <span className="flex items-center gap-1 text-cyan group-hover:underline">
                    View investigation <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
