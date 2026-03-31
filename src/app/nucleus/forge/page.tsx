import { createMetadata } from '@/lib/metadata';
import { FlaskConical } from 'lucide-react';
import { ForgeGame } from './components/forge-game';

export const metadata = createMetadata({
  title: 'Forge',
  description: 'Game-theory roguelike: collect Lex Primitiva symbols, battle antipatterns, and forge Rust code.',
  path: '/nucleus/forge',
  keywords: ['game theory', 'roguelike', 'Rust', 'primitives', 'code generation'],
});

export default function ForgePage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-400/30 bg-amber-400/5">
            <FlaskConical className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-amber-400/60">
              AlgoVigilance Forge
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Forge
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Primitive Depths — collect the 16 Lex Primitiva, neutralize antipatterns,
          and forge typed Rust code from compositional primitives
        </p>
      </header>

      <ForgeGame />
    </div>
  );
}
