import { createMetadata } from '@/lib/metadata';
import { FlaskConical } from 'lucide-react';
import { StoichiometryLab } from './components/stoichiometry-lab';

export const metadata = createMetadata({
  title: 'Stoichiometry Lab',
  description: 'Encode domain concepts as balanced primitive equations, browse the stoichiometric dictionary, and test knowledge in Jeopardy mode',
  path: '/nucleus/vigilance/stoichiometry',
  keywords: ['stoichiometry', 'primitives', 'lex primitiva', 'balanced equation', 'pharmacovigilance'],
});

export default function StoichiometryPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-cyan/10">
            <FlaskConical className="h-8 w-8 text-cyan" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gold">
            Stoichiometry Lab
          </h1>
        </div>
        <p className="text-base md:text-lg text-slate-dim font-medium">
          Encode concepts as balanced equations of 15 operational primitives — mass conservation applied to knowledge
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">
          Lex Primitiva stoichiometric encoding engine
        </p>
      </header>

      <StoichiometryLab />
    </div>
  );
}
