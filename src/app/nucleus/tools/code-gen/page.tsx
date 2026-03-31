import { createMetadata } from '@/lib/metadata';
import { CodeGenStudio } from './components/code-gen-studio';

export const metadata = createMetadata({
  title: 'Code Gen Studio',
  description: 'Interactive code generation tool with prompt templates — powered by NexCore primitives.',
  path: '/nucleus/tools/code-gen',
  keywords: ['code generation', 'Rust', 'primitives', 'templates', 'NexCore'],
});

export default function CodeGenPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Synthesis Lab / Code Fabrication
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
          Code Gen Studio
        </h1>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-relaxed">
          Describe the construct you need — the synthesis engine generates typed Rust
          from primitive compositions
        </p>
      </header>

      <CodeGenStudio />
    </div>
  );
}
